const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  if (!write) { console.log('❌ No write tab'); process.exit(1); }

  // 새로고침 (기존 깨진 UI 리셋)
  await write.reload();
  console.log('🔄 페이지 새로고침 완료');

  // iframe 다시 찾기
  await write.waitForTimeout(3000);
  const frameEl = await write.$('#mainFrame');
  if (!frameEl) { console.log('❌ No iframe after reload'); process.exit(1); }
  const frame = await frameEl.contentFrame();
  if (!frame) { console.log('❌ Cannot access iframe'); process.exit(1); }

  // SmartEditor 로딩 대기
  await frame.waitForTimeout(2000);

  // 상태 진단
  const diag = await frame.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const title = ed.getDocumentTitle();
      const data = ed.getDocumentData();
      const titleEl = document.querySelector('div[contenteditable]');
      const seTitle = document.querySelector('.se-title');
      const titleArea = document.querySelector('#titleArea');
      const allEditables = document.querySelectorAll('[contenteditable]');
      return {
        title: title,
        blocks: data.document.blocks.length,
        seTitle: !!seTitle,
        titleArea: !!titleArea,
        titleElDisplay: titleEl ? getComputedStyle(titleEl).display : 'none',
        titleElText: titleEl ? titleEl.innerText.substring(0, 50) : 'none',
        editablesCount: allEditables.length,
        editables: Array.from(allEditables).slice(0,3).map(e => ({
          id: e.id, cls: (e.className||'').substring(0,40), text: (e.innerText||'').substring(0,30)
        })),
        hasCanvas: !!document.querySelector('.se-canvas'),
        url: location.href.substring(0, 80),
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('새로고침 후 상태:', JSON.stringify(diag, null, 2));

  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

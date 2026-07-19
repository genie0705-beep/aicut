const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  if (!write) { console.log('❌ No write tab'); process.exit(1); }

  // dialog 자동 수락
  write.on('dialog', async dialog => {
    console.log('📋 Dialog:', dialog.message().substring(0, 80));
    await dialog.accept();
    console.log('  ✅ 수락함');
  });

  // 새로고침
  await write.reload();
  console.log('🔄 페이지 새로고침 완료');

  await write.waitForTimeout(4000);
  console.log('⏳ iframe 로딩 대기 완료');
  
  // iframe 다시 찾기
  for (let tryCount = 0; tryCount < 10; tryCount++) {
    const frameEl = await write.$('#mainFrame');
    if (frameEl) {
      const frame = await frameEl.contentFrame();
      if (frame) {
        const hasSE = await frame.evaluate(() => {
          try { return typeof SmartEditor._editors['blogpc001'] !== 'undefined'; }
          catch(e) { return false; }
        });
        if (hasSE) {
          console.log('✅ iframe + SmartEditor 로드 완료 (try', tryCount+1, ')');
          const diag = await frame.evaluate(() => {
            const ed = SmartEditor._editors['blogpc001'];
            const title = ed.getDocumentTitle();
            const data = ed.getDocumentData();
            const allED = document.querySelectorAll('[contenteditable]');
            const seTitle = document.querySelector('.se-title');
            const titleArea = document.querySelector('#titleArea');
            const textEditors = document.querySelectorAll('.se-text-editor');
            return {
              title: title,
              blocks: data.document.blocks.length,
              seTitle: !!seTitle,
              titleArea: !!titleArea,
              textEditors: textEditors.length,
              editablesCount: allED.length,
              editables: Array.from(allED).slice(0,4).map(e => ({
                id: e.id, cls: (e.className||'').substring(0,50), text: (e.innerText||'').substring(0,40)
              })),
              hasCanvas: !!document.querySelector('.se-canvas'),
            };
          });
          console.log('상태:', JSON.stringify(diag, null, 2));
          process.exit(0);
        }
      }
    }
    console.log(`⏳ iframe 로딩 대기 중... (try ${tryCount+1}/10)`);
    await write.waitForTimeout(2000);
  }
  
  console.log('❌ iframe 로드 실패');
  process.exit(1);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  if (!write) { console.log('❌ No write tab'); process.exit(1); }

  write.on('dialog', async dialog => {
    console.log('📋 Dialog:', dialog.message().substring(0, 80));
    await dialog.accept();
  });

  await write.reload();
  console.log('🔄 페이지 새로고침');
  await write.waitForTimeout(4000);

  for (let tryCount = 0; tryCount < 15; tryCount++) {
    const frameEl = await write.$('#mainFrame');
    if (frameEl) {
      const frame = await frameEl.contentFrame();
      if (frame) {
        try {
          const hasSE = await frame.evaluate(() => {
            try { return typeof SmartEditor !== 'undefined' && !!SmartEditor._editors; }
            catch(e) { return false; }
          });
          if (hasSE) {
            const diag = await frame.evaluate(() => {
              const ed = SmartEditor._editors['blogpc001'];
              if (!ed) return { error: 'blogpc001 없음' };
              const title = ed.getDocumentTitle();
              const allED = document.querySelectorAll('[contenteditable]');
              const seTitle = document.querySelector('.se-title');
              const titleArea = document.querySelector('#titleArea');
              const textEditors = document.querySelectorAll('.se-text-editor');
              return {
                title: title,
                seTitle: !!seTitle,
                titleArea: !!titleArea,
                textEditors: textEditors.length,
                editablesCount: allED.length,
                editables: Array.from(allED).slice(0,5).map(e => ({
                  id: e.id, cls: (e.className||'').substring(0,60), text: (e.innerText||'').substring(0,50)
                })),
                hasCanvas: !!document.querySelector('.se-canvas'),
              };
            });
            console.log('✅ 로드 완료 (try', tryCount+1, ')');
            console.log('상태:', JSON.stringify(diag, null, 2));
            process.exit(0);
          }
        } catch(e) {
          console.log(`⚠️ try ${tryCount+1}: ${e.message.substring(0,80)}`);
        }
      }
    }
    console.log(`⏳ 로딩 중... (try ${tryCount+1}/15)`);
    await write.waitForTimeout(2000);
  }
  
  console.log('❌ 로드 실패');
  process.exit(1);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

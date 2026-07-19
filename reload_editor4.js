const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  if (!write) { console.log('❌ No write tab'); process.exit(1); }

  write.on('dialog', async dialog => { await dialog.accept(); });
  
  // If page is blank, open fresh write URL
  await write.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 SE4 에디터 페이지 로드');
  await write.waitForTimeout(4000);

  for (let tryCount = 0; tryCount < 15; tryCount++) {
    const frameEl = await write.$('#mainFrame');
    if (frameEl) {
      const frame = await frameEl.contentFrame();
      if (frame) {
        try {
          const hasSE = await frame.evaluate(() => {
            try { return typeof SmartEditor !== 'undefined' && !!SmartEditor._editors && !!SmartEditor._editors['blogpc001']; }
            catch(e) { return false; }
          });
          if (hasSE) {
            console.log('✅ SmartEditor 로드 완료 (try', tryCount+1, ')');
            
            // 제목 설정
            await frame.evaluate(() => {
              SmartEditor._editors['blogpc001'].setDocumentTitle('피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비');
            });
            
            // 캔버스 클릭해서 포커스
            const canvas = await frame.$('.se-canvas');
            if (canvas) {
              await canvas.click();
              await frame.waitForTimeout(1000);
            }
            
            // 상태 확인
            const state = await frame.evaluate(() => {
              const ed = SmartEditor._editors['blogpc001'];
              const title = ed.getDocumentTitle();
              const titleInput = document.querySelector('div[contenteditable]');
              const seTitle = document.querySelector('.se-title');
              const titleDiv = document.querySelector('#titleArea div[contenteditable]');
              const seTextEditors = document.querySelectorAll('.se-text-editor');
              const editableCount = document.querySelectorAll('[contenteditable]').length;
              const canvasText = document.querySelector('.se-canvas')?.innerText?.substring(0, 100) || '';
              return {
                title,
                seTitle: !!seTitle,
                titleDiv: !!titleDiv,
                titleInputDisplay: titleInput ? getComputedStyle(titleInput).display : 'none',
                seTextEditorsCount: seTextEditors.length,
                editableCount,
                canvasText: canvasText.substring(0, 80),
              };
            });
            console.log('상태:', JSON.stringify(state, null, 2));
            
            process.exit(0);
          }
        } catch(e) { /* skip */ }
      }
    }
    await write.waitForTimeout(2000);
  }
  console.log('❌ 로드 실패');
  process.exit(1);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

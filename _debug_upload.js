const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);
    
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('iframe not found'); return; }
    console.log('✅ 에디터 진입');

    // 사진 버튼 찾기
    for (const sel of ['button:has-text("사진")', 'button span:has-text("사진")', '.se-image-toolbar-button']) {
      const btn = await editFrame.$(sel).catch(() => null);
      if (btn) {
        const visible = await btn.isVisible();
        if (visible) {
          console.log(`사진 버튼 발견: "${sel}", visible: ${visible}`);
          
          // 화면에서 버튼 위치 확인
          const box = await btn.boundingBox();
          console.log(`  위치: x=${box?.x}, y=${box?.y}, w=${box?.width}, h=${box?.height}`);
        }
      }
    }

    // 사진 버튼 클릭 전 스크린샷
    await page.screenshot({ path: '_debug_before_photo.png' });
    
    // 사진 버튼 클릭하고 변화 관찰
    const photoBtn = await editFrame.$('button:has-text("사진")');
    if (photoBtn) {
      console.log('\n사진 버튼 클릭...');
      await photoBtn.click();
      await sleep(3000);
      
      await page.screenshot({ path: '_debug_after_photo.png' });
      
      // 새로운 dialog/overlay 확인
      const dialogInfo = await editFrame.evaluate(() => {
        const dialogs = document.querySelectorAll('[class*="dialog"], [class*="modal"], [class*="popup"], [class*="overlay"], [class*="layer"]');
        const inputs = document.querySelectorAll('input[type="file"]');
        
        return {
          dialogCount: dialogs.length,
          dialogs: Array.from(dialogs).map(d => ({
            tag: d.tagName,
            id: d.id,
            cls: d.className?.substring(0, 80),
            visible: d.offsetParent !== null,
            innerText: d.innerText?.substring(0, 100)
          })),
          fileInputs: Array.from(inputs).map(i => ({
            id: i.id,
            cls: i.className?.substring(0, 50),
            accept: i.accept,
            visible: i.offsetParent !== null
          }))
        };
      });
      
      console.log('다이얼로그 정보:', JSON.stringify(dialogInfo, null, 2));
      
      // 모든 프레임에서 input[type=file] 찾기
      for (const f of page.frames()) {
        const inputs = await f.evaluate(() => {
          return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
            url: window.location.href.substring(0, 80),
            id: i.id,
            cls: i.className?.substring(0, 40),
            accept: i.accept
          }));
        });
        if (inputs.length > 0) {
          console.log(`  Frame ${f.url().substring(0, 60)}:`, JSON.stringify(inputs));
        }
      }
    }

  } finally {
    await page.close();
  }
})();

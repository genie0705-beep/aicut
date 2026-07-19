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

    // 사진 버튼 클릭 전 스크린샷
    await page.screenshot({ path: '_debug_before_photo2.png' });
    
    // Take screenshot of the editor iframe
    await editFrame.screenshot({ path: '_debug_edit_frame.png' });
    
    // Click 사진
    const photoBtn = await editFrame.$('button.se-image-toolbar-button');
    if (!photoBtn) { console.log('사진 버튼 없음'); return; }
    await photoBtn.click();
    await sleep(3000);
    
    // After: check what popped up
    await editFrame.screenshot({ path: '_debug_after_photo2.png' });
    
    // Find new visible dialogs/layers
    const newElements = await editFrame.evaluate(() => {
      // Get all visible elements that appeared or changed
      const results = [];
      document.querySelectorAll('[class*="layer"], [class*="popup"], [class*="dialog"], [class*="modal"], [class*="flayer"], .se-image-upload-layer, .se-image-manager').forEach(el => {
        if (el.offsetParent !== null) {
          results.push({
            tag: el.tagName,
            cls: el.className?.substring(0, 80),
            id: el.id,
            innerText: (el.innerText || '').trim().substring(0, 200),
            childCount: el.children.length,
          });
        }
      });
      return results;
    });
    
    console.log('\n사진 클릭 후 새로 나타난 요소들:');
    newElements.forEach((el, i) => {
      console.log(`  [${i}] .${el.cls}`);
      console.log(`       text: ${el.innerText.substring(0, 100)}`);
    });
    
    // Also check if there's a specific image upload layer
    const uploadLayers = await editFrame.evaluate(() => {
      const layers = document.querySelectorAll('[class*="image" i][class*="upload" i], [class*="image" i][class*="manager" i], .se-image-manager, .se-image-uploader');
      return Array.from(layers).map(l => ({
        cls: l.className?.substring(0, 60),
        visible: l.offsetParent !== null,
        text: (l.innerText || '').trim().substring(0, 150)
      }));
    });
    console.log('\n이미지 레이어:', JSON.stringify(uploadLayers, null, 2));

  } finally {
    await page.close();
  }
})();

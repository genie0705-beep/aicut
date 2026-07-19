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

    // Monitor network for upload requests
    const uploadUrls = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('upload') || url.includes('image') || url.includes('file')) {
        uploadUrls.push({ url: url.substring(0, 100), status: response.status() });
      }
    });

    // Click 사진
    const photoBtn = await editFrame.$('button.se-image-toolbar-button');
    await photoBtn.click();
    await sleep(3000);
    
    // After 사진 click, find all visible button-like elements
    const visibleButtons = await editFrame.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a, [role="button"], li, [tabindex]'))
        .filter(el => el.offsetParent !== null && (el.innerText || el.textContent || '').trim().length > 0)
        .map(el => ({
          tag: el.tagName,
          text: (el.innerText || el.textContent || '').trim().substring(0, 50),
          cls: el.className?.substring(0, 60),
          id: el.id,
          rect: el.getBoundingClientRect().width > 0 ? `${Math.round(el.getBoundingClientRect().x)},${Math.round(el.getBoundingClientRect().y)} ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}` : 'hidden',
        }))
        .filter(el => el.text.length > 0);
    });
    
    console.log('\n사진 클릭 후 visible 버튼/링크들:');
    visibleButtons.forEach((b, i) => {
      if (b.text.includes('사진') || b.text.includes('업로드') || b.text.includes('내PC') || b.text.includes('파일') || b.text.includes('MYBOX')) {
        console.log(`  >> [${i}] <${b.tag}> "${b.text}" cls="${b.cls}" rect=${b.rect}`);
      }
    });
    
    // Also check for file inputs
    const allFileInputs = await editFrame.evaluate(() => {
      return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
        id: i.id,
        cls: i.className?.substring(0, 40),
        parentCls: i.parentElement?.className?.substring(0, 40),
        visible: i.offsetParent !== null,
        rect: i.getBoundingClientRect().width > 0 ? `${Math.round(i.getBoundingClientRect().x)},${Math.round(i.getBoundingClientRect().y)}` : 'hidden',
      }));
    });
    console.log('\nfile inputs:', JSON.stringify(allFileInputs, null, 2));
    
    // 네트워크 요청
    console.log('\n네트워크 요청:', JSON.stringify(uploadUrls, null, 2));

    await page.screenshot({ path: '_debug_photo_flow.png' });

  } finally {
    page.removeAllListeners('response');
    await page.close();
  }
})();

const { chromium } = require('playwright');
const path = require('path');
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
    if (!editFrame) { return; }

    // Click 사진
    await editFrame.click('button.se-image-toolbar-button');
    await sleep(2000);

    // Get ALL visible interactive elements with their positions
    // Focus on: image-related buttons, file inputs, upload areas
    const afterClick = await editFrame.evaluate(() => {
      const items = document.querySelectorAll('button, a, [role="button"], input, label, li');
      const results = [];
      items.forEach(el => {
        if (el.offsetParent !== null && el.getBoundingClientRect().width > 0) {
          const text = (el.textContent || '').trim();
          const rect = el.getBoundingClientRect();
          if (text.length > 0 || el.tagName === 'INPUT') {
            results.push({
              tag: el.tagName,
              text: text.substring(0, 40),
              cls: el.className?.substring(0, 50),
              id: el.id,
              type: el.getAttribute('type') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height),
            });
          }
        }
      });
      return results;
    });
    
    // Filter for image-related elements
    const imgRelated = afterClick.filter(el => 
      el.text.toLowerCase().includes('사진') || 
      el.text.toLowerCase().includes('이미지') || 
      el.text.toLowerCase().includes('업로드') || 
      el.text.toLowerCase().includes('추가') ||
      el.text.toLowerCase().includes('내pc') ||
      el.type === 'file' ||
      el.id === 'hidden-file'
    );
    
    console.log('사진 클릭 후 이미지 관련 요소:');
    imgRelated.forEach(el => console.log(`  [${el.x},${el.y} ${el.w}×${el.h}] <${el.tag}> id="${el.id}" type="${el.type}" text="${el.text}" cls="${el.cls}"`));

    // Also capture what the 사진 button actually does by monitoring network
    console.log('\nAdditional non-image buttons that might be upload-related:');
    afterClick.filter(el => 
      el.text.includes('MYBOX') || el.text.includes('파일')
    ).forEach(el => console.log(`  [${el.x},${el.y}] <${el.tag}> "${el.text}"`));

    // Check if the 사진 toolbar has a dropdown with upload option
    const afterScreenshot = await page.screenshot({ path: '_debug_photo_dropdown.png' });
    console.log('\n스크린샷 저장됨');

    // Try clicking the image option in the toolbar (the second 사진 in the toolbar)
    // The toolbar after clicking 사진 shows options like 사진 교체, 사진 편집
    // For NEW images, maybe we need to click the "사진 추가" option
    console.log('\n툴바 항목들 (y > 80):');
    afterClick.filter(el => el.y > 80 && el.y < 200).forEach(el => 
      console.log(`  [${el.x},${el.y}] <${el.tag}> "${el.text}"`)
    );

  } finally {
    await page.close();
  }
})();

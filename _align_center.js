const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  // Step 1: Select all text (Ctrl+A)
  console.log('=== 전체 선택 ===');
  await page.mouse.click(500, 300); // Click somewhere in editor
  await page.waitForTimeout(500);
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.waitForTimeout(1000);
  console.log('Ctrl+A done');
  
  // Step 2: Click 정렬 button and choose center
  console.log('=== 센터 정렬 ===');
  const result = await page.evaluate(() => {
    // Find all buttons by text
    const btns = document.querySelectorAll('button');
    let alignBtn = null;
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text.startsWith('정렬')) {
        const r = btn.getBoundingClientRect();
        alignBtn = { x: r.x + r.width/2, y: r.y + r.height/2 };
        break;
      }
    }
    return alignBtn;
  });
  
  if (result) {
    console.log('정렬 button at:', result.x, result.y);
    await page.mouse.click(result.x, result.y);
    await page.waitForTimeout(1000);
    
    // Look for center align option in dropdown
    const centerBtn = await page.evaluate(() => {
      // Check for visible center align buttons
      const all = document.querySelectorAll('button, div[role="button"], li, [class*="option"]');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > 10 && r.height > 10) {
          const text = (el.innerText || '').trim();
          const ariaLabel = el.getAttribute('aria-label') || '';
          const cls = el.className || '';
          if (text.includes('가운데') || text.includes('센터') || text === 'center' || 
              ariaLabel.includes('center') || ariaLabel.includes('가운데') ||
              cls.includes('center') || cls.includes('가운데')) {
            return { x: r.x + r.width/2, y: r.y + r.height/2, text: text.substring(0, 15) };
          }
        }
      }
      // Try finding SVGs or icons near the button
      const svgs = document.querySelectorAll('svg');
      for (const svg of svgs) {
        const ariaLabel = svg.getAttribute('aria-label') || '';
        if (ariaLabel.includes('가운데') || ariaLabel.includes('center')) {
          const r = svg.getBoundingClientRect();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (centerBtn) {
      console.log('가운데 정렬 at:', centerBtn.x, centerBtn.y, centerBtn.text);
      await page.mouse.click(centerBtn.x, centerBtn.y);
      await page.waitForTimeout(1000);
      console.log('✅ 가운데 정렬 적용');
    } else {
      console.log('❌ 가운데 정렬 옵션 찾지 못함');
      // Try clicking the align button again to toggle
      await page.mouse.click(result.x + 30, result.y + 30);
      await page.waitForTimeout(500);
    }
  } else {
    console.log('❌ 정렬 버튼 찾지 못함');
  }
  
  // Save
  console.log('\n=== 저장 ===');
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  console.log('✅ 저장');
  
  await page.screenshot({ path: 'center_done.png' });
  await b.close();
})();

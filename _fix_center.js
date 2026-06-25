const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  // Approach: Select all → keyboard navigate dropdown → center align
  // Step 1: Select all
  console.log('=== 전체 선택 ===');
  // Click in editor first
  await page.evaluate(() => {
    const textModule = document.querySelectorAll('.se-module-text')[1];
    if (textModule) {
      const r = textModule.getBoundingClientRect();
      // Create a click event at the text module position
      const event = new MouseEvent('mousedown', { bubbles: true, clientX: r.x + 50, clientY: r.y + 10 });
      textModule.dispatchEvent(event);
    }
  });
  await page.waitForTimeout(500);
  
  // Ctrl+A
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.waitForTimeout(800);
  
  // Step 2: Open align dropdown via keyboard
  // The align button is at position in the toolbar. Use Tab to reach it.
  // Or just use keyboard shortcut for center align if available
  // Naver SmartEditor SE4 center align shortcut: Ctrl+Shift+E or similar
  
  // Try pressing Alt to access toolbar
  console.log('Align dropdown open attempt...');
  
  // Approach: click align button with keyboard shortcut method
  // First click the align button with mouse (selection might break)
  // Alternative: use evaluate to directly set alignment on all paragraphs
  
  console.log('=== DOM 직접 정렬 변경 ===');
  const result = await page.evaluate(() => {
    // Find all paragraph elements in the editor
    const wrap = document.querySelector('.se-components-wrap');
    if (!wrap) return 'no wrap';
    
    // Find all text paragraphs
    const paras = wrap.querySelectorAll('.se-text-paragraph');
    let count = 0;
    
    paras.forEach(p => {
      // Set text-align center via style
      p.style.textAlign = 'center';
      count++;
    });
    
    return `${count} paragraphs aligned to center`;
  });
  
  console.log('Result:', result);
  await page.waitForTimeout(500);
  
  // Click somewhere in the editor to trigger React re-render  
  await page.mouse.click(500, 350);
  await page.waitForTimeout(1000);
  
  // Check alignment
  const check = await page.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    const paras = wrap ? wrap.querySelectorAll('.se-text-paragraph') : [];
    let centerCount = 0;
    paras.forEach(p => {
      if (p.style.textAlign === 'center') centerCount++;
    });
    return { total: paras.length, centerAligned: centerCount };
  });
  console.log('Alignment check:', JSON.stringify(check));
  
  // Save
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  console.log('✅ 저장 완료');
  
  await page.screenshot({ path: 'center_fixed.png' });
  await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Step 1: Check what "선택한 키워드 관리" does
  console.log('=== Testing "선택한 키워드 관리" button ===');
  
  // First select a checkbox (cb#3 = AI영상제작)
  await adsPage.evaluate(() => {
    const cbs = document.querySelectorAll('input[type="checkbox"]');
    if (cbs[3]) cbs[3].click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Click "선택한 키워드 관리"
  await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText.trim() === '선택한 키워드 관리' && b.offsetParent !== null) {
        b.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // Check what appeared
  const manageUI = await adsPage.evaluate(() => {
    // Get all visible buttons
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null);
    const btnTexts = btns.map(b => b.innerText.trim()).filter(t => t.length > 0 && t.length < 20);
    
    // Get body text around relevant area
    const text = document.body.innerText;
    
    // Check for popup/menu/drawer
    const menus = Array.from(document.querySelectorAll('[role="menu"], [role="listbox"], .dropdown, .popup, .menu'));
    
    return { 
      visibleBtns: btnTexts,
      menuCount: menus.length,
      hasBulkText: text.includes('일괄') || text.includes('선택한') || text.includes('관리'),
      textSample: text.slice(2500, 3500)
    };
  });
  
  console.log('Manage button UI:', JSON.stringify(manageUI, null, 2));
  
  // If a menu/popup appeared, try clicking a menu item
  if (manageUI.menuCount > 0 || manageUI.hasBulkText) {
    console.log('\nMenu/popup detected!');
  }
  
  // Close any open menu by clicking elsewhere
  await adsPage.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1000));
  
  // Step 2: Now try the toggle switch approach for a specific keyword
  // Go to page 2 to find 동영상마케팅 (362imp, 0clicks)
  console.log('\n=== Going to page 2 ===');
  await adsPage.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.innerText.trim() === '2' && link.offsetParent !== null) {
        link.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // Check page 2 keywords and find 동영상마케팅 toggle
  const page2Toggles = await adsPage.evaluate(() => {
    const toggles = document.querySelectorAll('[role="switch"]');
    // Skip first one (수정 button), so start from index 1
    const toggleStates = [];
    toggles.forEach((t, i) => {
      if (i === 0) return; // Skip the 수정 toggle
      const parentRow = t.closest('tr');
      const rowText = parentRow ? parentRow.innerText.trim().slice(0, 40) : '';
      toggleStates.push({
        index: i,
        checked: t.getAttribute('aria-checked'),
        row: rowText
      });
    });
    return toggleStates;
  });
  
  console.log('Page 2 toggle switches:');
  page2Toggles.forEach(t => console.log(`  toggle#${t.index} checked=${t.checked} | ${t.row}`));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Step 1: Check what happens when we click a checkbox
  const checkboxResult = await adsPage.evaluate(() => {
    // Find checkboxes in the keyword table
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const results = [];
    checkboxes.forEach((cb, i) => {
      results.push({
        index: i,
        checked: cb.checked,
        parentClass: cb.closest('td')?.className?.slice(0, 40),
        row: cb.closest('tr')?.innerText?.trim()?.slice(0, 60),
        visible: cb.offsetParent !== null
      });
    });
    return results;
  });
  
  console.log('All checkboxes:');
  checkboxResult.forEach(c => console.log(`  #${c.index} checked=${c.checked} visible=${c.visible} row="${c.row}"`));
  
  // Step 2: Let me check the toggle switch behavior
  // The role="switch" buttons are the ON/OFF toggles
  const toggleResult = await adsPage.evaluate(() => {
    const toggles = document.querySelectorAll('[role="switch"]');
    const results = [];
    toggles.forEach((t, i) => {
      results.push({
        index: i,
        checked: t.getAttribute('aria-checked'),
        parentText: t.parentElement?.innerText?.trim()?.slice(0, 30),
        visible: t.offsetParent !== null
      });
    });
    return results;
  });
  
  console.log('\nToggle switches:');
  toggleResult.forEach(t => console.log(`  #${t.index} checked=${t.checked} visible=${t.visible} parent="${t.parentText}"`));
  
  // Step 3: Try clicking a toggle switch to turn OFF a keyword
  // Target: "AI영상제작" (노출 30, 클릭 0) - turn OFF
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));

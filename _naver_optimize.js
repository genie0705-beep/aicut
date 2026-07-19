const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // 1. Check current checklist of all keywords across pages
  // Let me first check what ON/OFF toggles look like
  const pageStructure = await adsPage.evaluate(() => {
    // Find toggle switches
    const toggles = document.querySelectorAll('[role="switch"], input[type="checkbox"], .toggle, .switch');
    return Array.from(toggles).slice(0, 5).map(t => ({
      tag: t.tagName,
      type: t.getAttribute('type'),
      role: t.getAttribute('role'),
      checked: t.checked || t.getAttribute('aria-checked'),
      className: t.className?.slice(0, 40),
      parentText: t.parentElement?.innerText?.trim()?.slice(0, 30)
    }));
  });
  
  console.log('Toggle elements found:');
  pageStructure.forEach(t => console.log(' ', JSON.stringify(t)));
  
  // Check if there are clickable checkboxes/toggles in the first row
  const firstRowHtml = await adsPage.evaluate(() => {
    const trs = document.querySelectorAll('table tr');
    if (trs.length < 3) return 'No table rows found';
    
    // Find the first data row (skip header)
    for (let i = 2; i < trs.length; i++) {
      const inner = trs[i].innerHTML?.slice(0, 500);
      if (inner && !inner.includes('ON/OFF') && inner.length > 50) {
        return `Row ${i}: ${inner}`;
      }
    }
    return 'No data row found';
  });
  
  console.log('\nFirst data row HTML:');
  console.log(firstRowHtml);
  
  // Check all A links on the page that might be related to keyword management
  const actionLinks = await adsPage.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button')).map(el => ({
      text: el.innerText?.trim()?.slice(0, 30),
      tag: el.tagName,
      visible: el.offsetParent !== null
    })).filter(el => el.text && 
      (el.text.includes('키워드') || el.text.includes('입찰') || 
       el.text.includes('관리') || el.text.includes('수정') ||
       el.text.includes('ON') || el.text.includes('OFF'))
    );
  });
  
  console.log('\nManagement buttons:');
  actionLinks.forEach(l => console.log(' ', l.tag, l.visible ? 'VIS' : 'HID', '|', l.text));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));

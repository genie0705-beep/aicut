const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) { console.log('no page'); await b.close(); return; }
  
  await p.bringToFront();
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  // Get full menu structure from HTML
  const menuStructure = await p.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const menuEls = [];
    allElements.forEach(el => {
      const text = el.innerText.trim();
      if (text && el.children.length === 0 && el.offsetParent !== null) {
        // Leaf elements that are visible
        const parentText = el.parentElement ? el.parentElement.innerText.trim().substring(0, 30) : '';
        menuEls.push({
          text: text.substring(0, 40),
          tag: el.tagName,
          parent: parentText
        });
      }
    });
    
    // Filter to unique meaningful items
    const seen = new Set();
    return menuEls.filter(item => {
      if (seen.has(item.text)) return false;
      seen.add(item.text);
      return item.text.length > 1 && item.text.length < 30;
    }).slice(0, 50);
  });
  
  console.log('=== 화면의 모든 텍스트 요소 ===');
  menuStructure.forEach(item => {
    if (!item.text.includes('https://') && !item.text.includes('개인정보') && !item.text.includes('이용약관')) {
      console.log(item.text);
    }
  });
  
  // Attempt to get all sidebar links and their hrefs
  const allSidebarLinks = await p.evaluate(() => {
    const links = document.querySelectorAll('a[href*="manage"], a[href*="settings"], a[href*="billing"]');
    const result = [];
    links.forEach(a => {
      const href = a.href || '';
      if (href.includes('ads.naver.com')) {
        result.push({
          text: a.innerText.trim().substring(0, 40) || '[icon]',
          href: href.substring(0, 120)
        });
      }
    });
    return result;
  });
  
  console.log('\n=== 사이드바 + 내부 링크 ===');
  allSidebarLinks.forEach(item => console.log(item.text + ' | ' + item.href));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

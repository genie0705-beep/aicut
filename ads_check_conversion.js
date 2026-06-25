const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) { console.log('no ads page'); await b.close(); return; }
  
  await p.bringToFront();
  
  // Click on 도구 in the sidebar menu
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await p.waitForTimeout(3000);
  
  // Find all sidebar links
  const sidebarInfo = await p.evaluate(() => {
    const links = document.querySelectorAll('a');
    const sidebarLinks = [];
    links.forEach(a => {
      const href = a.href || '';
      const text = a.innerText.trim();
      if (text && href && (href.includes('ads.naver.com/manage'))) {
        sidebarLinks.push({ text: text.substring(0, 30), href: href.substring(0, 100) });
      }
    });
    return sidebarLinks.slice(0, 30);
  });
  
  console.log('=== 사이드바 링크 ===');
  sidebarInfo.forEach(item => console.log(item.text + ' -> ' + item.href));
  
  // Check for conversion tracking related links
  const conversionLinks = sidebarInfo.filter(item => 
    item.text.includes('전환') || item.text.includes('커스텀') || item.href.includes('conversion') || item.href.includes('tracking')
  );
  console.log('\n=== 전환 관련 ===');
  conversionLinks.forEach(item => console.log(item.text + ' -> ' + item.href));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

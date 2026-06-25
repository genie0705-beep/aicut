const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) { await b.close(); return; }
  await p.bringToFront();
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  // Find and click "도구" menu item
  const result = await p.evaluate(() => {
    // Find all LI elements with submenu class
    const allLis = document.querySelectorAll('li');
    let clicked = '';
    for (const li of allLis) {
      if (li.innerText.includes('도구') && li.className.includes('submenu')) {
        // Check if it has child links
        const childLinks = li.querySelectorAll('a');
        if (childLinks.length > 0) {
          const linkInfo = Array.from(childLinks).map(a => ({
            text: a.innerText.trim().substring(0, 30),
            href: a.href.substring(0, 100)
          }));
          clicked = 'found submenu with ' + childLinks.length + ' links';
          return { clicked, links: linkInfo };
        }
        li.click();
        clicked = 'clicked 도구 (li)';
        return { clicked, links: [] };
      }
    }
    return { clicked: 'no 도구 submenu found', links: [] };
  });
  
  console.log('도구 클릭:', JSON.stringify(result));
  
  if (result.clicked.includes('clicked')) {
    await p.waitForTimeout(2000);
    // Check what appeared
    const after = await p.evaluate(() => {
      const bodyText = document.body.innerText;
      // Look for any text containing '전환' or 'conversion'
      const lines = bodyText.split('\n').filter(l => l.includes('전환') || l.includes('conversion') || l.includes('추적'));
      return lines;
    });
    console.log('전환 관련 텍스트:', after);
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

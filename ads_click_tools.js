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

  // Go to dashboard
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  // Click on "도구" in the sidebar to expand menu
  const toolClicked = await p.evaluate(() => {
    // Find element with text "도구"
    const elements = document.querySelectorAll('a, span, div, button, li');
    for (const el of elements) {
      if (el.innerText.trim() === '도구' && el.offsetParent !== null) {
        el.click();
        return 'clicked: ' + el.tagName + ' class=' + (el.className || '').substring(0, 40);
      }
    }
    return 'not found';
  });
  
  console.log('도구 메뉴 클릭:', toolClicked);
  await p.waitForTimeout(2000);
  
  // Now check what sub-items appeared
  const subItems = await p.evaluate(() => {
    const links = document.querySelectorAll('a');
    const visible = [];
    links.forEach(a => {
      if (a.offsetParent !== null && a.innerText.trim()) {
        visible.push({
          text: a.innerText.trim().substring(0, 30),
          href: a.href.substring(0, 100)
        });
      }
    });
    return visible;
  });
  
  console.log('\n=== 보이는 링크들 ===');
  subItems.forEach(item => {
    if (!item.href.includes('notice') && !item.href.includes('adguide') && !item.href.includes('policy')) {
      console.log(item.text + ' -> ' + item.href);
    }
  });
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p.waitForTimeout(4000);
  }
  await p.bringToFront();
  await p.waitForTimeout(2000);
  
  // Try to click on "도구" menu item
  const clickResult = await p.evaluate(() => {
    // Try clicking on the 도구 element and its parent
    const allEls = document.querySelectorAll('*');
    for (const el of allEls) {
      if (el.innerText && el.innerText.trim() === '도구' && el.children.length > 0 && el.offsetParent !== null) {
        el.click();
        return 'clicked 도구 with children. children count: ' + el.children.length;
      }
    }
    for (const el of allEls) {
      if (el.innerText && el.innerText.trim() === '도구' && el.offsetParent !== null) {
        el.click();
        return 'clicked 도구 (leaf). tag=' + el.tagName;
      }
    }
    return '도구 not found';
  });
  console.log('1:', clickResult);
  await p.waitForTimeout(3000);
  
  // Check what text now appears
  const currentText = await p.evaluate(() => {
    const body = document.body.innerText;
    const lines = body.split('\n').filter(l => l.trim());
    const idx = lines.findIndex(l => l.trim() === '대시보드');
    return lines.slice(idx, idx + 20);
  });
  console.log('2: 사이드바 변경');
  currentText.forEach((l, i) => console.log('  ' + i + ': ' + l));
  
  // Also check the URL for any change
  const url = p.url();
  console.log('3: URL:', url.substring(0, 100));
  
  // Try clicking on specific 도구 menu
  // The sidebar might use an anchor tag or a div
  const sidebarItems = await p.evaluate(() => {
    const links = document.querySelectorAll('a');
    const sideLinks = [];
    links.forEach(a => {
      if (a.offsetParent !== null) {
        const t = a.innerText.trim();
        if (t && t.length < 15) sideLinks.push({ text: t, href: (a.href || '').substring(0, 100) });
      }
    });
    return sideLinks;
  });
  console.log('4: 보이는 링크:');
  sidebarItems.forEach(item => console.log('  ' + item.text + ' -> ' + item.href));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

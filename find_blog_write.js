const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  const btns = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button, span'))
      .filter(el => {
        const t = el.textContent.trim();
        return t.includes('글쓰기') || t.includes('글 작성');
      })
      .map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 30),
        href: el.href || '',
        onclick: (el.getAttribute('onclick') || '').substring(0, 60)
      }));
  });
  
  console.log('Write buttons:', JSON.stringify(btns));
  
  if (btns.length > 0) {
    const first = btns[0];
    console.log('Clicking:', first.text);
    if (first.href && first.href.startsWith('http')) {
      await p.goto(first.href, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await p.waitForTimeout(3000);
      const url = await p.evaluate(() => window.location.href.substring(0, 120));
      console.log('New URL:', url);
      const text = await p.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' ').trim());
      console.log('Page text:', text);
    }
  } else {
    const text = await p.evaluate(() => document.body.innerText.substring(0, 500).replace(/\n/g, ' ').trim());
    console.log('Page:', text);
  }
  
  await p.close();
})();

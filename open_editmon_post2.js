const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('editmon'));
  if (!p) return;
  
  // 모든 tr의 두 번째 td에서 a 태그 찾기 (게시물 제목)
  const post = await p.evaluate(() => {
    const rows = document.querySelectorAll('tr');
    for (const row of rows) {
      const tds = row.querySelectorAll('td');
      if (tds.length >= 2) {
        const a = tds[1].querySelector('a');
        if (a && a.textContent.trim().length > 5) {
          const txt = a.textContent.trim();
          if (!txt.includes('회사명') && !txt.includes('모집제목') && !txt.includes('안내')) {
            return { text: txt.substring(0, 50), href: a.href };
          }
        }
      }
    }
    return null;
  });
  
  if (post && post.href && post.href.startsWith('http')) {
    console.log('Clicking:', post.text, 'URL:', post.href);
    await p.goto(post.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p.waitForTimeout(2000);
    
    const detail = await p.evaluate(() => ({
      url: window.location.href.substring(0, 100),
      text: document.body.innerText.replace(/\n/g, ' ').trim().substring(0, 2000)
    }));
    console.log('DETAIL:', detail.text.substring(0, 500));
    
    const email = await p.evaluate(() => {
      const m = document.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      return m ? m[0] : 'NO EMAIL';
    });
    console.log('EMAIL:', email);
    
  } else {
    console.log('No valid post found');
    const text = await p.evaluate(() => document.body.innerText.replace(/\n/g, ' ').trim().substring(0, 300));
    console.log('Page:', text);
  }
})();

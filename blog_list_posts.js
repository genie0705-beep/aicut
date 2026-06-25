const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('blog.naver.com')) { p = pg; break; }
  }
  if (!p) { await b.close(); return; }
  await p.bringToFront();
  
  await p.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(()=>{});
  await p.waitForTimeout(5000);
  
  const posts = await p.evaluate(() => {
    const links = document.querySelectorAll('a');
    const result = [];
    const seen = new Set();
    links.forEach(a => {
      const href = a.href;
      const text = a.innerText.trim();
      const match = href && href.match(/aicut\/(\d+)/);
      if (match && text.length > 10 && !seen.has(match[1])) {
        seen.add(match[1]);
        result.push({ text: text.substring(0, 60), id: match[1], href: href.substring(0, 100) });
      }
    });
    return result;
  });
  
  console.log('=== 블로그 포스팅 목록 ===');
  posts.forEach(post => {
    console.log(post.id + ': ' + post.text);
  });
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

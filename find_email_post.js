const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('editmon'));
  if (!p) return console.log('no editmon tab');

  // 1페이지부터 게시물들을 다시 스캔하면서 doordragon1@gmail.com 찾기
  const targetEmail = 'doordragon1@gmail.com';
  
  for (let page = 1; page <= 10; page++) {
    await p.goto('https://editmon.com/work/employ_list.html?page=' + page, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(1500);
    
    // 게시물 링크 찾기
    const posts = await p.evaluate(() => {
      const all = document.querySelectorAll('a[href*="employ_detail"]');
      return Array.from(all).map(a => ({
        text: a.textContent.trim(),
        href: a.href
      })).filter(x => x.text.length > 5);
    });
    
    // 중복 제거
    const unique = [];
    const seen = new Set();
    posts.forEach(p => {
      if (!seen.has(p.href)) {
        seen.add(p.href);
        unique.push(p);
      }
    });
    
    console.log('Page ' + page + ': ' + unique.length + ' posts found');
    
    // 각 게시물로 이동해서 이메일 확인
    for (const post of unique) {
      await p.goto(post.href, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(800);
      
      const hasEmail = await p.evaluate((email) => {
        return document.body.innerText.includes(email);
      }, targetEmail);
      
      if (hasEmail) {
        const title = await p.evaluate(() => {
          // Extract title
          const text = document.body.innerText;
          const lines = text.split('\n').filter(l => l.trim().length > 5);
          return lines.slice(0, 20).join(' | ');
        });
        console.log('FOUND!');
        console.log('Post URL:', post.href);
        console.log('Post title:', post.text);
        console.log('Content:', title.substring(0, 300));
        return;
      }
    }
  }
  
  console.log('Email not found in any post');
})();

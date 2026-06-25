const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  let page = ctx.pages().find(p => p.url().includes('blog.naver.com/aicut'));
  if (!page) page = await ctx.newPage();
  
  // 1. 영상 마케팅 카테고리
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=16', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  const mf = page.frame({ name: 'mainFrame' });
  if (!mf) { console.log('mainFrame 없음'); await b.close(); process.exit(0); }
  
  const cat16 = await mf.evaluate(() => {
    const posts = [];
    document.querySelectorAll('a[href*="logNo"]').forEach(a => {
      const title = a.innerText?.trim() || '';
      const href = a.getAttribute('href') || '';
      if (title.length > 5) {
        // 날짜는 주변 요소에서 찾기
        const parent = a.closest('div, li, td');
        let date = '';
        if (parent) {
          const dateEl = parent.querySelector('.date, [class*="date"], span[class]');
          date = dateEl?.innerText?.trim() || '';
        }
        posts.push({ title: title.substring(0, 60), date, href: href.substring(0, 60) });
      }
    });
    return posts;
  });
  console.log('=== 영상 마케팅 카테고리 ===');
  cat16.forEach((p, i) => console.log(` ${i+1}. ${p.date} ${p.title}`));
  
  // 2. 고객사례 도입이야기 카테고리
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=15', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  const mf2 = page.frame({ name: 'mainFrame' });
  const cat15 = mf2 ? await mf2.evaluate(() => {
    const posts = [];
    document.querySelectorAll('a[href*="logNo"]').forEach(a => {
      const title = a.innerText?.trim() || '';
      const href = a.getAttribute('href') || '';
      if (title.length > 5) {
        const parent = a.closest('div, li, td');
        let date = '';
        if (parent) {
          const dateEl = parent.querySelector('.date, [class*="date"], span[class]');
          date = dateEl?.innerText?.trim() || '';
        }
        posts.push({ title: title.substring(0, 60), date, href: href.substring(0, 60) });
      }
    });
    return posts;
  }) : [];
  
  console.log('\n=== 고객사례 도입이야기 카테고리 ===');
  cat15.forEach((p, i) => console.log(` ${i+1}. ${p.date} ${p.title}`));
  
  // 3. 전체 포스팅 (카테고리 없이)
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=0', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  const mf3 = page.frame({ name: 'mainFrame' });
  const allPosts = mf3 ? await mf3.evaluate(() => {
    const posts = [];
    document.querySelectorAll('a[href*="logNo"]').forEach(a => {
      const title = a.innerText?.trim() || '';
      const href = a.getAttribute('href') || '';
      if (title.length > 5) {
        const parent = a.closest('div, li, td, section');
        let date = '';
        let viewCount = '';
        let commentCount = '';
        if (parent) {
          const text = parent.innerText || '';
          const dateMatch = text.match(/(\d{4}\.\s*\d{1,2}\.\s*\d{1,2})/);
          if (dateMatch) date = dateMatch[1];
          const viewMatch = parent.innerText.match(/조회\s*(\d+)/);
          if (viewMatch) viewCount = viewMatch[1];
        }
        posts.push({ title: title.substring(0, 60), date, views: viewCount });
      }
    });
    return posts;
  }) : [];
  
  console.log('\n=== 전체 포스팅 (전체보기) ===');
  allPosts.forEach((p, i) => console.log(` ${i+1}. [${p.date}] ${p.title} ${p.views ? '(조회'+p.views+')' : ''}`));
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // 게시물 썸네일 목록
  const posts = await page.evaluate(() => {
    // 게시물 링크 (a 태그)
    const links = document.querySelectorAll('a[href*="/p/"]');
    const result = [];
    links.forEach((a, i) => {
      if (i < 12) {
        const href = a.getAttribute('href');
        // 좋아요/댓글 수 (썸네일 위에 오버레이로 표시)
        const likeEl = a.querySelector('[class*=like], [class*=heart], svg');
        const commentEl = a.querySelector('[class*=comment]');
        result.push({
          href: href?.substring(0, 40),
          alt: a.querySelector('img')?.getAttribute('alt')?.substring(0, 60) || ''
        });
      }
    });
    return result;
  }).catch(e => ({error: e.message}));
  
  console.log('=== 최근 게시물 ===');
  if (Array.isArray(posts)) {
    posts.forEach((p, i) => console.log(`${i+1}. ${p.href} - ${p.alt}`));
  } else {
    console.log(JSON.stringify(posts));
  }
  
  // 첫 번째 게시물 클릭해서 상세 정보 확인
  if (Array.isArray(posts) && posts.length > 0) {
    const firstPostHref = posts[0].href;
    if (firstPostHref) {
      await page.goto('https://www.instagram.com' + firstPostHref, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const postDetail = await page.evaluate(() => {
        const text = document.body?.innerText || '';
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        return lines.slice(0, 30);
      });
      
      console.log('\n=== 첫 번째 게시물 상세 ===');
      for (const l of postDetail) console.log(l);
    }
  }
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });

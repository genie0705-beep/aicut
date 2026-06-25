const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 1. 블로그 메인 페이지에서 모든 포스트 URL 수집
  console.log('=== 포스트 목록 수집 ===');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Blog URL:', url);
  
  // PostList 카테고리별로 접근
  const categories = [65, 10, 17]; // 자주 쓰는 카테고리 번호들
  const postUrls = new Set();
  
  // 각 카테고리 페이지에서 포스트 링크 수집
  for (const cat of categories) {
    try {
      await page.goto(`https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=${cat}&directAccess=true&userTopMenuOpen=true`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // iframe 내부 확인
      const frames = page.frames();
      for (const f of frames) {
        try {
          const links = await f.evaluate(() => {
            const result = [];
            document.querySelectorAll('a').forEach(a => {
              const href = a.href || '';
              if (href.includes('/aicut/') && href.match(/\/\d+$/)) {
                result.push(href);
              }
            });
            return result;
          });
          links.forEach(l => postUrls.add(l));
        } catch(e) {}
      }
    } catch(e) {}
  }
  
  // 메인 페이지에서도 수집
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const mainLinks = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('a').forEach(a => {
      const href = a.href || '';
      if (href.includes('/aicut/') && href.match(/\/\d+$/)) {
        result.push(href);
      }
    });
    return result;
  });
  mainLinks.forEach(l => postUrls.add(l));
  
  console.log(`수집된 포스트: ${postUrls.size}개`);
  console.log(Array.from(postUrls).join('\n'));
  
  // 2. 각 포스트 확인
  console.log('\n=== contact@aicut.co.kr 검색 ===');
  const foundPosts = [];
  
  for (const url of postUrls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);
      
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('contact@aicut.co.kr')) {
        foundPosts.push(url);
        console.log(`🔍 ${url.substring(0, 70)}... contact@ 발견!`);
      }
    } catch(e) {
      console.log(`❌ ${url.substring(0, 50)}... 에러`);
    }
  }
  
  console.log(`\ncontact@aicut.co.kr 포함 포스트: ${foundPosts.length}개`);
  foundPosts.forEach(p => console.log(p));
  
  await page.screenshot({ path: 'blog_posts_check.png' });
  await b.close();
})();

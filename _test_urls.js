const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Try direct SmartEditor URLs
  const urls = [
    'https://blog.naver.com/PostWrite.naver?blogId=aicut',
    'https://blog.naver.com/PostWrite.naver?blogId=aicut&isDraft=true',
    'https://blog.naver.com/blog/editor?blogId=aicut',
    'https://admin.blog.naver.com/aicut/posts/new',
  ];
  
  for (const url of urls) {
    try {
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const title = await page.title();
      const html = await page.content();
      const isError = html.includes('error_h1') || html.includes('페이지 주소를 확인');
      const isEditor = html.includes('SmartEditor') || html.includes('se-main-container') || html.includes('editor');
      console.log(url.substring(0, 70), '| Title:', title.substring(0, 30), '| Error:', isError, '| Editor:', isEditor, '| Len:', html.length);
      await page.close();
    } catch(e) {
      console.log(url.substring(0, 70), '| ERROR:', e.message.substring(0, 50));
    }
  }
  
  await b.close();
})();

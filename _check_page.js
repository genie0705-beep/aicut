const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 먼저 블로그 메인으로 로그인 확인
    await page.goto('https://blog.naver.com/aicut', { waitUntil: 'load', timeout: 20000 });
    await sleep(3000);
    console.log('블로그 메인 URL:', page.url());
    
    // 로그인 상태 확인
    const loginStatus = await page.evaluate(() => {
      return {
        hasLoginBtn: !!document.querySelector('.btn_login, .link_login, a[href*="Login"]'),
        hasMyBlog: !!document.querySelector('.myblog, .link_user_blog, .name_area'),
        bodyClass: document.body.className.substring(0, 100),
        bodyText: document.body.innerText.substring(0, 200),
      };
    });
    console.log('로그인 상태:', JSON.stringify(loginStatus, null, 2));

    // 스크린샷
    await page.screenshot({ path: '_debug_login.png' });
    console.log('스크린샷 저장됨');
    
  } finally {
    await page.close();
  }
})();

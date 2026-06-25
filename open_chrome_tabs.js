const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 5000 });
  const ctx = b.contexts()[0];
  
  // 열릴 탭들
  const urls = [
    ['Instagram', 'https://www.instagram.com/accounts/login/'],
    ['Threads', 'https://www.threads.net/login'],
    ['네이버 광고센터', 'https://ads.naver.com/manage/ad-accounts/334739/dashboard'],
    ['네이버 블로그', 'https://blog.naver.com/aicut'],
  ];

  const tabs = {};
  for (const [name, url] of urls) {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    tabs[name] = page.url().substring(0, 50);
  }

  console.log('=== Chrome에 열린 탭 ===');
  for (const [name, url] of Object.entries(tabs)) {
    console.log(name + ': ' + url);
  }

  console.log('\n로그인 완료되면 알려주세요!');
  await b.close();
})();

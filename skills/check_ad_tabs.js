const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  console.log(`Total pages open: ${pages.length}`);
  pages.forEach((p, i) => {
    const url = p.url();
    let label = '';
    if (url.includes('ads.naver.com') || url.includes('searchad.naver.com')) label = '📊 네이버광고';
    else if (url.includes('analytics.google.com')) label = '📈 GA4';
    else if (url.includes('blog.naver.com')) label = '📝 블로그';
    else if (url.includes('blokey.co.kr')) label = '🔑 블로키';
    else label = '📄 기타';
    console.log(`[${i}] ${label} ${url.slice(0, 120)}`);
  });
})();

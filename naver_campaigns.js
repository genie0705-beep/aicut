const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  // 전체 캠페인 페이지 직접 접근
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/all-campaigns', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));
  console.log('URL:', page.url());

  const text = await page.evaluate(() => document.body.innerText.substring(0, 4000));
  console.log(text.substring(0, 3500));

  // 스크린샷
  await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/blog_images/naver_campaigns.png', fullPage: false });
  console.log('\n스크린샷 저장됨');

  await b.close();
})().catch(e => console.error('ERR:', e.message));

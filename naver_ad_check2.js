const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));

  console.log('광고센터 URL:', adPage.url());
  await sleep(2000);

  await adPage.screenshot({ path: 'naver_ad_current.png' });

  // 현재 광고그룹 상태
  const state = await adPage.evaluate(() => ({
    title: document.title,
    text: document.body.innerText.substring(0, 2000)
  }));
  console.log('제목:', state.title);
  console.log('내용:\n', state.text);

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

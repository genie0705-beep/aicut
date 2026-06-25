const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/channels', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);

  // 스크린샷
  await page.screenshot({ path: 'naver_ss1.png', fullPage: false });

  // 좌측 메뉴에서 파워링크 클릭
  const clickedPL = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, span, li'));
    const el = els.find(e => e.innerText?.trim() === '파워링크');
    if (el) { el.click(); return el.href || el.innerText; }
    return null;
  });
  console.log('파워링크 클릭:', clickedPL);
  await sleep(2500);
  await page.screenshot({ path: 'naver_ss2.png' });

  const txt2 = await page.evaluate(() => document.body.innerText.substring(0, 6000));
  console.log(txt2);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

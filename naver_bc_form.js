const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 스크린샷 기준 "웹사이트" 좌표 클릭 (x=230, y=248)
  await page.mouse.click(230, 248);
  console.log('웹사이트 클릭');
  await sleep(3000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_bc_form.png' });

  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input, textarea'))
      .map(el => ({ ph: el.placeholder, val: el.value, maxLen: el.maxLength }))
      .filter(el => el.ph || (el.val && el.val !== 'on')).slice(0, 10)
  );
  console.log('입력창:', JSON.stringify(inputs));

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

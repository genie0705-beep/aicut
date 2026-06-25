const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 키워드 탭 클릭
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '키워드');
    if (btn) btn.click();
  });
  await sleep(2000);

  // 키워드 성과 데이터 수집
  const kwData = await page.evaluate(() => document.body.innerText.substring(1500, 4500));
  console.log(kwData);

  await page.screenshot({ path: 'naver_keywords.png' });
  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

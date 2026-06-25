const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 드롭다운에서 "홍보문구" 클릭
  const r1 = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('li, [role="menuitem"], a, button, span, div'));
    const item = items.find(el => el.innerText?.trim() === '홍보문구');
    if (item) { item.click(); return '홍보문구 클릭'; }
    return '없음';
  });
  console.log(r1);
  await sleep(2000);

  await page.screenshot({ path: 'naver_promo_modal.png' });

  // 입력창 확인
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]'))
      .map(el => ({ ph: el.placeholder, maxLen: el.maxLength, val: el.value }))
      .filter(el => el.ph && el.maxLen > 5)
      .slice(0, 10);
  });
  console.log('입력창:', JSON.stringify(inputs));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "새 캠페인" 버튼 클릭
  const r1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => b.innerText?.trim() === '새 캠페인' || b.innerText?.trim() === '캠페인 만들기');
    if (btn) { btn.click(); return `${btn.innerText.trim()} 클릭`; }
    return '없음';
  });
  console.log(r1);
  await sleep(3000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_da_new.png' });

  const state = await page.evaluate(() => ({
    btns: Array.from(document.querySelectorAll('button')).map(b=>b.innerText?.trim()).filter(t=>t&&t.length<20).slice(0,15),
    inputs: Array.from(document.querySelectorAll('input')).map(i=>({ph:i.placeholder, val:i.value, type:i.type})).filter(i=>i.ph||i.val).slice(0,8)
  }));
  console.log('버튼:', state.btns);
  console.log('inputs:', JSON.stringify(state.inputs));

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

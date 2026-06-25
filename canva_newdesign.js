const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  // "맞춤형 크기" 버튼 클릭
  const clicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button,[role="button"],span,div'));
    const btn = els.find(el => el.innerText?.trim().includes('맞춤형 크기'));
    if (btn) { btn.click(); return '맞춤형 크기 클릭'; }
    return '못 찾음';
  });
  console.log(clicked);
  await sleep(2000);

  await page.screenshot({ path: 'canva_custom.png' });

  // 입력창 상태 확인
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(i => ({
      ph: i.placeholder, val: i.value, type: i.type
    }))
  );
  console.log('입력창:', JSON.stringify(inputs.slice(0,6)));

  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button,[role="button"]'))
      .map(el => el.innerText?.trim().substring(0,30)).filter(t=>t).slice(0,15)
  );
  console.log('버튼:', btns);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

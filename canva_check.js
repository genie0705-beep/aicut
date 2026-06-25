const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  await sleep(500);
  await page.screenshot({ path: 'canva_current.png' });

  const state = await page.evaluate(() => ({
    url: location.href,
    btns: Array.from(document.querySelectorAll('button,[role="button"]'))
      .map(el => el.innerText?.trim().substring(0,40))
      .filter(t => t).slice(0,20),
    inputs: Array.from(document.querySelectorAll('input'))
      .map(i => i.placeholder).filter(t=>t).slice(0,5)
  }));
  console.log('URL:', state.url);
  console.log('버튼:', state.btns);
  console.log('입력:', state.inputs);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

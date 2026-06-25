const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(500);

  // "배경 편집" 버튼 클릭
  const r1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.trim().includes('배경 편집'));
    if (btn) { btn.click(); return '배경 편집 클릭'; }
    return '없음: ' + btns.map(b => b.innerText.trim()).filter(t=>t).slice(0,10).join(' | ');
  });
  console.log(r1);
  await sleep(2000);
  await page.screenshot({ path: 'miri_bgedit.png' });

  const state = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      ph: i.placeholder, val: i.value, cls: i.className.substring(0,50)
    }));
    const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t=>t).slice(0,25);
    return { inputs, btns };
  });
  console.log('inputs:', JSON.stringify(state.inputs.slice(0,6)));
  console.log('btns:', state.btns);

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

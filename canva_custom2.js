const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  // 맞춤형 크기 아이콘 정확한 좌표 (840, 220)
  await page.mouse.click(840, 220);
  await sleep(2500);
  await page.screenshot({ path: 'canva_custom2.png' });

  const url = page.url();
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(i => ({
      ph: i.placeholder, val: i.value
    })).filter(i => i.ph || i.val).slice(0,6)
  );
  console.log('URL:', url);
  console.log('inputs:', JSON.stringify(inputs));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

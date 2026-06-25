const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  // 맞춤형 크기 아이콘 좌표 클릭 (스크린샷 기준 840, 185)
  await page.mouse.click(840, 185);
  console.log('맞춤형 크기 클릭');
  await sleep(2500);

  await page.screenshot({ path: 'canva_after1.png' });

  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(i => ({
      ph: i.placeholder, val: i.value, type: i.type, cls: i.className.substring(0,40)
    }))
  );
  console.log('입력창:', JSON.stringify(inputs.slice(0,6)));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

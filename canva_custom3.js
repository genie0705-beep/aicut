const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  // ESC로 드롭다운 닫기
  await page.keyboard.press('Escape');
  await sleep(500);

  // 맞춤형 크기 정확한 요소 위치 찾기
  const pos = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const target = els.find(el => {
      const t = el.innerText?.trim();
      return t === '맞춤형 크기' || t === '맞춤형\n크기';
    });
    if (target) {
      const r = target.getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height, text: target.innerText.trim() };
    }
    return null;
  });
  console.log('맞춤형 크기 위치:', pos);

  if (pos) {
    await page.mouse.click(pos.x, pos.y);
    console.log(`클릭: (${pos.x}, ${pos.y})`);
    await sleep(2500);

    await page.screenshot({ path: 'canva_custom3.png' });

    const inputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input')).map(i => ({
        ph: i.placeholder, val: i.value, type: i.type
      })).slice(0,6)
    );
    console.log('inputs:', JSON.stringify(inputs));
    console.log('URL:', page.url());
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

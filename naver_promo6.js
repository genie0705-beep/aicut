const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 스크린샷 기준 "선택 안 함" 드롭다운 클릭 (x=590, y=147)
  await page.mouse.click(590, 147);
  console.log('드롭다운 클릭 (590, 147)');
  await sleep(1500);

  await page.screenshot({ path: 'naver_promo_drop2.png' });

  // 열린 옵션 확인 (모달 안 x=320~860)
  const opts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('li, [role="option"]'))
      .map(el => {
        const r = el.getBoundingClientRect();
        return { text: el.innerText?.trim().substring(0,20), x: Math.round(r.x), y: Math.round(r.y), visible: r.y > 100 && r.y < 600 };
      })
      .filter(el => el.text && el.visible && el.x > 300 && el.x < 870)
      .slice(0, 10);
  });
  console.log('옵션:', JSON.stringify(opts));

  if (opts.length > 0) {
    await page.mouse.click(opts[0].x + 100, opts[0].y + 10);
    console.log('선택:', opts[0].text);
    await sleep(1000);
  }

  await page.screenshot({ path: 'naver_promo_drop3.png' });

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

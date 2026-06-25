const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(4000);

  // GA4 이벤트 직접 발사
  const result = await page.evaluate(() => {
    const fired = [];
    if (typeof gtag !== 'function') return { error: 'gtag 없음' };

    const events = ['generate_lead', 'begin_checkout', 'sign_up', 'purchase'];
    events.forEach(name => {
      gtag('event', name, { method: 'test', value: 1 });
      fired.push(name);
    });
    return { fired, gtagExists: true };
  });

  console.log('GA4 이벤트 발사:', JSON.stringify(result, null, 2));
  await sleep(5000);

  console.log('\n✅ 완료! GA4 실시간 보기에서 확인하세요.');
  console.log('GA4 → 보고서 → 실시간 → 이벤트 목록에서 generate_lead 등 보임');
  console.log('이후 이벤트 목록에 뜨면 별표(⭐) 클릭 → 주요 이벤트 ON 가능');

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

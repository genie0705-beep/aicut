const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  // GA4 및 gtag 로드 확인
  const gaCheck = await page.evaluate(() => {
    return {
      gtagExists: typeof gtag === 'function',
      dataLayerExists: Array.isArray(window.dataLayer),
      dataLayerLength: window.dataLayer ? window.dataLayer.length : 0,
      measurementId: window.dataLayer ? 
        JSON.stringify(window.dataLayer).match(/G-[A-Z0-9]{8,12}/) : null,
      generateLeadTracked: window.dataLayer ?
        window.dataLayer.some(d => d[0] === 'event' && d[1] === 'generate_lead') : false
    };
  });
  console.log('GA4 상태:', JSON.stringify(gaCheck, null, 2));

  // CTA 버튼 클릭 이벤트 리스너 확인 (실제 클릭 테스트)
  const ctaTest = await page.evaluate(() => {
    const events = [];
    const origGtag = window.gtag;
    window.gtag = function(cmd, name, params) {
      if (cmd === 'event') events.push({ name, params });
      if (origGtag) origGtag.apply(this, arguments);
    };

    // "무료로 시작하기" 버튼 찾아서 클릭 시뮬레이션
    const btns = Array.from(document.querySelectorAll('button'));
    const cta = btns.find(b => b.innerText?.includes('무료로 시작하기'));
    if (cta) cta.click();

    return { foundCTA: !!cta, firedEvents: events };
  });
  console.log('\nCTA 클릭 테스트:', JSON.stringify(ctaTest, null, 2));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

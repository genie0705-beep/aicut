const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://www.threads.com/@3despoke/post/DQ6QEnUk8Kl', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // 다양한 선택자로 본문 텍스트 찾기
  const result = await page.evaluate(() => {
    const candidates = [
      '[data-pressable-container] span',
      '[dir="auto"] span',
      'h1 span',
      '[role="main"] p',
      '[role="main"] span',
    ];
    const output = {};
    for (const sel of candidates) {
      const els = Array.from(document.querySelectorAll(sel));
      const texts = els
        .map(el => el.innerText?.trim())
        .filter(t => t && t.length > 20 && t.length < 500)
        .slice(0, 3);
      if (texts.length > 0) output[sel] = texts;
    }

    // span 중 긴 텍스트
    const allSpans = Array.from(document.querySelectorAll('span'))
      .map(el => el.innerText?.trim())
      .filter(t => t && t.length > 30 && !t.includes('새로운 스레드') && !t.includes('추천'))
      .slice(0, 5);
    output['span_filtered'] = allSpans;

    return output;
  });

  console.log(JSON.stringify(result, null, 2));
  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

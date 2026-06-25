const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  console.log('현재 URL:', page.url());
  console.log('페이지 타이틀:', await page.title());

  // 현재 페이지 버튼 목록 전체 출력
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.innerText?.trim().substring(0, 30),
          visible: rect.width > 0 && rect.height > 0,
          x: Math.round(rect.x),
          y: Math.round(rect.y)
        };
      })
      .filter(b => b.visible && b.text)
      .slice(0, 20);
  });
  console.log('버튼 목록:', JSON.stringify(btns, null, 2));

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

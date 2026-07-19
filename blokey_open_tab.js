const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // Blokey 탭 열기
  const p1 = await ctx.newPage();
  await p1.goto('https://blokey.co.kr', { waitUntil: 'domcontentloaded' }).catch(() => {});

  console.log('✅ Blokey.co.kr 탭 열림');
  b.close();
})().catch(e => console.log('ERR:', e.message));

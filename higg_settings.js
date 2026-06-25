// 힉스필드 Settings 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  // Settings 클릭
  const allEls = await p.$$('button, a, span, div');
  for (const el of allEls) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'Settings') {
      await el.click({ force: true });
      await p.waitForTimeout(2000);
      console.log('Settings 클릭');
      const body = await p.evaluate(() => document.body.innerText.substring(0, 2000)).catch(() => '');
      console.log('Settings:', body);
      break;
    }
  }

  try { await b.close(); } catch (e) {}
})();

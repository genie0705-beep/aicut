const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const url = p.url();
    try {
      const hasCe = await p.evaluate(() => !!document.querySelector('[contenteditable]'));
      const text = await p.evaluate(() => {
        const ce = document.querySelector('[contenteditable]');
        return ce ? (ce.innerText || '').substring(0, 40) : '-';
      });
      console.log(`[${i}] contenteditable=${hasCe} text="${text}"`);
      console.log(`     url=${url.substring(0, 130)}`);
    } catch (e) {
      console.log(`[${i}] ERROR: ${url.substring(0, 80)}`);
    }
  }
  console.log(`\n총 ${pages.length}개 탭`);
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  try {
    await page.goto('https://www.threads.com/@happyreels_pro/post/DYbyCy3ExQq', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await sleep(4000);

  console.log('URL:', page.url());

  // 모든 버튼 목록
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(b => {
        const rect = b.getBoundingClientRect();
        if (rect.width === 0) return null;
        return {
          text: (b.innerText || '').trim().substring(0, 30),
          aria: b.getAttribute('aria-label') || '',
          y: Math.round(rect.y),
          x: Math.round(rect.x),
          disabled: b.disabled
        };
      })
      .filter(Boolean)
      .slice(0, 30);
  });

  console.log('\n버튼 목록:');
  btns.forEach(b => console.log(`  [y=${b.y}] text="${b.text}" aria="${b.aria}" disabled=${b.disabled}`));

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

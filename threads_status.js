const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  try { await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 4000));

  const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log(text);

  // 게시글 수 확인
  const posts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('article, [data-pressable-container]'))
      .map(a => a.innerText?.trim().substring(0, 100))
      .filter(Boolean);
  });
  console.log('\n게시글 수:', posts.length);

  await b.close();
})().catch(e => console.error(e.message));

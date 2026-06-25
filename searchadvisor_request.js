const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = await ctx.newPage();
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  // "웹마스터 도구 사용하기" 버튼 클릭
  const clickResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('a, button, span, div');
    for (const el of btns) {
      const t = (el.innerText || '').trim();
      if (t.includes('웹마스터 도구') || t.includes('사용하기')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) {
          el.click();
          return { text: t.substring(0, 20) };
        }
      }
    }
    return null;
  });
  console.log('버튼:', clickResult);
  await new Promise(r => setTimeout(r, 5000));

  const url = page.url();
  console.log('URL:', url.substring(0, 120));

  const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('=== 페이지 ===');
  console.log(text.substring(0, 800));

  await page.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages()[6]; // ads.naver.com
  await new Promise(r => setTimeout(r, 2000));

  // "도구" 메뉴 클릭
  const menuClick = await page.evaluate(() => {
    const all = document.querySelectorAll('a, span, div, button');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '도구') {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          el.click();
          return { text: t, x: r.x, y: r.y };
        }
      }
    }
    return null;
  });
  console.log('도구 메뉴:', menuClick);
  await new Promise(r => setTimeout(r, 2000));

  // 키워드 도구 링크 찾기
  const kwLink = await page.evaluate(() => {
    const all = document.querySelectorAll('a, span, div');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t.includes('키워드') && t.includes('도구')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          el.click();
          return { text: t.substring(0, 20), x: r.x, y: r.y };
        }
      }
    }
    return null;
  });
  console.log('키워드 도구:', kwLink);
  await new Promise(r => setTimeout(r, 3000));

  const kwText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('=== 키워드 도구 페이지 ===');
  console.log(kwText);

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

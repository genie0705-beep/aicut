const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  const page = pages[6]; // ads.naver.com

  // 키워드 도구 페이지로 이동
  await page.goto('https://manage.searchad.naver.com/keyword/keywordTool', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 6000));

  console.log('URL:', page.url().substring(0, 100));

  // 페이지 로딩 확인
  const text = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('=== 키워드 도구 ===');
  console.log(text);

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

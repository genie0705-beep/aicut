const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  // 현재 페이지에 이전 텍스트 남아있음 - 그냥 게시 버튼 찾기
  console.log('URL:', page.url());
  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button, [role="button"]')).map(b => b.innerText?.trim()).filter(Boolean).slice(0,15)
  );
  console.log('버튼:', btns);

  // 게시 버튼 클릭
  const posted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '게시');
    if (btn) { btn.click(); return btn.innerText.trim(); }
    // 모든 버튼 text 출력
    return 'NOT FOUND: ' + btns.map(b => b.innerText?.trim()).filter(Boolean).join(', ');
  });
  console.log('게시 버튼:', posted);
  await new Promise(r => setTimeout(r, 3000));
  console.log('URL after:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log('결과:', text.substring(0, 150));

  await b.close();
})().catch(e => console.error(e.message));

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const existingPages = ctx.pages();
  console.log('기존 탭 수:', existingPages.length);
  for (const p of existingPages) {
    console.log('  -', p.url().substring(0, 100));
  }

  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });

  // 네이버 메인 - 로그인 확인
  await page.goto('https://www.naver.com/', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(3000);
  const loginInfo = await page.evaluate(() => {
    const body = document.body.innerText;
    const hasLogout = body.includes('로그아웃');
    return { hasLogout, preview: body.substring(0, 300) };
  });
  console.log('네이버 로그인:', loginInfo.hasLogout);
  if (!loginInfo.hasLogout) console.log('로그인 필요!');

  // 블로그 접속
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('블로그 URL:', page.url());
  console.log('제목:', await page.title());
  
  const info = await page.evaluate(() => {
    return {
      bodyLen: document.body.innerText.length,
      preview: document.body.innerText.substring(0, 300),
      links: Array.from(document.querySelectorAll('a, button'))
        .map(el => ({ tag: el.tagName, text: el.textContent?.trim().substring(0,25), href: el.href || '' }))
        .filter(l => l.text)
        .slice(0, 30)
    };
  });
  console.log('블로그 내용:', JSON.stringify(info, null, 2));
  
  await b.close();
})();

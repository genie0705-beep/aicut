const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  // 검색광고 캠페인 페이지
  await page.goto('https://searchad.naver.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  console.log('URL:', page.url());

  // 현재 URL 기반으로 광고 캠페인 페이지 찾기
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({ text: a.innerText?.trim().substring(0,30), href: a.href }))
      .filter(a => a.href.includes('campaign') || a.href.includes('adgroup') || a.href.includes('keyword'))
      .slice(0, 10)
  );
  console.log('캠페인 링크:', JSON.stringify(links, null, 2));

  // 광고 계정 ID 확인
  const accountUrl = page.url();
  console.log('현재 URL:', accountUrl);

  // 메뉴에서 검색광고 클릭
  const menuClicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button, [role="button"]'));
    const btn = links.find(l => l.innerText?.includes('검색 광고') || l.innerText?.includes('파워링크'));
    if (btn) { btn.click(); return btn.innerText?.trim(); }
    return null;
  });
  console.log('메뉴 클릭:', menuClicked);
  await new Promise(r => setTimeout(r, 3000));
  console.log('이동 URL:', page.url());

  const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('내용:', text.substring(0, 1500));

  await b.close();
})().catch(e => console.error('ERR:', e.message));

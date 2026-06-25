const { chromium } = require('playwright');

// consomme_mkt 프로필에서 메시지 버튼 확인
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://www.instagram.com/consomme_mkt/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map(b => b.innerText.trim())
      .filter(t => t.length > 0);
  });
  console.log('Buttons:', btns);

  // 팔로우 상태인지 확인
  const followState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => b.innerText.trim()).filter(Boolean);
  });
  console.log('Follow state:', followState);

  // 먼저 팔로우 해보기
  const followed = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.trim() === '팔로우');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Followed:', followed);
  await new Promise(r => setTimeout(r, 2000));

  // 팔로우 후 버튼 재확인
  const btns2 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map(b => b.innerText.trim()).filter(t => t.length > 0);
  });
  console.log('Buttons after follow:', btns2);

  await b.close();
})().catch(e => console.error('ERR:', e.message));

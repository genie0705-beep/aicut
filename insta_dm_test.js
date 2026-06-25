const { chromium } = require('playwright');

// 테스트: consomme_mkt 1개만
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];

  const username = 'consomme_mkt';
  const url = `https://www.instagram.com/${username}/`;

  console.log(`[TEST] @${username} 프로필 방문`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  // 버튼 목록 확인
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map(b => b.innerText.trim())
      .filter(t => t.length > 0);
  });
  console.log('버튼 목록:', buttons);

  // 팔로우 상태 + 메시지 버튼 확인
  const hasMsg = buttons.some(b => b.includes('메시지') || b.includes('Message'));
  console.log('메시지 버튼 있음:', hasMsg);

  // 링크 확인 - 직접 DM URL
  const dmUrl = `https://www.instagram.com/direct/new/`;
  console.log('DM 직접 URL 시도:', dmUrl);
  await page.goto(dmUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  const dmText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log('DM 페이지:', dmText.substring(0, 150));

  await browser.close();
})().catch(e => console.error('ERR:', e.message));

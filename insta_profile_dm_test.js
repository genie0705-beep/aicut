const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // consomme_mkt 프로필 방문 (이미 팔로우함)
  await page.goto('https://www.instagram.com/consomme_mkt/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map(b => b.innerText.trim()).filter(t => t.length > 0);
  });
  console.log('Profile buttons:', btns);

  // 메시지 버튼 찾기 (팔로우 이후 나타날 수 있음)
  const hasMsg = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('메시지') || b.innerText === 'Message');
    if (btn) { btn.click(); return btn.innerText.trim(); }
    return false;
  });
  console.log('Message button:', hasMsg);
  await new Promise(r => setTimeout(r, 2500));

  // DM 입력창 확인
  const url = page.url();
  const editable = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[contenteditable="true"]'))
      .map(el => ({
        tag: el.tagName,
        label: el.getAttribute('aria-label'),
        placeholder: el.getAttribute('aria-placeholder')
      }));
  });
  console.log('URL:', url);
  console.log('Editable:', JSON.stringify(editable));

  await b.close();
})().catch(e => console.error('ERR:', e.message));

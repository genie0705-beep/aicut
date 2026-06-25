const { chromium } = require('playwright');

// merci_yoni 전체 플로우 단계별 확인
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  const username = 'beaulead_marketing'; // 아직 팔로우 안 한 계정
  console.log(`[TEST] @${username}`);

  await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));

  let btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean));
  console.log('Step1 buttons:', btns);

  // 팔로우
  const followed = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '팔로우');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Followed:', followed);
  await new Promise(r => setTimeout(r, 3000));

  btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean));
  console.log('Step2 buttons (after follow):', btns);

  // 리로드
  try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 4000));

  btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean));
  console.log('Step3 buttons (after reload):', btns);

  // 메시지 버튼 클릭
  const msgBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('메시지') || b.innerText === 'Message');
    if (btn) { btn.click(); return btn.innerText.trim(); }
    return null;
  });
  console.log('Message btn clicked:', msgBtn);

  if (msgBtn) {
    await new Promise(r => setTimeout(r, 3000));
    const url = page.url();
    const editable = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[contenteditable="true"]'))
        .map(e => ({ label: e.getAttribute('aria-label'), ph: e.getAttribute('aria-placeholder'), tag: e.tagName }))
    );
    console.log('URL after click:', url);
    console.log('Editable els:', JSON.stringify(editable));
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));

const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  // 관리 → 이벤트 페이지
  try { await page.goto('https://analytics.google.com/analytics/web/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(3000);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '관리');
    if (btn) btn.click();
  });
  await sleep(2000);

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a, button, li'));
    const item = items.find(i => i.innerText?.trim() === '이벤트');
    if (item) item.click();
  });
  await sleep(4000);

  // "이벤트 만들기" 버튼 클릭
  const createClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => b.innerText?.trim() === '이벤트 만들기');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('이벤트 만들기 클릭:', createClicked);
  await sleep(3000);

  // 모달에서 "만들기" 버튼 클릭 (새 이벤트 생성 시작)
  const modalCreateClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '만들기');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('만들기 클릭:', modalCreateClicked);
  await sleep(2000);

  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('\n현재 상태:\n', pageText.substring(0, 500));

  // 이벤트 이름 입력창 찾기
  const inputInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
    return inputs.map(i => {
      const rect = i.getBoundingClientRect();
      return { placeholder: i.placeholder, label: i.getAttribute('aria-label') || '', visible: rect.width > 0, x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2) };
    }).filter(i => i.visible);
  });
  console.log('\n입력창:', JSON.stringify(inputInfo.slice(0, 5), null, 2));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

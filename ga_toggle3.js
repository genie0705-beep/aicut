const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const EVENTS_TO_CONVERT = ['generate_lead', 'purchase', 'begin_checkout', 'sign_up'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  // 홈으로 먼저 이동
  try {
    await page.goto('https://analytics.google.com/analytics/web/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) {}
  await sleep(4000);

  // 관리(⚙️) 버튼 클릭
  const adminClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, [role="button"], [role="menuitem"]'));
    const btn = btns.find(b => {
      const t = b.innerText?.trim();
      const a = b.getAttribute('aria-label') || '';
      return t === '관리' || a.includes('관리') || a.includes('Admin') || t === 'Admin';
    });
    if (btn) { btn.click(); return btn.innerText || btn.getAttribute('aria-label'); }
    return false;
  });
  console.log('관리 클릭:', adminClicked);
  await sleep(3000);

  // 이벤트 메뉴 클릭
  const eventClicked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a, button, [role="menuitem"], li'));
    const item = items.find(i => {
      const t = i.innerText?.trim();
      return t === '이벤트' || t === 'Events';
    });
    if (item) { item.click(); return item.innerText; }
    return false;
  });
  console.log('이벤트 메뉴:', eventClicked);
  await sleep(4000);

  // 현재 페이지 내용 확인
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log('\n현재 페이지:\n', pageText.substring(0, 600));

  // 토글 스위치 찾기
  const switches = await page.evaluate((targets) => {
    const all = Array.from(document.querySelectorAll('[role="switch"], input[type="checkbox"], .mat-slide-toggle, [class*="toggle"], [class*="switch"]'));
    return all.map(sw => {
      const row = sw.closest('tr') || sw.closest('[role="row"]') || sw.closest('li') || sw.parentElement?.parentElement?.parentElement;
      const rowText = (row?.innerText || '').trim().substring(0, 100);
      const rect = sw.getBoundingClientRect();
      return {
        rowText,
        checked: sw.checked || sw.getAttribute('aria-checked') === 'true',
        x: Math.round(rect.x + rect.width / 2),
        y: Math.round(rect.y + rect.height / 2),
        visible: rect.width > 0 && rect.height > 0
      };
    }).filter(s => s.visible);
  }, EVENTS_TO_CONVERT);

  console.log('\n발견된 토글:', JSON.stringify(switches.slice(0, 10), null, 2));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

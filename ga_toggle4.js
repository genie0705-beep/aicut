const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const EVENTS_TO_CONVERT = ['generate_lead', 'purchase', 'begin_checkout', 'sign_up'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  // 관리 → 이벤트 페이지로 이동
  try { await page.goto('https://analytics.google.com/analytics/web/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(3000);

  // 관리 클릭
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '관리' || b.getAttribute('aria-label')?.includes('관리'));
    if (btn) btn.click();
  });
  await sleep(2000);

  // 이벤트 메뉴 클릭
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a, button, [role="menuitem"], li'));
    const item = items.find(i => i.innerText?.trim() === '이벤트');
    if (item) item.click();
  });
  await sleep(4000);

  // 현재 탭: 주요 이벤트 탭 → 모든 이벤트 탭으로 전환
  const tabSwitched = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"], button'));
    // "최근 활동" 또는 "모든 이벤트" 탭 찾기
    const tab = tabs.find(t => t.innerText?.includes('최근 활동') || t.innerText?.includes('모든') || t.innerText?.includes('All events'));
    if (tab) { tab.click(); return tab.innerText; }
    return false;
  });
  console.log('탭 전환:', tabSwitched);
  await sleep(3000);

  // 현재 페이지의 이벤트 목록과 별표 버튼 파악
  const eventRows = await page.evaluate((targets) => {
    const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));
    const result = [];
    rows.forEach(row => {
      const text = row.innerText || '';
      targets.forEach(target => {
        if (text.includes(target)) {
          // 별표 버튼 (주요 이벤트 표시)
          const starBtn = row.querySelector('[aria-label*="주요"], [aria-label*="별표"], [aria-label*="star"], button');
          const rect = starBtn ? starBtn.getBoundingClientRect() : null;
          result.push({
            event: target,
            rowText: text.substring(0, 60),
            hasStar: !!starBtn,
            starX: rect ? Math.round(rect.x + rect.width / 2) : null,
            starY: rect ? Math.round(rect.y + rect.height / 2) : null,
            starVisible: rect ? rect.width > 0 : false,
            isKeyEvent: text.includes('주요') || row.querySelector('[aria-label*="취소"]') !== null
          });
        }
      });
    });
    return result;
  }, EVENTS_TO_CONVERT);

  console.log('\n이벤트 행:\n', JSON.stringify(eventRows, null, 2));

  // 별표 클릭으로 주요 이벤트 ON
  for (const row of eventRows) {
    if (!row.isKeyEvent && row.starVisible && row.starX) {
      console.log(`→ ${row.event} 별표 클릭 (${row.starX}, ${row.starY})`);
      await page.mouse.click(row.starX, row.starY);
      await sleep(2000);
      console.log(`  ✅ ${row.event} 주요 이벤트 ON`);
    } else if (row.isKeyEvent) {
      console.log(`✅ ${row.event} 이미 주요 이벤트`);
    }
  }

  // 결과 확인
  await sleep(2000);
  const finalText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('\n최종 상태:\n', finalText.substring(200, 800));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

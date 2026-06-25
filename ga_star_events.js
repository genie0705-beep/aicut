const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TARGET_EVENTS = ['generate_lead', 'begin_checkout', 'sign_up', 'purchase'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const gaPage = pages[3];

  // GA4 이벤트 페이지로 이동
  try { await gaPage.goto('https://analytics.google.com/analytics/web/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(3000);

  // 관리 → 이벤트
  await gaPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => b.innerText?.trim() === '관리');
    if (btn) btn.click();
  });
  await sleep(2000);

  await gaPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a, button, li'));
    const item = items.find(i => i.innerText?.trim() === '이벤트');
    if (item) item.click();
  });
  await sleep(4000);

  // "최근 활동" 탭 클릭 (방금 발생한 이벤트 확인)
  await gaPage.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const tab = tabs.find(t => t.innerText?.includes('최근 활동'));
    if (tab) tab.click();
  });
  await sleep(3000);

  const pageText = await gaPage.evaluate(() => document.body.innerText);
  console.log('이벤트 목록 확인:');
  TARGET_EVENTS.forEach(e => {
    console.log(`  ${e}: ${pageText.includes(e) ? '✅ 목록에 있음' : '❌ 없음'}`);
  });

  // 별표 클릭 시도
  for (const eventName of TARGET_EVENTS) {
    const clicked = await gaPage.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));
      for (const row of rows) {
        if (!row.innerText?.includes(name)) continue;
        // 별표 SVG 버튼 찾기
        const svgBtns = Array.from(row.querySelectorAll('button'));
        for (const btn of svgBtns) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0) {
            btn.click();
            return `클릭됨 (${btn.getAttribute('aria-label') || btn.innerText})`;
          }
        }
      }
      return false;
    }, eventName);
    if (clicked) console.log(`${eventName} 별표: ${clicked}`);
    await sleep(1500);
  }

  // 최종 상태
  const finalRows = await gaPage.evaluate(() => {
    return Array.from(document.querySelectorAll('tr, [role="row"]'))
      .map(r => r.innerText?.trim().substring(0, 80))
      .filter(t => t && t.length > 5 && !t.includes('이벤트 이름') && !t.includes('지난 28일'));
  });
  console.log('\n최종 이벤트 행:');
  finalRows.slice(0, 10).forEach(r => console.log(' ', r));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

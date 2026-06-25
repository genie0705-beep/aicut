const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const EVENTS_TO_CONVERT = ['generate_lead', 'purchase', 'begin_checkout', 'sign_up'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  // 관리 메뉴 클릭
  await page.goto(
    'https://analytics.google.com/analytics/web/#/a227543683p538910436/admin/conversion-events',
    { waitUntil: 'domcontentloaded', timeout: 20000 }
  );
  await sleep(4000);

  let text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('전환 이벤트 페이지:\n', text.substring(0, 500));

  // "이벤트" 메뉴 링크 찾기
  const menuClicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, [role="menuitem"], button'));
    const link = links.find(l => {
      const t = l.innerText?.trim();
      return t === '이벤트' || t === 'Events';
    });
    if (link) { link.click(); return true; }
    return false;
  });
  console.log('이벤트 메뉴 클릭:', menuClicked);
  await sleep(3000);

  text = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('\n이벤트 메뉴 후:\n', text.substring(0, 800));

  // generate_lead 등 토글 찾기
  const toggles = await page.evaluate((targets) => {
    const result = [];
    // 토글/스위치 요소 찾기
    const switches = Array.from(document.querySelectorAll('[role="switch"], input[type="checkbox"]'));
    switches.forEach(sw => {
      const row = sw.closest('tr') || sw.closest('[role="row"]') || sw.parentElement?.parentElement;
      const rowText = row?.innerText || '';
      targets.forEach(target => {
        if (rowText.includes(target)) {
          const rect = sw.getBoundingClientRect();
          result.push({
            event: target,
            checked: sw.checked || sw.getAttribute('aria-checked') === 'true',
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            visible: rect.width > 0
          });
        }
      });
    });
    return result;
  }, EVENTS_TO_CONVERT);

  console.log('\n토글 목록:', JSON.stringify(toggles, null, 2));

  // OFF인 것 ON으로
  for (const toggle of toggles) {
    if (!toggle.checked && toggle.visible) {
      console.log(`  → ${toggle.event} 토글 ON 클릭 (${toggle.x}, ${toggle.y})`);
      await page.mouse.click(toggle.x, toggle.y);
      await sleep(2000);
      console.log(`  ✅ ${toggle.event} ON 완료`);
    } else if (toggle.checked) {
      console.log(`  ✅ ${toggle.event} 이미 ON`);
    }
  }

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

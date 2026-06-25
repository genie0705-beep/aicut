const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const EVENTS = ['generate_lead', 'begin_checkout', 'sign_up'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  for (const eventName of EVENTS) {
    console.log(`\n=== ${eventName} ===`);

    // 이벤트 만들기 클릭
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '이벤트 만들기');
      if (btn) btn.click();
    });
    await sleep(2000);

    // 만들기 클릭
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '만들기');
      if (btn) btn.click();
    });
    await sleep(2000);

    // 이름 입력창 클릭 후 입력
    const nameInput = await page.$('[aria-label="이벤트 이름 입력"], input[placeholder="이벤트 이름"]');
    if (!nameInput) { console.log('입력창 없음'); continue; }

    await nameInput.click({ force: true });
    await sleep(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.type(eventName, { delay: 50 });
    console.log(`입력: ${eventName}`);
    await sleep(500);

    // 저장
    const saved = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '저장' && !b.disabled);
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('저장:', saved);
    await sleep(3000);

    // 저장 후 주요 이벤트 별표 클릭
    const starClicked = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));
      for (const row of rows) {
        if (row.innerText?.includes(name)) {
          const btns = Array.from(row.querySelectorAll('button'));
          // 별표가 아닌 비어있는 별(주요 이벤트 미설정) 버튼
          const starBtn = btns.find(b => {
            const aria = b.getAttribute('aria-label') || '';
            return aria.includes('주요') || aria.includes('별') || aria.includes('star') || aria.includes('Mark');
          });
          if (starBtn) { starBtn.click(); return starBtn.getAttribute('aria-label'); }
          // 폴백: 행의 첫 번째 버튼
          if (btns[0]) { btns[0].click(); return 'first_btn: ' + (btns[0].getAttribute('aria-label') || btns[0].innerText); }
        }
      }
      return false;
    }, eventName);
    console.log(`별표 클릭: ${starClicked}`);
    await sleep(2000);
  }

  // 최종 확인
  const finalText = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));
    return rows.map(r => r.innerText?.trim().substring(0, 80)).filter(t => t && t.length > 3);
  });
  console.log('\n=== 최종 이벤트 목록 ===');
  finalText.slice(0, 15).forEach(t => console.log(' ', t));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

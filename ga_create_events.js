const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 생성할 이벤트 목록 (주요 이벤트로 표시할 것들)
const EVENTS = ['generate_lead', 'begin_checkout', 'sign_up'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  for (const eventName of EVENTS) {
    console.log(`\n=== ${eventName} 생성 중 ===`);

    // 이벤트 만들기 버튼 클릭
    const createBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '이벤트 만들기');
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('이벤트 만들기:', createBtn);
    await sleep(2000);

    // "만들기" 버튼 클릭 (새 이벤트)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '만들기');
      if (btn) btn.click();
    });
    await sleep(2000);

    // 이벤트 이름 입력
    const nameInput = await page.$('[aria-label="이벤트 이름 입력"], input[placeholder="이벤트 이름"]');
    if (!nameInput) { console.log('입력창 없음'); continue; }

    await nameInput.click({ force: true });
    await sleep(300);
    // 기존 내용 지우기
    await page.keyboard.shortcut('Control+a');
    await page.keyboard.type(eventName, { delay: 50 });
    console.log(`이름 입력: ${eventName}`);
    await sleep(500);

    // "저장" 버튼 클릭
    const saved = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '저장');
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    console.log('저장:', saved);
    await sleep(3000);

    // 저장 후 주요 이벤트 별표 클릭
    const starClicked = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));
      for (const row of rows) {
        if (row.innerText?.includes(name)) {
          const starBtn = row.querySelector('[aria-label*="주요"], [aria-label*="별표"], [aria-label*="star"], button');
          if (starBtn) { starBtn.click(); return true; }
        }
      }
      return false;
    }, eventName);
    console.log(`별표 클릭: ${starClicked}`);
    await sleep(2000);
  }

  // 최종 이벤트 목록 확인
  const finalText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  const lines = finalText.split('\n').filter(l => l.trim() && !l.includes('©') && !l.includes('치빅스'));
  console.log('\n=== 최종 이벤트 목록 ===');
  lines.slice(20, 50).forEach(l => console.log(l));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

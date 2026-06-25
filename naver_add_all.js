const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 우측 AI 패널 내 "전체 추가" 버튼 위치 파악
  const btnPos = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('button, span, a, [class*="btn"]'));
    const addBtns = spans.filter(el => el.innerText?.trim() === '전체 추가');
    return addBtns.map(el => {
      const r = el.getBoundingClientRect();
      return { text: el.innerText.trim(), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), visible: r.y > 0 && r.y < window.innerHeight };
    });
  });
  console.log('전체 추가 버튼:', JSON.stringify(btnPos));

  // 보이는 전체 추가 버튼 클릭
  for (const btn of btnPos.filter(b => b.visible)) {
    await page.mouse.click(btn.x, btn.y);
    console.log(`전체 추가 클릭: (${btn.x}, ${btn.y})`);
    await sleep(1000);
  }

  await page.screenshot({ path: 'naver_after_add.png' });

  // 모달 왼쪽 제목/설명 입력창 확인
  const leftInputs = await page.evaluate(() => {
    const viewH = window.innerHeight;
    return Array.from(document.querySelectorAll('input,textarea'))
      .map(el => {
        const r = el.getBoundingClientRect();
        return { maxLen: el.maxLength, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), val: el.value.substring(0,20), visible: r.y > 0 && r.y < viewH };
      })
      .filter(el => el.visible && el.x < 720)
      .slice(0, 15);
  });
  console.log('왼쪽 입력창:', JSON.stringify(leftInputs));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

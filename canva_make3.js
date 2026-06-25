const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  // 맞춤형 크기 버튼 다시 클릭
  const pos = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    for (const el of els) {
      const t = el.innerText?.trim();
      if (t === '맞춤형 크기' || t === '맞춤형\n크기') {
        const r = el.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });
  console.log('맞춤형 크기 위치:', pos);
  if (pos) await page.mouse.click(pos.x, pos.y);
  await sleep(2000);

  // 팝업에서 number input 좌표 확인
  const inputPos = await page.evaluate(() => {
    const nums = Array.from(document.querySelectorAll('input[type="number"]'));
    return nums.map(i => {
      const r = i.getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2, ph: i.placeholder };
    });
  });
  console.log('number 입력창 위치:', inputPos);

  if (inputPos.length >= 2) {
    // 가로 클릭 + 입력
    await page.mouse.click(inputPos[0].x, inputPos[0].y);
    await page.keyboard.press('Control+A');
    await page.keyboard.type('1080');
    await sleep(300);

    // 세로 클릭 + 입력
    await page.mouse.click(inputPos[1].x, inputPos[1].y);
    await page.keyboard.press('Control+A');
    await page.keyboard.type('1080');
    await sleep(300);

    console.log('1080x1080 입력');
    await page.screenshot({ path: 'canva_filled.png' });

    // 새 디자인 만들기 버튼 위치
    const btnPos = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '새 디자인 만들기');
      if (btn) {
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
      return null;
    });
    console.log('버튼 위치:', btnPos);

    if (btnPos) {
      await page.mouse.click(btnPos.x, btnPos.y);
      console.log('새 디자인 만들기 클릭!');
      await sleep(6000);
      console.log('새 URL:', page.url());
      await page.screenshot({ path: 'canva_editor4.png' });
    }
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

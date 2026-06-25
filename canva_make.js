const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  await sleep(500);

  // 가로 입력 (placeholder="가로")
  const widthInput = await page.$('input[placeholder="가로"]') || (await page.$$('input[type="number"]'))[0];
  const heightInput = await page.$('input[placeholder="높이"]') || (await page.$$('input[type="number"]'))[1];

  await widthInput.click({ clickCount: 3 });
  await widthInput.type('1080');
  await sleep(300);

  await heightInput.click({ clickCount: 3 });
  await heightInput.type('1080');
  await sleep(300);

  console.log('1080x1080 입력 완료');

  // "새 디자인 만들기" 버튼 클릭
  const makeBtn = await page.$('button:has-text("새 디자인 만들기")');
  if (makeBtn) {
    await makeBtn.click();
    console.log('"새 디자인 만들기" 클릭');
  } else {
    // 텍스트로 찾기
    const r = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === '새 디자인 만들기');
      if (btn) { btn.click(); return '클릭 성공'; }
      return '없음: ' + btns.map(b=>b.innerText?.trim()).filter(t=>t).join(' | ');
    });
    console.log(r);
  }

  await sleep(5000);

  const url = page.url();
  console.log('URL:', url);
  await page.screenshot({ path: 'canva_editor2.png' });

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  await sleep(500);
  await page.screenshot({ path: 'canva_size_input.png' });

  // number 입력창에 1080 x 1080 입력
  const numberInputs = await page.$$('input[type="number"]');
  console.log('number inputs 수:', numberInputs.length);

  if (numberInputs.length >= 2) {
    // 가로
    await numberInputs[0].click({ clickCount: 3 });
    await numberInputs[0].type('1080');
    console.log('가로 1080 입력');
    await sleep(300);

    // 세로
    await numberInputs[1].click({ clickCount: 3 });
    await numberInputs[1].type('1080');
    console.log('세로 1080 입력');
    await sleep(300);

    // "새로 만들기" 버튼 찾아 클릭
    const makeBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim().includes('새로 만들기'));
      if (btn) { btn.click(); return '클릭: ' + btn.innerText.trim(); }
      return '없음: ' + btns.map(b=>b.innerText?.trim()).filter(t=>t).join(' | ');
    });
    console.log('만들기 버튼:', makeBtn);
    await sleep(4000);

    const url = page.url();
    console.log('새 URL:', url);
    await page.screenshot({ path: 'canva_editor.png' });
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

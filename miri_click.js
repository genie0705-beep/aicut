const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com'));

  // "디자인 만들기" 버튼 — class로 직접 클릭
  const btns = await page.$$('button.sc-9073aafc-0.lhfkvj');
  console.log('디자인 만들기 버튼 수:', btns.length);
  
  if (btns.length > 0) {
    // 첫 번째 버튼 클릭
    await btns[0].click({ force: true });
    console.log('클릭 완료');
    await sleep(3000);
    
    // 팝업 확인
    const after = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'))
        .map(el => el.innerText.trim().substring(0, 40))
        .filter(t => t)
        .slice(0, 25);
      const inputs = Array.from(document.querySelectorAll('input'))
        .map(el => ({ ph: el.placeholder, type: el.type }))
        .slice(0, 10);
      return { btns, inputs, url: location.href };
    });
    console.log('이후 버튼:', JSON.stringify(after.btns));
    console.log('입력창:', JSON.stringify(after.inputs));
    console.log('URL:', after.url);
  }

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 2000));

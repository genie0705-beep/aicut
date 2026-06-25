const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com'));

  // JS로 직접 버튼 찾아 클릭
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.trim() === '디자인 만들기');
    if (target) {
      target.click();
      return '클릭: ' + target.className;
    }
    // 안 되면 헤더 영역 버튼 찾기
    const header = document.querySelector('header, nav, [class*="header"], [class*="gnb"]');
    if (header) {
      const hBtn = header.querySelector('button');
      if (hBtn) { hBtn.click(); return '헤더버튼: ' + hBtn.innerText; }
    }
    return '버튼 없음';
  });
  console.log('결과:', clicked);
  await sleep(3000);

  const afterState = await page.evaluate(() => {
    return {
      url: location.href,
      btns: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t).slice(0, 20),
      inputs: Array.from(document.querySelectorAll('input')).map(i => i.placeholder).slice(0, 5)
    };
  });
  console.log('URL:', afterState.url);
  console.log('버튼:', afterState.btns);
  console.log('입력:', afterState.inputs);

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 2000));

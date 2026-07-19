const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(2000);

  // "요청" 클릭해서 메뉴 펼치기 (이미 펼쳐져 있을 수 있음)
  const requestHeader = await saPage.$('text=요청');
  if (requestHeader) {
    await requestHeader.click();
    await saPage.waitForTimeout(1000);
  }

  // "웹 페이지 수집" 클릭
  const collectPage = await saPage.$('text=웹 페이지 수집');
  if (collectPage) {
    await collectPage.click();
    await saPage.waitForTimeout(4000);
    console.log('=== 웹 페이지 수집 페이지 ===');
    const text = await saPage.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 4000));
    
    // 버튼/입력 요소 분석
    const inputs = await saPage.evaluate(() => {
      const results = [];
      document.querySelectorAll('button, a, input, textarea').forEach(el => {
        const t = el.innerText?.trim() || el.value || el.placeholder || '';
        const cls = el.className?.substring(0, 40);
        if (t || el.id) {
          results.push({ tag: el.tagName, text: t.substring(0, 50), id: el.id, type: el.getAttribute('type') || '', cls });
        }
      });
      return results;
    });
    console.log('\n=== 입력/버튼 요소 ===');
    inputs.forEach(i => console.log(JSON.stringify(i)));
  } else {
    console.log('"웹 페이지 수집" 못 찾음');
  }

  await browser.close();
})();

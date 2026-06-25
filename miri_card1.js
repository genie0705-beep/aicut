const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 카드 1: 다크 네이비 배경, Summary
async function makeCard1(page) {
  console.log('\n=== 카드 1 제작 시작 ===');

  // 1. 배경 클릭
  const bgClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const bgBtn = btns.find(b => b.innerText.trim() === '배경');
    if (bgBtn) { bgBtn.click(); return true; }
    return false;
  });
  console.log('배경 버튼 클릭:', bgClicked);
  await sleep(2000);

  await page.screenshot({ path: 'miri_bg_panel.png' });
  
  // 배경색 패널 상태 확인
  const bgPanel = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ ph: i.placeholder, val: i.value, type: i.type }));
    const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t=>t).slice(0,20);
    return { inputs, btns };
  });
  console.log('배경 패널 inputs:', JSON.stringify(bgPanel.inputs.slice(0,5)));
  console.log('배경 패널 btns:', bgPanel.btns.slice(0,15));
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(1000);
  await makeCard1(page);

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

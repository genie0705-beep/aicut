const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages[2] || pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const se = wp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!se) { console.log('NO IFRAME'); await b.close(); return; }
  
  // 방법1: Playwright click()으로 26 버튼 클릭
  const btn = await se.$('button.save_count_btn__ZTLNa');
  if (btn) {
    await btn.click();
    console.log('clicked 26 btn');
  } else {
    // fallback: text로 찾기
    const allBtns = await se.$$('button');
    for (const b of allBtns) {
      const t = await b.innerText();
      if (t.trim() === '26') { await b.click(); console.log('clicked by text'); break; }
    }
  }
  await sleep(3000);
  
  // 방법2: aria-label으로 찾기
  const ariaBtn = await se.$('button[aria-label*="임시저장"]');
  if (ariaBtn) {
    await ariaBtn.click();
    console.log('clicked by aria-label');
    await sleep(3000);
  }
  
  // 팝업 내용 확인
  const fullText = await se.evaluate(() => document.body.innerText);
  const lines = fullText.split('\n').filter(l => l.trim());
  
  console.log('\n=== 삭제/임시 관련 ===');
  lines.forEach((l, i) => {
    if (l.includes('삭제') || l.includes('임시') || l.includes('전체') || l.includes('선택')) {
      console.log(i + ': ' + l.substring(0, 80));
    }
  });
  
  console.log('\n=== 글 제목들 ===');
  lines.forEach((l, i) => {
    if (l.includes('무더위') || l.includes('보험') || l.includes('회고') || l.includes('숏폼') || l.includes('FP')) {
      console.log(i + ': ' + l.substring(0, 80));
    }
  });
  
  await b.close();
})();

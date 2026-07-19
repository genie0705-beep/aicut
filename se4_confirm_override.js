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
  
  // 1. 팝업 열기
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '26') {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }
    }
  });
  await sleep(3000);
  
  // 2. window.confirm을 오버라이드해서 항상 true 반환
  await se.evaluate(() => {
    window.confirm = function() { return true; };
  });
  
  // 3. 모든 delete_button 클릭
  let deleted = 0;
  
  for (let i = 0; i < 30; i++) {
    const result = await se.evaluate(() => {
      const btns = document.querySelectorAll('button.delete_button__kdXNv');
      let clicked = false;
      for (const btn of btns) {
        if (btn.offsetParent !== null || btn.closest('[class*=popup]')) {
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        // offsetParent로 안 잡히면 모든 버튼 시도
        for (const btn of btns) {
          btn.click();
          clicked = true;
          break;
        }
      }
      return clicked ? 'clicked' : 'none';
    });
    
    if (result === 'none') break;
    deleted++;
    await sleep(1500);
    
    if (deleted % 5 === 0) console.log('   ' + deleted + '개');
  }
  
  console.log('\n=== 결과: ' + deleted + '개 삭제 ===');
  
  // 잔여 확인
  const remain = await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = btn.innerText.trim();
      if (t.match(/^\d+$/) && parseInt(t) > 0) return t;
    }
    return '0';
  });
  console.log('잔여: ' + remain + '개');
  
  await b.close();
})();

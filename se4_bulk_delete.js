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
  
  // dialog 리스너 (confirm 자동 수락, 에러 무시)
  se.on('dialog', async dialog => {
    try { await dialog.accept(); } catch(e) {}
  });
  
  // 26 버튼 클릭 (팝업 열기)
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
  
  // 팝업 스크롤하여 모든 삭제 버튼 활성화
  await se.evaluate(() => {
    const popup = document.querySelector('.popup_content__lUaop');
    if (popup) {
      // 맨 위로 스크롤
      popup.scrollTop = 0;
    }
  });
  await sleep(1000);
  
  // 모든 delete_button 클릭 (evaluate 내에서 직접)
  let deleted = 0;
  
  for (let i = 0; i < 30; i++) {
    const result = await se.evaluate(() => {
      // 모든 삭제 버튼 중 첫 번째 visible 버튼 찾기
      const btns = document.querySelectorAll('button.delete_button__kdXNv');
      for (const btn of btns) {
        // display none이 아닌 것만 (팝업 내에서)
        if (btn.offsetParent !== null || btn.closest('[class*=popup]')) {
          btn.click();
          return 'clicked';
        }
      }
      return 'none';
    });
    
    if (result === 'none') {
      console.log('   더 이상 삭제 버튼 없음');
      break;
    }
    deleted++;
    await sleep(2000);
    
    // 5개 삭제마다 상태 출력
    if (deleted % 5 === 0) console.log('   ' + deleted + '개 삭제됨');
  }
  
  console.log('\n=== 결과 ===');
  console.log(deleted + '개 삭제 완료!');
  
  // 잔여 확인
  await sleep(2000);
  const remain = await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = btn.innerText.trim();
      if (t.match(/^\d+$/)) return t + '개 남음';
    }
    return '0개 (전체 삭제 완료)';
  });
  console.log('잔여:', remain);
  
  await b.close();
})();

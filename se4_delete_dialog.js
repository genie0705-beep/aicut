const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages[2] || pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const se = wp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!se) { console.log('NO FRAME'); await b.close(); return; }
  
  // dialog 자동 처리 (confirm 자동 수락)
  se.on('dialog', async dialog => {
    await dialog.accept();
  });
  
  // dialog 자동 처리
  se.on('dialog', async dialog => {
    console.log('다이얼로그:', dialog.message().substring(0, 50));
    await dialog.accept();
  });
  
  // 26 버튼 클릭
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const label = btn.getAttribute('aria-label') || '';
      if (label.includes('임시저장')) { btn.click(); return; }
    }
  });
  await sleep(3000);
  
  // dialog 자동 수락 (evaluate 내부 클릭에도 반응)
  let deleted = 0;
  
  for (let i = 0; i < 30; i++) {
    const result = await se.evaluate(() => {
      const btns = document.querySelectorAll('button.delete_button__kdXNv');
      for (const btn of btns) {
        if (btn.offsetParent !== null) {
          // 원본 HTMLElement.click() 호출 (신뢰할 수 있는 이벤트)
          btn.click();
          return 'clicked';
        }
      }
      return 'none';
    });
    
    if (result === 'none') break;
    deleted++;
    await sleep(2000);
    console.log('   ' + deleted + '개 삭제');
  }
  
  console.log(`\n=== 완료: ${deleted}개 삭제 ===`);
  
  await b.close();
})();

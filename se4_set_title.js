const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages.find(p => p.url().includes('Redirect=Write'));
  if (!page) { console.log('NO PAGE'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);
  
  // SmartEditor가 있는 프레임 찾기
  const allFrames = page.frames();
  let seFrame = null;
  for (const f of allFrames) {
    const has = await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false);
    if (has) { seFrame = f; break; }
  }
  
  if (!seFrame) { console.log('NO SE FRAME'); await b.close(); return; }
  
  console.log('✅ SmartEditor 프레임 발견');
  
  // 제목 설정
  await seFrame.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('무더위에 지친 보험설계사라면? 하반기 숏폼 마케팅으로 승부보세요');
  });
  await sleep(2000);
  
  // 제목 확인
  const title = await seFrame.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentTitle());
  console.log('제목:', title.substring(0, 50));
  
  // 저장
  await seFrame.evaluate(() => {
    const btns = document.querySelectorAll('button, a, [role=button]');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장' || btn.innerText.trim() === '임시저장') {
        btn.click();
        return;
      }
    }
  });
  await sleep(5000);
  
  console.log('✅ 저장 완료');
  
  await b.close();
})();

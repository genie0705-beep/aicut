const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 새 글쓰기 페이지 탭
  const wp = pages[2];
  if (!wp || !wp.url().includes('Redirect=Write')) {
    console.log('NO WRITE TAB at index 2, searching...');
    const found = pages.find(p => p.url().includes('Redirect=Write'));
    if (!found) { console.log('NO PAGE'); await b.close(); return; }
    await found.bringToFront();
  } else {
    await wp.bringToFront();
  }
  await sleep(3000);
  
  const frames = (wp.context() ? wp : await b.contexts()[0].pages().find(p => p.url().includes('Redirect=Write'))).frames();
  const page = wp.context() ? wp : (await b.contexts()[0].pages()).find(p => p.url().includes('Redirect=Write'));
  
  // SE 프레임 찾기
  const allFrames = page.frames();
  let seFrame = null;
  for (const f of allFrames) {
    const has = await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false);
    if (has) { seFrame = f; break; }
  }
  if (!seFrame) { console.log('NO SE FRAME'); await b.close(); return; }
  
  console.log('✅ SE 프레임 발견');
  
  // 1. 제목 설정
  await seFrame.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('무더위에 지친 보험설계사라면? 하반기 숏폼 마케팅으로 승부보세요');
  });
  await sleep(1000);
  
  // 2. canvas에 HTML 직접 설정
  await seFrame.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return;
    
    // SE4의 canvas 데이터 방식으로 blocks 설정
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    // blocks 배열 구성
    data.document.blocks = [
      { type: 'heading2', text: '무더위, 보험설계사에게 가장 힘든 계절이 돌아왔습니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '7월 한낮 기온이 33도를 넘나듭니다.', style: { textAlign: 'center' } }
    ];
    
    ed.setDocumentData(data);
    
    // canvas 직접 업데이트
    canvas.innerHTML = '<h2 style="text-align:center">무더위, 보험설계사에게 가장 힘든 계절이 돌아왔습니다.</h2><p style="text-align:center">7월 한낮 기온이 33도를 넘나듭니다.</p>';
  });
  await sleep(3000);
  
  // 3. 저장
  await seFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // 4. 확인
  const v = await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    return {
      title: ed.getDocumentTitle(),
      textLen: text.length,
      text: text.substring(0, 150)
    };
  });
  
  console.log(JSON.stringify(v, null, 2));
  
  await b.close();
})();

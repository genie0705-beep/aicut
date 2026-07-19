const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages[2] || pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE'); await b.close(); return; }
  
  // Strong 테스트: blocks text에 <strong> 추가
  await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    
    // Strong이 필요한 키워드들 적용
    for (const b of blocks) {
      if (!b.text) continue;
      if (b.text.includes('하반기 준비')) b.text = b.text.replace('하반기 준비', '<strong>하반기 준비</strong>');
      if (b.text.includes('보험설계사가 같은 고민')) b.text = b.text.replace('보험설계사', '<strong>보험설계사</strong>');
      if (b.text.includes('숏폼 마케팅이 대세')) b.text = b.text.replace('숏폼 마케팅', '<strong>숏폼 마케팅</strong>');
      if (b.text.includes('영상편집외주가 필요')) b.text = b.text.replace('영상편집외주', '<strong>영상편집외주</strong>');
      if (b.text.includes('하반기 승리자')) b.text = b.text.replace('하반기 승리자', '<strong>하반기 승리자</strong>');
      if (b.text.includes('영상 마케팅은 지금')) b.text = b.text.replace('영상 마케팅', '<strong>영상 마케팅</strong>');
      if (b.text.includes('하반기 마케팅이 가능')) b.text = b.text.replace('하반기 마케팅', '<strong>하반기 마케팅</strong>');
    }
    
    ed.setDocumentData(data);
    
    // canvas 업데이트 (HTML 그대로 사용)
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      let html = '';
      for (const b of blocks) {
        if (b.type === 'heading2') html += '<h2 style="text-align:center">' + b.text + '</h2>';
        else if (b.type === 'heading3') html += '<h3 style="text-align:center">' + b.text + '</h3>';
        else if (b.text) html += '<p style="text-align:center">' + b.text + '</p>';
        else html += '<p style="text-align:center"><br></p>';
      }
      canvas.innerHTML = html;
    }
  });
  await sleep(2000);
  
  // Strong 적용 확인
  const r = await se.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    const strongs = canvas ? canvas.querySelectorAll('strong') : [];
    return { strongCount: strongs.length, strongTexts: Array.from(strongs).map(s => s.innerText.substring(0, 20)) };
  });
  
  console.log('Strong 적용 결과:', JSON.stringify(r));
  
  // 저장
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // 최종 검증
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    const strongs = canvas ? canvas.querySelectorAll('strong') : [];
    return {
      title: ed.getDocumentTitle(),
      textLen: text.length,
      strongCount: strongs.length,
      hasHash: text.includes('#보험설계사'),
      hasCTA: text.includes('pf.kakao')
    };
  });
  
  console.log('\n=== 최종 검증 ===');
  console.log(JSON.stringify(v, null, 2));
  
  await b.close();
})();

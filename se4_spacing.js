const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') || p.url().includes('Redirect=Write')) {
      targetPage = p;
      break;
    }
  }
  if (!targetPage) { console.log('❌ 에디터 페이지 없음'); return; }

  const frames = targetPage.frames();
  let editorFrame = null;
  for (const f of frames) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { editorFrame = f; break; }
    } catch(e) {}
  }
  if (!editorFrame) { console.log('❌ SmartEditor 없음'); return; }

  console.log('✅ 에디터 발견, 간격 조정 시작...\n');

  // 각 paragraph에 margin-bottom 추가 + 섹션 구분선/여백 추가
  const result = await editorFrame.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let adjusted = 0;
    let sectionsFound = 0;
    
    // 섹션 구분 키워드
    const sectionMarkers = ['첫 번째 코스', '두 번째 코스', '세 번째 코스', '네 번째 코스', '다섯 번째 코스', '영상으로 남겨보세요'];
    
    paras.forEach((p, i) => {
      const text = p.innerText.trim();
      
      // 기본 문단 간격: 12px
      p.style.marginBottom = '12px';
      adjusted++;
      
      // 섹션 헤더(H2/H3) 위아래 더 큰 간격
      if (text.includes('코스') || text.includes('서울식물원') || text.includes('안국동') || 
          text.includes('여의도') || text.includes('송파') || text.includes('서교') ||
          text.includes('영상으로')) {
        p.style.marginTop = '32px';
        p.style.marginBottom = '16px';
        sectionsFound++;
      }
      
      // 아이콘(📍🚇🕘💰🅿️🎯🍽️💡)이 있는 정보 라인 간격
      if (text.match(/[📍🚇🕘💰🅿️🎯🍽️💡🎵]/)) {
        p.style.marginBottom = '6px';
        p.style.marginTop = '4px';
      }
      
      // 구분선(---) 위아래 큰 간격
      if (text === '---') {
        p.style.marginTop = '40px';
        p.style.marginBottom = '40px';
      }
      
      // 해시태그 위 여백
      if (text.startsWith('#')) {
        p.style.marginTop = '40px';
      }
      
      // CTA 영역 (이메일/링크) 위 여백
      if (text.includes('@aicut.co.kr') || text.includes('pf.kakao') || text.includes('aicut.co.kr')) {
        p.style.marginTop = '8px';
        p.style.marginBottom = '4px';
      }
    });

    return { totalParas: paras.length, adjusted, sectionsFound };
  });

  console.log(`   전체 문단: ${result.totalParas}`);
  console.log(`   간격 조정: ${result.adjusted}`);
  console.log(`   섹션 발견: ${result.sectionsFound}`);

  // 저장 버튼 클릭
  await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('\n✅ 간격 조정 완료! 저장도 완료.');
  console.log('브라우저에서 확인해주세요.');
})();

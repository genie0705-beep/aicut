const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const bp = await ctx.newPage();
  await bp.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await bp.waitForTimeout(3000);

  const ef = bp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!ef) return console.log('no editor frame');

  // 제목 설정
  await ef.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지');
  });
  console.log('Title set');

  // 방법: input_buffer iframe의 contentDocument.body에 직접 HTML 삽입
  const result = await ef.evaluate(() => {
    const results = [];
    
    // 1. input_buffer iframe 찾기
    const inputFrame = document.querySelector('iframe[id^="input_buffer"]');
    if (inputFrame && inputFrame.contentDocument) {
      const body = inputFrame.contentDocument.body;
      if (body) {
        body.innerHTML = '<p><b>"영상 편집 외주, 한 번 맡겨볼까?"</b></p><p>외주를 처음 맡길 때 꼭 체크해야 할 <b>5가지</b>를 정리했습니다.</p><br><h2>1. 우리 스타일을 이해하고 있나요?</h2><p>브랜드 컬러, 폰트, 톤앤매너, 레퍼런스를 공유하세요.</p><br><h2>2. 수정 범위와 횟수는?</h2><p>기본 수정 횟수, 추가 비용, 오탈자 수정 여부를 확인하세요.</p><br><h2>3. 납품 일정은?</h2><p>원본 전송 후 며칠? 긴급 건 가능 여부를 물어보세요.</p><br><h2>4. 저작권과 소유권은?</h2><p>결과물 소유권, BGM/폰트 라이선스를 확인하세요.</p><br><h2>5. 우리 업종 사례가 있나요?</h2><p>우리 업종 경험이 있는 외주사가 훨씬 빠릅니다.</p><br><div style="background:#F5F6FA;padding:20px;border-radius:12px;text-align:center;"><p style="font-size:16px;font-weight:700;color:#5C3DE8;">외주사 선택 5가지 체크리스트</p><p>① 브랜드 이해도 → ② 수정 범위 → ③ 납품 일정 → ④ 저작권 → ⑤ 포트폴리오</p></div><br><div style="text-align:center;font-size:12px;color:#999;"><p>에이컷 — 48시간 숏폼 영상 편집 구독 서비스</p><p>📬 pf.kakao.com/_GIesX/chat | master@aicut.co.kr | aicut.co.kr</p></div>';
        results.push('input_buffer body set');
      } else { results.push('no input_buffer body'); }
    } else { results.push('no input_buffer iframe'); }

    // 2. contenteditable div에 직접 입력
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      ce.innerHTML = ''; // clear
      ce.focus();
      
      // document.execCommand로 내용 입력
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      
      document.execCommand('insertHTML', false, '<p><b>"영상 편집 외주, 한 번 맡겨볼까?"</b></p><p>외주를 처음 맡길 때 꼭 체크해야 할 <b>5가지</b>를 정리했습니다.</p><br><h2>1. 우리 스타일을 이해하고 있나요?</h2><p>브랜드 컬러, 폰트, 톤앤매너, 레퍼런스를 공유하세요.</p><br><h2>2. 수정 범위와 횟수는?</h2><p>기본 수정 횟수, 추가 비용, 오탈자 수정 여부를 확인하세요.</p><br><h2>3. 납품 일정은?</h2><p>원본 전송 후 며칠? 긴급 건 가능 여부를 물어보세요.</p><br><h2>4. 저작권과 소유권은?</h2><p>결과물 소유권, BGM/폰트 라이선스를 확인하세요.</p><br><h2>5. 우리 업종 사례가 있나요?</h2><p>우리 업종 경험이 있는 외주사가 훨씬 빠릅니다.</p><br><div style="background:#F5F6FA;padding:20px;border-radius:12px;text-align:center;"><p style="font-size:16px;font-weight:700;color:#5C3DE8;">외주사 선택 5가지 체크리스트</p><p>① 브랜드 이해도 → ② 수정 범위 → ③ 납품 일정 → ④ 저작권 → ⑤ 포트폴리오</p></div><br><div style="text-align:center;font-size:12px;color:#999;"><p>에이컷 — 48시간 숏폼 영상 편집 구독 서비스</p><p>📬 pf.kakao.com/_GIesX/chat | master@aicut.co.kr | aicut.co.kr</p></div>');
      results.push('execCommand insertHTML done');
      
      // 내용 확인
      results.push('length: ' + ce.innerHTML.length);
    } else { results.push('no contenteditable'); }
    
    return results.join(' | ');
  });

  console.log('Result:', result);

  // 저장
  await ef.evaluate(() => {
    try { SmartEditor._editors['blogpc001'].saveDraft(); } catch(e) {}
  });
  console.log('Draft saved');

  // 최종 확인
  const verify = await ef.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) return 'CE length: ' + ce.innerHTML.length + ' | text: ' + ce.textContent.substring(0, 60);
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (iframe && iframe.contentDocument) return 'IF length: ' + (iframe.contentDocument.body?.innerHTML?.length || 0);
    return 'cannot verify';
  });
  console.log('Verify:', verify);
  console.log('DONE');
})();

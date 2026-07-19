const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const editorPage = pages.find(p => p.url().includes('Redirect=Write'));
  const frames = editorPage.frames();
  const seFrame = frames.find(f => f.url().includes('/postwrite'));
  
  // Step 1: Clear and set title
  const titleResult = await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._documentService.resetDocumentData();
    se.setDocumentTitle('분양대행사 하반기 마케팅 전략, 영상 콘텐츠가 답이다');
    return { titleSet: true };
  });
  console.log('Title set:', JSON.stringify(titleResult));
  
  // Step 2: Focus and write intro
  await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._canvasScrollingService.focusToFirstComp();
  });
  
  const intro = `2026년 상반기가 마무리되고 있습니다. 분양대행사 관계자라면 지금이 하반기 마케팅 전략을 수립할 가장 중요한 타이밍입니다.
분양 시장에서 영상 콘텐츠는 더 이상 선택이 아닌 필수가 되었고, 특히 숏폼 영상은 분양 정보 전달과 브랜딩에 효과적인 도구로 자리 잡았습니다.
이번 글에서는 분양대행사가 하반기 준비를 위해 어떤 영상 마케팅 전략을 세워야 하는지 실제 경험과 함께 정리해봤습니다.`;
  
  await seFrame.evaluate((text) => {
    const se = SmartEditor.getEditor('blogpc001');
    se._editingService.writeTextWithSoftLineBreak(text);
  }, intro);
  
  console.log('Intro written');
  
  // Step 3: Add section 1
  await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._editingService.lineBreak();
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('🏢 분양 시장, 왜 지금 영상 마케팅인가');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('분양 업계는 전통적으로 브로셔와 현장 상담 중심의 마케팅을 해왔습니다. 하지만 디지털 전환 가속화와 MZ세대의 분양 시장 진입으로 소비자의 정보 탐색 방식이 완전히 바뀌었습니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('텍스트와 이미지만으로 구성된 분양 정보는 더 이상 경쟁력이 없습니다. 실제로 분양 관련 온라인 콘텐츠 중 영상이 포함된 페이지의 체류 시간은 텍스트 전용 페이지 대비 평균 2.5배 이상 높다는 데이터도 있습니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('분양대행사는 하반기 분양 일정에 맞춰 영상 콘텐츠를 미리 준비해야 합니다. 모델하우스 촬영부터 분양 현장 영상, 단지 소개 숏폼까지 영상의 활용 범위는 점점 넓어지고 있습니다.');
  });
  console.log('Section 1 written');
  
  // Step 4: Section 2 - 3가지 유형
  await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._editingService.lineBreak();
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('영상 콘텐츠, 어떤 걸 준비해야 하나');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('분양대행사가 하반기에 준비해야 할 영상 콘텐츠는 크게 세 가지 유형으로 나눌 수 있습니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('① 모델하우스 투어 영상 — 실제 모델하우스의 인테리어와 동선을 영상으로 보여주는 콘텐츠입니다. 방문 전에 공간을 미리 체험할 수 있어 예비 청약자의 관심을 높입니다. 드론 촬영을 병행하면 단지 주변 환경까지 함께 소개할 수 있습니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('② 분양 현장 숏폼 영상 — 티켓 마감 현장, 모델하우스 오픈 라이브, 청약 접수 현장 등 생생한 현장감을 전달하는 숏폼 콘텐츠입니다. 릴스와 쇼츠 위주로 제작하면 자연 유입이 가능합니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('③ 단지 소개 브랜디드 콘텐츠 — 단지의 핵심 가치를 스토리텔링으로 풀어내는 영상입니다. 입지, 평면 설계, 커뮤니티 시설 등 분양 포인트를 영상으로 구성하면 브랜드 이미지 제고에 효과적입니다.');
  });
  console.log('Section 2 written');
  
  // Step 5: Section 3 - 채널별 전략
  await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._editingService.lineBreak();
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('릴스·쇼츠·틱톡, 채널별 전략');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('분양대행사가 영상 마케팅에서 가장 간과하기 쉬운 부분이 채널별 특성에 맞지 않는 콘텐츠 제작입니다. 같은 영상이라도 플랫폼에 따라 포맷과 메시지를 달리해야 효과가 극대화됩니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('인스타그램 릴스는 감성적인 분위기와 인테리어 중심의 영상이 잘 맞습니다. 모델하우스의 디테일한 인테리어 컷과 감성적인 BGM 조합으로 예비 청약자의 감성에 어필하는 전략이 효과적입니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('유튜브 쇼츠는 정보 전달형 콘텐츠에 강합니다. 분양 조건, 청약 일정, 지역별 시세 분석 등 유용한 정보를 간결하게 전달하는 숏폼이 조회수와 구독자 유입에 좋은 성과를 보입니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('틱톡은 트렌디하고 가벼운 톤의 콘텐츠가 필요합니다. 분양 관계자의 일상이나 현장 비하인드 등 진정성 있는 콘텐츠로 젊은 예비 청약자와의 접점을 만드는 전략이 통합니다.');
  });
  console.log('Section 3 written');
  
  // Step 6: Section 4 - 아웃소싱
  await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._editingService.lineBreak();
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('인력 고용보다 아웃소싱이 나은 이유');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('분양대행사가 영상 콘텐츠를 직접 제작하려면 전담 인력과 장비가 필요합니다. 하지만 대부분의 분양대행사는 코어 업무가 분양 대행이지 영상 제작이 아닙니다. 실제로 자체 영상 인력을 고용한 분양대행사의 경우, 인건비 부담 대비 콘텐츠 생산량이 기대에 미치지 못하는 사례가 많습니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('영상 편집 아웃소싱의 장점은 명확합니다. 첫째, 비용 효율성입니다. 전담 인력 1명의 월 인건비로 10~20편의 영상을 외주 제작할 수 있습니다. 둘째, 퀄리티입니다. 전문 에디터가 작업하기 때문에 인하우스 대비 완성도가 높습니다. 셋째, 정시 납품입니다. 월 정기 계약 시 정해진 일정에 맞춰 영상이 정기적으로 납품되므로 마케팅 일정 관리가 수월합니다.');
  });
  console.log('Section 4 written');
  
  // Step 7: Section 5 - CTA
  await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._editingService.lineBreak();
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('하반기, 지금부터 준비해야 하는 이유');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('7월부터 본격적인 하반기 분양 시즌이 시작됩니다. 지금 영상 콘텐츠를 준비하지 않으면 8~9월 성수기에 경쟁사에 뒤처질 수 있습니다. 특히 숏폼 콘텐츠는 제작 후에도 알고리즘에 따라 유입이 지연되기 때문에 미리 준비하고 발행 일정을 잡아두는 것이 중요합니다.');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('분양대행사의 하반기 영상 마케팅, 막막하다면 에이컷에 물어보세요. 분양 업종 특화 영상 편집 경험을 바탕으로 분양대행사에 최적화된 숏폼 영상 제작을 제안합니다.');
    se._editingService.lineBreak();
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('📞 무료 상담 및 문의');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('카카오톡: pf.kakao.com/_GIesX/chat');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('이메일: master@aicut.co.kr');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('홈페이지: aicut.co.kr');
    se._editingService.lineBreak();
    se._editingService.writeTextWithSoftLineBreak('에이컷과 함께 하반기 마케팅을 준비하세요.');
  });
  console.log('Section 5 + CTA written');
  
  // Step 8: Verify content
  const verify = await seFrame.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    return {
      title: se.getDocumentTitle(),
      textLength: se.getContentText().length,
      paragraphCount: document.querySelectorAll('.se-text-paragraph').length,
    };
  });
  console.log('Verify:', JSON.stringify(verify));
  
  // Step 9: Apply center alignment
  await seFrame.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    // Dispatch event to notify SE4
    document.querySelector('.se-main-container')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  console.log('Center alignment applied');
  
  // Step 10: Take a screenshot to verify
  await seFrame.screenshot({ path: '_se_content.png', fullPage: true });
  console.log('Screenshot saved');
  
  await b.close();
  console.log('=== DONE ===');
})();

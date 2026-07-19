const { chromium } = require('playwright');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let ep = null, sf = null;
  for (const p of ctx.pages()) {
    const f = p.frames().find(f => f.url().includes('/postwrite') || f.url().includes('PostWriteForm'));
    if (f) {
      const hasEd = await f.evaluate(() => Object.keys(SmartEditor._editors||{}).length > 0).catch(()=>false);
      if (hasEd) { ep = p; sf = f; break; }
    }
  }
  if (!ep || !sf) { console.log('No editor'); await b.close(); return; }
  
  ep.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  const w = async (t) => {
    await sf.evaluate((txt) => {
      SmartEditor.getEditor('blogpc001')._editingService.writeTextWithSoftLineBreak(txt);
    }, t);
  };
  const br = async () => {
    await sf.evaluate(() => { SmartEditor.getEditor('blogpc001')._editingService.lineBreak(); });
  };
  const up = async (file) => {
    const btn = sf.locator('.se-toolbar-item-image button').first();
    const fcP = ep.waitForEvent('filechooser',{timeout:10000}).catch(()=>null);
    await btn.click(); await ep.waitForTimeout(800);
    const fc = await fcP;
    if (fc) { await fc.setFiles(path.join(W, file)); await ep.waitForTimeout(3000); }
    await sf.evaluate(() => {
      try { SmartEditor.getEditor('blogpc001')._editingService.insertTextCompAtLast(); } catch(e) {}
    });
    await ep.waitForTimeout(500);
  };
  
  // RESET
  console.log('=== 초기화 ===');
  await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._documentService.resetDocumentData();
    se.setDocumentTitle('피부과·성형외과 원장님, 여름 숏폼 마케팅으로 예약률 2배 올리는 법');
    se._canvasScrollingService.focusToFirstComp();
  });
  
  // 1. MAIN 이미지 (제목 다음, 본문 전)
  console.log('[1] 메인 이미지...');
  await up('aicut_blog_estate_main.png');
  
  // 2. 도입부 — 병원 마케팅 공감형
  console.log('[2] 도입부...');
  await w('피부과·성형외과 원장님이라면 상상해보세요.'); await br();
  await w('여름만 되면 피부 관리 문의는 늘어나는데,'); await br();
  await w('환자들은 병원보다 인스타그램을 먼저 검색합니다.'); await br(); await br();
  await w('"○○피부과 릴스", "△△성형외과 비포에프터"'); await br();
  await w('환자들은 진료받기 전에 이미 SNS에서 병원을 검색합니다.'); await br(); await br();
  await w('텍스트와 이미지만으로는 더 이상 경쟁력이 없습니다.'); await br();
  await w('숏폼 영상 마케팅이 선택이 아닌 필수가 된 이유입니다. 💡'); await br(); await br();
  
  // 3. CARD1 이미지 (시장 트렌드)
  console.log('[3] card1 이미지...');
  await up('aicut_blog_estate_cycle.png');
  
  await w('☀️ 여름 시즌, 왜 지금 병원 숏폼인가'); await br(); await br();
  await w('여름은 피부 관리 수요가 폭발하는 시즌입니다.'); await br();
  await w('선크림, 다이어트, 여드름 케어, 쿨링 시술까지'); await br();
  await w('환자들의 SNS 검색량이 급증하는 골든타임이죠.'); await br(); await br();
  await w('문제는 검색은 하는데,'); await br();
  await w('내 병원의 콘텐츠가 검색 결과에 뜨지 않는다는 겁니다.'); await br();
  await w('숏폼 영상 하나면, 환자와의 첫 접점을 만들 수 있습니다.'); await br(); await br();
  
  // 4. CARD2 이미지 (3가지 콘텐츠)
  console.log('[4] card2 이미지...');
  await up('aicut_blog_estate_cost.png');
  
  await w('📋 병원 숏폼, 이렇게 준비하세요'); await br(); await br();
  await w('첫째, 시술 소개 영상입니다.'); await br();
  await w('레이저 토닝, 보톡스, 필러 등 주요 시술을'); await br();
  await w('30초 내외로 소개하는 숏폼이 가장 효과적입니다.'); await br(); await br();
  await w('둘째, 비포에프터 영상입니다.'); await br();
  await w('환자 동의를 받은 실제 케이스를 공유하면'); await br();
  await w('신뢰도가 확 올라갑니다.'); await br();
  await w('환자들은 "실제 결과"를 가장 궁금해합니다.'); await br(); await br();
  await w('셋째, 원장님 일상·진료 철학 영상입니다.'); await br();
  await w('원장님의 진료 철학과 병원 분위기를 보여주면'); await br();
  await w('환자와의 심리적 거리를 좁힐 수 있습니다.'); await br(); await br();
  
  // 5. CARD3 이미지 (채널별 전략)
  console.log('[5] card3 이미지...');
  await up('aicut_blog_estate_channel.png');
  
  await w('📱 플랫폼별 병원 마케팅 전략'); await br(); await br();
  await w('인스타그램 릴스는 감성적인 병원 브랜딩에 효과적입니다.'); await br();
  await w('깔끔한 인테리어와 친절한 의료진의 모습을');
  await br();
  await w('짧은 영상으로 보여주면 팔로워가 자연스럽게 늘어납니다.'); await br(); await br();
  await w('유튜브 쇼츠는 정보 전달형 콘텐츠에 강합니다.'); await br();
  await w('"여름철 피부 관리 꿀팁", "시술 후 관리법" 등'); await br();
  await w('실질적 도움을 주는 영상이 구독자 유입에 효과적입니다.'); await br(); await br();
  await w('틱톡은 트렌디하고 가벼운 접근이 필요합니다.'); await br();
  await w('병원 스태프의 일상, 재미있는 의학 상식 등'); await br();
  await w('젊은 환자층과의 접점을 만드는 전략이 통합니다.'); await br(); await br();
  
  // 6. CARD4 이미지 (아웃소싱)
  console.log('[6] card4 이미지...');
  await up('aicut_blog_estate_after.png');
  
  await w('✅ 영상 편집 아웃소싱, 이렇게 바뀝니다'); await br(); await br();
  await w('첫째, 콘텐츠 제작 시간이 확 줄어듭니다.'); await br();
  await w('촬영 원본만 보내면, 전문 에디터가 편집부터'); await br();
  await w('자막, BGM, 색보정까지 완료해서 납품합니다.'); await br(); await br();
  await w('둘째, 퀄리티가 일정하게 유지됩니다.'); await br();
  await w('매번 다른 에디터에게 맡길 필요 없이'); await br();
  await w('전담팀이 브랜드 톤을 유지해줍니다.'); await br(); await br();
  await w('셋째, 월 정기 납품으로 마케팅 일정을'); await br();
  await w('체계적으로 관리할 수 있습니다.'); await br();
  await w('더 이상 "이번 주 영상은?"이라는 압박이 없습니다.'); await br(); await br();
  
  // 7. CTA 이미지 (마지막)
  console.log('[7] CTA 이미지...');
  await up('aicut_blog_estate_cta.png');
  
  await w('🎯 여름 시즌, 지금 준비하세요'); await br(); await br();
  await w('7~8월은 피부 관리 성수기입니다.'); await br();
  await w('숏폼 콘텐츠는 알고리즘 유입이 지연되기 때문에'); await br();
  await w('시즌이 시작되기 전에 미리 준비하는 것이 중요합니다.'); await br(); await br();
  await w('병원 영상 마케팅, 막막하다면 에이컷에 문의하세요.'); await br();
  await w('의료 마케팅 특화 영상 편집 경험을 바탕으로'); await br();
  await w('최적화된 숏폼 영상 제작을 제안합니다.'); await br(); await br();
  await w('📩 카톡: pf.kakao.com/_GIesX/chat'); await br();
  await w('📧 이메일: master@aicut.co.kr'); await br();
  await w('🌐 홈페이지: aicut.co.kr'); await br(); await br();
  
  // 해시태그 30개 (5개씩 6줄)
  await w('#병원마케팅 #여름마케팅 #피부과 #성형외과 #숏폼마케팅'); await br();
  await w('#의료마케팅 #피부관리 #여름피부 #릴스마케팅 #유튜브쇼츠'); await br();
  await w('#틱톡마케팅 #영상편집외주 #영상편집대행 #병원숏폼 #비포에프터'); await br();
  await w('#피부과릴스 #의사소통 #병원브랜딩 #SNS마케팅 #의료광고'); await br();
  await w('#여름피부관리 #선크림 #다이어트시즌 #병원홍보 #영상콘텐츠'); await br();
  await w('#에이컷 #aicuts #숏폼제작 #의료영상 #마케팅전략'); await br();
  
  // === SEO 보강 ===
  console.log('[9] SEO 보강...');
  // Strong 키워드
  await sf.evaluate(() => {
    const keywords = ['병원', '숏폼', '마케팅', '피부', '여름'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const text = p.textContent;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          p.style.fontWeight = '700';
          break;
        }
      }
    });
    // 섹션 제목 굵게
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const t = p.textContent.trim();
      if (t.startsWith('☀️') || t.startsWith('📋') || t.startsWith('📱') || t.startsWith('✅') || t.startsWith('🎯')) {
        p.style.fontWeight = '800';
        p.style.fontSize = '18px';
        p.style.marginTop = '12px';
      }
    });
    // 목록 스타일
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const t = p.textContent.trim();
      if (t.startsWith('첫째') || t.startsWith('둘째') || t.startsWith('셋째')) {
        p.style.paddingLeft = '20px';
        p.style.textIndent = '-10px';
      }
    });
    // 이미지 alt
    const altTexts = [
      '병원 여름 숏폼 마케팅 대표 이미지',
      '여름 시즌 병원 마케팅 트렌드',
      '병원 숏폼 콘텐츠 3가지 유형',
      '병원 마케팅 채널별 전략',
      '병원 영상 편집 아웃소싱 도입 효과',
      '병원 영상 마케팅 무료 상담 안내'
    ];
    document.querySelectorAll('.se-image-resource').forEach((img, i) => {
      if (i < altTexts.length) img.alt = altTexts[i];
    });
  });
  
  // Center alignment
  await sf.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelectorAll('.se-section-image').forEach(s => {
      s.classList.add('se-section-align-center');
      s.style.textAlign = 'center';
    });
  });
  
  const st = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    return {
      title: se.getDocumentTitle(),
      len: se.getContentText().length,
      imgs: document.querySelectorAll('.se-image-resource').length,
      paras: document.querySelectorAll('.se-text-paragraph').length,
    };
  });
  
  console.log('\n=== 최종 ===');
  console.log(JSON.stringify(st, null, 2));
  await b.close();
  console.log('=== 완료 ===');
})();

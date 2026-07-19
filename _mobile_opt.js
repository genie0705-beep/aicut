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
    se.setDocumentTitle('분양대행사, 브로셔만 들고 있다가 영상 마케팅으로 하반기 매출 2배 올린 썰');
    se._canvasScrollingService.focusToFirstComp();
  });
  
  // ===== 모바일 최적화 본문 (줄바꿈/띄어쓰기/맞춤법 정정) =====
  
  // 1. MAIN 이미지
  console.log('[1] 메인 이미지...');
  await up('aicut_blog_estate_main.png');
  
  // 2. 도입부 — 모바일 2~3줄씩 끊어서
  console.log('[2] 도입부...');
  await w('분양대행사라면 공감할 이야기.');
  await br();
  await w('하반기 분양 일정은 다 잡혔는데, 마케팅은 어떻게 해야 할지');
  await br();
  await w('막막했던 경험, 한 번쯤 있지 않으신가요?');
  await br(); await br();
  
  await w('"브로셔는 만들었는데, 요즘 경쟁사들은 영상까지 찍더라."');
  await br();
  await w('"영상 제작 알아보니 견적이 천차만별이고 뭐가 맞는지 모르겠고."');
  await br();
  await w('"하반기 준비해야 하는데 시간은 너무 부족하고."');
  await br(); await br();
  
  await w('이게 수많은 분양대행사 관계자분들의 현실입니다.');
  await br();
  await w('저 역시 같은 고민을 했고, 3개월간의 시행착오 끝에 해결책을 찾았습니다.');
  await br();
  await w('오늘은 그 경험을 솔직하게 공유합니다.');
  await br(); await br();
  
  // 3. CYCLE 이미지
  console.log('[3] cycle 이미지...');
  await up('aicut_blog_estate_cycle.png');
  
  // 4. cycle 텍스트
  await w('🔄 직접 하려다 부딪힌 3개월의 현실');
  await br(); await br();
  
  await w('1달 차에는 "영상쯤이야 우리도 할 수 있지"라는 자신감으로 가득했습니다.');
  await br();
  await w('스마트폰으로 직접 찍고, 무료 편집 앱으로 대충 편집하면 된다고 생각했죠.');
  await br(); await br();
  
  await w('2달 차, 현실을 깨달았습니다.');
  await br();
  await w('스마트폰으로 찍은 영상은 화질이 들쭉날쭉했고,');
  await br();
  await w('편집에 4~5시간씩 투자하다 보니 본업인 분양 대행에 지장이 생기기 시작했습니다.');
  await br(); await br();
  
  await w('3달 차, 결론을 내렸습니다.');
  await br();
  await w('"이거 차라리 전문 업체에 맡기는 게 낫겠다."');
  await br();
  await w('이 결정이 모든 것을 바꿨습니다.');
  await br(); await br();
  
  // 5. COST 이미지
  console.log('[4] cost 이미지...');
  await up('aicut_blog_estate_cost.png');
  
  // 6. cost 텍스트
  await w('💡 직접 vs 외주, 냉정한 계산');
  await br(); await br();
  
  await w('전담 인력 1명의 월 인건비는 최소 300만원부터 시작합니다.');
  await br();
  await w('여기에 장비 비용과 교육 시간을 더하면 부담은 더 커집니다.');
  await br(); await br();
  
  await w('반면 영상 편집 아웃소싱은 월 50~100만원 수준으로');
  await br();
  await w('전문가 퀄리티의 영상을 정기적으로 납품받을 수 있습니다.');
  await br();
  await w('주 20시간 이상 투자하던 시간이 1시간 이내로 줄었고,');
  await br();
  await w('퀄리티는 오히려 올라갔습니다.');
  await br(); await br();
  
  await w('또 한 가지 중요한 점은 일관성입니다.');
  await br();
  await w('매번 다른 프리랜서에게 맡기면 색감과 톤이 달라지지만,');
  await br();
  await w('전문 에이전시는 브랜드 아이덴티티를 유지한 채');
  await br();
  await w('꾸준한 콘텐츠를 생산할 수 있습니다.');
  await br(); await br();
  
  // 7. CHANNEL 이미지
  console.log('[5] channel 이미지...');
  await up('aicut_blog_estate_channel.png');
  
  // 8. channel 텍스트
  await w('📱 채널별 맞춤 전략이 필요한 이유');
  await br(); await br();
  
  await w('인스타그램 릴스는 감성적인 인테리어 위주의 영상이 효과적입니다.');
  await br();
  await w('모델하우스의 디테일한 공간을 잔잔한 BGM과 함께 보여주면');
  await br();
  await w('예비 청약자들의 저장률이 크게 올라갑니다.');
  await br(); await br();
  
  await w('유튜브 쇼츠는 정보 전달형 콘텐츠가 강합니다.');
  await br();
  await w('"이번 달 청약 일정", "지역별 분양가 비교" 등');
  await br();
  await w('실질적인 도움을 주는 정보를 30~60초로 압축하면');
  await br();
  await w('구독자 유입에 효과적입니다.');
  await br(); await br();
  
  await w('틱톡은 트렌디하고 가벼운 접근이 필요합니다.');
  await br();
  await w('분양 현장의 비하인드, 관계자의 일상 모습,');
  await br();
  await w('모델하우스 투어 등 진정성 있는 콘텐츠로');
  await br();
  await w('젊은 예비 청약자와의 접점을 만들 수 있습니다.');
  await br(); await br();
  
  // 9. AFTER 이미지
  console.log('[6] after 이미지...');
  await up('aicut_blog_estate_after.png');
  
  // 10. after 텍스트
  await w('✅ 에이컷 도입 후 바뀐 점');
  await br(); await br();
  
  await w('첫째, 정시 납품이 가능해졌습니다.');
  await br();
  await w('매주 정해진 요일에 맞춰 영상이 도착하니');
  await br();
  await w('마케팅 일정을 체계적으로 관리할 수 있게 되었습니다.');
  await br(); await br();
  
  await w('둘째, 퀄리티가 확연히 올라갔습니다.');
  await br();
  await w('전문 에디터가 작업한 영상은 조명, 색보정, 자막 디자인');
  await br();
  await w('모든 면에서 완성도가 비교할 수 없을 정도로 높습니다.');
  await br(); await br();
  
  await w('셋째, 비용이 오히려 절감됐습니다.');
  await br();
  await w('전담 인력을 고용하는 것보다 월 50% 이상 비용을 아끼면서');
  await br();
  await w('더 많은 콘텐츠를 생산할 수 있었습니다.');
  await br(); await br();
  
  // 11. CTA 이미지 (마지막)
  console.log('[7] CTA 이미지...');
  await up('aicut_blog_estate_cta.png');
  
  // 12. CTA 텍스트 (맨 마지막)
  console.log('[8] CTA + 연락처 + 해시태그...');
  await w('🎯 하반기, 지금 준비하세요');
  await br(); await br();
  
  await w('7월부터 본격적인 하반기 분양 시즌이 시작됩니다.');
  await br();
  await w('숏폼 콘텐츠는 알고리즘 유입이 지연되기 때문에');
  await br();
  await w('미리 준비하고 발행 일정을 잡아두는 것이 중요합니다.');
  await br(); await br();
  
  await w('분양대행사의 하반기 영상 마케팅,');
  await br();
  await w('막막하다면 에이컷에 문의하세요.');
  await br();
  await w('분양 업종 특화 영상 편집 경험을 바탕으로');
  await br();
  await w('최적화된 숏폼 영상 제작을 제안합니다.');
  await br();
  await w('하반기 마케팅 전략부터 영상 제작, 정기 납품까지');
  await br();
  await w('원스톱으로 해결해드립니다.');
  await br(); await br();
  
  await w('📩 카톡: pf.kakao.com/_GIesX/chat');
  await br();
  await w('📧 이메일: master@aicut.co.kr');
  await br();
  await w('🌐 홈페이지: aicut.co.kr');
  await br(); await br();
  
  await w('#분양대행사 #분양마케팅 #하반기마케팅 #영상마케팅 #부동산마케팅');
  await br();
  await w('#분양영상 #모델하우스 #숏폼마케팅 #릴스마케팅 #유튜브쇼츠');
  await br();
  await w('#틱톡마케팅 #영상편집외주 #영상편집대행 #분양대행 #청약마케팅');
  await br();
  await w('#부동산중개 #분양홍보 #영상콘텐츠 #숏폼영상 #인스타릴스');
  await br();
  await w('#부동산릴스 #분양숏폼 #마케팅전략 #하반기준비 #분양업계');
  await br();
  await w('#에이컷 #aicuts #영상제작외주 #분양전문 #부동산영상');
  
  // Center alignment
  console.log('[9] 정렬...');
  await sf.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => { p.classList.add('se-text-paragraph-align-center'); p.style.textAlign='center'; });
    document.querySelectorAll('.se-section-image').forEach(s => { s.classList.add('se-section-align-center'); s.style.textAlign='center'; });
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

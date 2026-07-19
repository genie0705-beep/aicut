const { chromium } = require('playwright');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let ep = ctx.pages().find(p => p.url().includes('Redirect=Write'));
  if (!ep) { console.log('No editor tab'); await b.close(); return; }
  
  const sf = ep.frames().find(f => f.url().includes('PostWriteForm'));
  if (!sf) { console.log('No PostWriteForm'); await b.close(); return; }
  
  ep.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  // Full reset + rewrite
  console.log('초기화...');
  await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    se._documentService.resetDocumentData();
    se.setDocumentTitle('분양대행사, 브로셔만 들고 있다가 영상 마케팅으로 하반기 매출 2배 올린 썰');
    se._canvasScrollingService.focusToFirstComp();
  });
  
  const w = async (t) => {
    await sf.evaluate((txt) => {
      const se = SmartEditor.getEditor('blogpc001');
      try { se._editingService.writeTextWithSoftLineBreak(txt); }
      catch(e) { se._editingService.insertTextCompAtLast(); se._canvasScrollingService.focusToFirstComp(); se._editingService.writeTextWithSoftLineBreak(txt); }
    }, t);
  };
  const brk = async () => {
    await sf.evaluate(() => { try { SmartEditor.getEditor('blogpc001')._editingService.lineBreak(); } catch(e) {} });
  };
  
  const upload = async (file) => {
    const btn = sf.locator('.se-toolbar-item-image button').first();
    const fcP = ep.waitForEvent('filechooser', {timeout:10000}).catch(()=>null);
    await btn.click(); await ep.waitForTimeout(800);
    const fc = await fcP;
    if (fc) { await fc.setFiles(path.join(W, file)); await ep.waitForTimeout(3000); }
    await sf.evaluate(() => {
      try { const se = SmartEditor.getEditor('blogpc001'); se._editingService.insertTextCompAtLast(); se._canvasScrollingService.focusToFirstComp(); } catch(e) {}
    });
  };
  
  // === Full text ===
  console.log('본문 작성...');
  const texts = [
    '분양대행사 관계자라면 상상해보세요.',
    '하반기 분양 일정은 다 잡혔는데, 마케팅은 어떻게 할지 막막한 삶을 💭',
    '',
    '"브로셔는 만들었는데, 요즘 경쟁사들은 영상까지 찍더라"',
    '"영상 제작 알아보니 견적이 천차만별이고 뭐가 맞는지 모르겠고"',
    '"하반기 준비해야 하는데 시간이 너무 부족해"',
    '',
    '이게 제 현실이었습니다.',
    '네, 영상 마케팅 외주를 고민하게 된 결정적인 계기입니다. 🏢😵',
  ];
  for (const t of texts) { if (t) { await w(t); } await brk(); }
  
  console.log('메인 이미지...');
  await brk(); await brk();
  await upload('aicut_blog_estate_main.png');
  
  const texts2 = [
    '처음엔 자신만만했습니다',
    '"분양은 현장 상담이 정석이지, 영상이 뭐가 필요해?"',
    '브로슈어 잘 만들고, 현장에서 직접 설명하면 된다고 생각했습니다.',
    '모델하우스 오픈하고, 브로셔 돌리고, 전화 상담하고.',
    '이게 되던 시절이 있었죠. 💪',
  ];
  for (const t of texts2) { await w(t); await brk(); }
  
  console.log('cycle 이미지...');
  await brk(); await brk();
  await upload('aicut_blog_estate_cycle.png');
  
  const texts3 = [
    '🔄 반복된 악순환의 3개월',
    '',
    '1달 차: 자신감 — "영상쯤이야 우리 사무실 막내가 하면 된다"',
    '2달 차: 좌절 — "스마트폰으로 찍었더니 화질이... 퀄리티가 안 나온다"',
    '3달 차: 현타 — "이거 차라리 영상편집 외주 맡기는 게 낫겠다"',
    '',
    '이 패턴, 혹시 공감되시나요? 😅',
    '',
    '솔직히 고백하자면, 분양 영상 1편 만드는 데 평균 3~4일이 걸렸습니다.',
    '촬영 가서 찍고, 편집하고, 자막 넣고, 수정하고. 그 와중에 본업인 분양 대행도 해야 하고.',
  ];
  for (const t of texts3) { if (t) { await w(t); } await brk(); }
  
  console.log('cost 이미지...');
  await brk(); await brk();
  await upload('aicut_blog_estate_cost.png');
  
  const texts4 = [
    '💡 깨달음: 분양대행사에겐 시간이 곧 돈이다',
    '',
    '어느 날 문득 계산해봤습니다.',
    '',
    '내 영상 제작에 투입하는 시간: 주 20시간',
    '내 본업(분양 대행)에 써야 할 시간: 주 40시간',
    '영상편집 외주 월 비용: 50~100만 원',
    '전담 인력 1명 월 인건비: 300만 원',
    '',
    '뭐지? 직접 하는 게 오히려 손해였습니다. 🤯',
  ];
  for (const t of texts4) { if (t) { await w(t); } await brk(); }
  
  console.log('channel 이미지...');
  await brk(); await brk();
  await upload('aicut_blog_estate_channel.png');
  
  const texts5 = [
    '채널별로 전략을 바꿨습니다',
    '',
    '인스타 릴스 → 감성 + 인테리어',
    '모델하우스 인테리어 디테일 + 잔잔한 BGM. 저장 수가 확 늘었습니다.',
    '',
    '유튜브 쇼츠 → 정보 + 가치',
    '분양 조건·청약 일정·시세 분석. 구독자 유입이 가장 잘 나왔습니다.',
    '',
    '틱톡 → 트렌드 + 현장감',
    '분양 현장 비하인드, 관계자 일상. 2030 예비 청약자 유입이 생겼습니다.',
  ];
  for (const t of texts5) { if (t) { await w(t); } await brk(); }
  
  console.log('after 이미지...');
  await brk(); await brk();
  await upload('aicut_blog_estate_after.png');
  
  const texts6 = [
    '✅ 영상 편집 외주, 이렇게 바뀌었습니다',
    '',
    '✅ 바뀐 점 1: 매주 정해진 요일에 영상 납품 (더 이상 독촉 없다)',
    '✅ 바뀐 점 2: 퀄리티가 확 올라감 (전문 에디터 편집)',
    '✅ 바뀐 점 3: 오히려 비용 DOWN (내 시간 = 분업무)',
    '✅ 바뀐 점 4: 팀원 표정이 좋아짐 (가장 중요) 😂',
    '',
    '분양대행사는 편집할 시간에 분양 전략을 고민해야 합니다.',
  ];
  for (const t of texts6) { if (t) { await w(t); } await brk(); }
  
  console.log('CTA 이미지...');
  await brk(); await brk();
  await upload('aicut_blog_estate_cta.png');
  
  const texts7 = [
    '🎯 이 글을 보는 당신에게',
    '',
    '혹시 지금도 브로셔만 들고 SNS 마케팅 고민하고 계신가요?',
    '그만 고민하세요. 영상 마케팅 외주는 부끄러운 게 아닙니다.',
    '오히려 똑똑한 선택입니다. 👍',
    '',
    '📞 지금 에이컷에 무료 상담해보세요. 분양대행사 일정에 맞춰 월 정기 납품 가능합니다.',
    '',
    '📩 카톡: pf.kakao.com/_GIesX/chat',
    '📧 이메일: master@aicut.co.kr',
    '🌐 홈페이지: aicut.co.kr',
    '',
    '#분양대행사 #분양마케팅 #하반기마케팅 #영상마케팅 #부동산마케팅 #분양영상 #모델하우스 #숏폼마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #영상편집외주 #영상편집대행 #분양대행 #청약마케팅 #부동산중개 #분양홍보 #영상콘텐츠 #숏폼영상 #인스타릴스 #부동산릴스 #분양숏폼 #마케팅전략 #하반기준비 #분양업계 #에이컷 #aicuts #영상제작외주 #분양전문 #부동산영상',
  ];
  for (const t of texts7) { if (t) { await w(t); } await brk(); }
  
  // Center alignment
  console.log('센터 정렬...');
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
    const ps = document.querySelectorAll('.se-text-paragraph');
    return {
      title: se.getDocumentTitle(),
      len: se.getContentText().length,
      paras: ps.length,
      center: document.querySelectorAll('.se-text-paragraph-align-center').length === ps.length ? '100%' : '?',
      imgs: document.querySelectorAll('.se-image-resource').length,
    };
  });
  
  console.log('\n=== 최종 ===');
  console.log(JSON.stringify(st, null, 2));
  await b.close();
  console.log('=== 완료 ===');
})();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({width:1280, height:900});
  
  console.log('=== 1. 글쓰기 페이지 열기 ===');
  await page.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  const frames = page.frames();
  let seFrame = null;
  for (const f of frames) {
    if (f.url().includes('PostWriteForm')) { seFrame = f; break; }
  }
  if (!seFrame) { console.log('❌ iframe 없음'); process.exit(1); }
  
  console.log('=== 2. 에디터 초기화 ===');
  await seFrame.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
  });
  
  console.log('=== 3. 제목 설정 ===');
  const title = '치과 임플란트 마케팅, 하반기 준비는 영상 콘텐츠로 시작하세요';
  await seFrame.evaluate((t) => {
    const se = SmartEditor._editors['blogpc001'];
    se.setDocumentTitle(t);
  }, title);
  
  const titleCheck = await seFrame.evaluate(() => {
    try { const se = SmartEditor._editors['blogpc001']; return se.getDocumentTitle(); }
    catch(e) { return 'ERROR'; }
  });
  console.log('제목 확인:', titleCheck);
  
  console.log('=== 4. 포커스 후 본문 입력 ===');
  await seFrame.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._canvasScrollingService.focusToFirstComp();
  });
  
  const bodyText = [
    '치과 임플란트 시장이 점점 커지고 있습니다.',
    '환자들은 더 많은 정보를 원하고,',
    '더 신뢰할 수 있는 병원을 찾고 있습니다.',
    '',
    '텍스트만으로는 부족합니다.',
    '환자는 직접 눈으로 보고 싶어 합니다.',
    '수술 과정, 시술 결과, 원장님의 전문성까지.',
    '영상이 그 모든 걸 보여줄 수 있습니다.',
    '영상 마케팅이 선택이 아닌 필수인 이유입니다.',
    '',
    '☀️ 치과 임플란트, 영상 마케팅이 필요한 시대',
    '',
    '📋 임플란트 수술 영상이 주는 신뢰감',
    '',
    '환자들이 가장 궁금해하는 것은',
    '"임플란트 수술, 어떻게 진행되나요?"입니다.',
    '수술 과정을 영상으로 보여주면 어떨까요?',
    '실제 수술 장면, CT 분석, 식립 과정,',
    '치유 과정까지 한눈에 보여줄 수 있습니다.',
    '',
    '환자는 영상을 보며 안심합니다.',
    '"이 병원은 정말 전문적이구나"라는',
    '신뢰가 자연스럽게 생깁니다.',
    '임플란트 홍보 영상 하나면',
    '수십 장의 안내문보다 효과적입니다.',
    '',
    '🎥 촬영은 해도, 편집이 문제다',
    '',
    '"영상 찍는 건 괜찮은데,',
    '편집이 너무 어렵습니다."',
    '많은 치과 원장님들이 하는 말입니다.',
    '환자 상담, 수술, 진료로 바쁜데',
    '영상 편집까지 할 시간이 없습니다.',
    '',
    '게다가 전문 편집 프로그램은 복잡하고,',
    '배우는 데 시간이 오래 걸립니다.',
    '그렇다고 대충 올리면 오히려 역효과.',
    '이럴 때 필요한 게 바로',
    '영상 편집 아웃소싱입니다.',
    '',
    '✂️ 영상 편집 아웃소싱, 에이컷이 해결합니다',
    '',
    '에이컷(AICUT)은 영상 편집 전문 서비스입니다.',
    '치과 원장님이 촬영한 원본 영상을',
    '전문 에디터가 완성도 높게 편집해드립니다.',
    '',
    '자막, BGM, 색보정, 인트로/아웃트로까지.',
    '숏폼(릴스, 쇼츠, 틱톡)부터',
    '롱폼(수술 과정 소개)까지 모두 가능합니다.',
    '',
    '월 정기 납품으로 부담 없이 시작하세요.',
    '주 1~2편, 월 4~10편까지 맞춤 제공합니다.',
    '원장님은 촬영만 하세요.',
    '편집은 에이컷이 책임집니다.',
    '',
    '📅 하반기 치과 마케팅, 지금 준비해야 하는 이유',
    '',
    '7월, 하반기가 시작되었습니다.',
    '지금 준비하지 않으면 올해도 그대로 갑니다.',
    '여름 방학 시즌, 임플란트 수요가 늘어납니다.',
    '환자들은 SNS에서 병원을 검색합니다.',
    '릴스, 쇼츠, 틱톡에 병원 영상이',
    '노출되어야 환자들이 찾습니다.',
    '',
    '하반기 마케팅은 지금 준비해야',
    '9~12월 성수기에 효과가 나타납니다.',
    '영상 콘텐츠를 쌓아두고,',
    '꾸준히 발행하는 것이 핵심입니다.',
    '지금 시작하면 3개월 후,',
    '경쟁 병원보다 앞서갈 수 있습니다.',
    '',
    '✅ 지금 시작해야 하는 3가지 이유',
    '',
    '첫째, 영상 마케팅은 장기 자산입니다.',
    '한 번 만든 영상은 계속 사용할 수 있습니다.',
    '블로그, SNS, 홈페이지, 카톡 채널까지.',
    '',
    '둘째, 경쟁 병원보다 먼저 시작할수록',
    '검색 노출과 브랜드 인지도에서 유리합니다.',
    '남들 다 할 때는 이미 늦습니다.',
    '',
    '셋째, 편집 아웃소싱은 부담이 적습니다.',
    '월 정기권으로 예산 관리가 쉽고,',
    '전문가 퀄리티를 보장받을 수 있습니다.',
    '',
    '💬 지금 바로 시작하세요',
    '',
    '치과 임플란트 마케팅,',
    '더 이상 고민할 시간이 없습니다.',
    '영상 하나가 당신의 병원을 바꿉니다.',
    '에이컷이 그 변화를 도와드리겠습니다.',
    '',
    '📞 연락처',
    '',
    '카카오톡: pf.kakao.com/_GIesX/chat',
    '이메일: master@aicut.co.kr',
    '홈페이지: https://aicut.co.kr',
    '',
    '#치과임플란트 #임플란트마케팅 #치과마케팅 #영상마케팅 #영상편집 #숏폼마케팅 #릴스마케팅 #치과영상 #임플란트홍보 #치과광고 #영상편집아웃소싱 #영상외주 #숏폼편집 #하반기마케팅 #여름마케팅 #치과홍보 #치과SNS #치과릴스 #치과쇼츠 #의료영상 #의료마케팅 #영상제작 #치과원장 #임플란트전문 #에이컷 #AICUT #편집아웃소싱 #영상에이전시 #치과브랜딩 #영상콘텐츠',
  ].join('\n');

  await seFrame.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak(text);
  }, bodyText);
  
  console.log('=== 5. 입력 검증 ===');
  const verify = await seFrame.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const textLen = (se.getContentText() || '').length;
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    return { length: textLen, paras: paras };
  });
  console.log('검증:', JSON.stringify(verify));
  
  if (verify.length < 500) {
    console.log('❌ 본문 입력 실패');
    await b.close();
    process.exit(1);
  }
  
  console.log('=== 6. 센터 정렬 적용 ===');
  await seFrame.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    paras.forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    const wrap = document.querySelector('.se-component-content') || document.querySelector('.se-section-text');
    if (wrap) {
      wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }
  });
  
  const centerCheck = await seFrame.evaluate(() => {
    return document.querySelectorAll('.se-text-paragraph-align-center, [style*=center]').length;
  });
  console.log('센터정렬 적용:', centerCheck);
  
  console.log('=== 7. 저장 버튼 클릭 ===');
  await seFrame.evaluate(() => {
    const btn = document.querySelector('button.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('저장 버튼 클릭');
  
  await page.waitForTimeout(3000);
  console.log('최종 URL:', page.url());
  
  // 저장 확인을 위해 PostList 페이지 열기
  const listPage = await ctx.newPage();
  await listPage.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const listText = await listPage.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('블로그 목록 앞부분:', listText.substring(0, 500));
  
  // 최근 글 확인
  const recentPost = await listPage.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*=logNo]'));
    return links.slice(0, 5).map(a => ({
      text: (a.textContent || '').trim().substring(0, 50),
      href: (a.href || '').substring(0, 100),
    }));
  });
  console.log('최근 글:', JSON.stringify(recentPost, null, 2));
  
  await listPage.close();
  
  // 저장된 에디터 페이지 스크린샷 (page는 닫지 않음)
  console.log('📸 프로세스 완료');
  
  await b.close();
})().catch(e => { 
  console.error('에러:', e.message); 
  process.exit(1); 
});

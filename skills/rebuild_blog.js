const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

// 이미지 파일 목록 (중복 제거)
const IMAGES = [
  { file: 'aicut_blog_fp_main.png', size: '700x700', section: '대표' },
  { file: 'aicut_blog_fp_card1.png', size: '600x338', section: '상반기트렌드' },
  { file: 'aicut_blog_fp_card2.png', size: '600x338', section: '하반기전략' },
  { file: 'aicut_blog_fp_card3.png', size: '600x338', section: '사례' },
  { file: 'aicut_blog_fp_cta.png', size: '600x338', section: 'CTA' }
];

// 텍스트 섹션 (이미지와 교차 배치)
const SECTIONS = [
  // 섹션1: 도입부 (main 이미지 직전에 들어감)
  '보험설계사, 이제 영상이 답이다\n\n2026년 상반기가 끝나간다. FP(보험설계사)라면 이 질문을 스스로 해봐야 할 시점이다.\n\n올해 보험업계는 영상 마케팅이 대세가 되었다. 고객은 더 이상 긴 글을 읽지 않는다. 짧고 강렬한 숏폼 영상이 신뢰를 만들고, 영상편집외주로 퀄리티를 높이는 FP가 예약률에서 차이를 만들고 있다.\n\n이 글에서는 상반기 보험 마케팅 트렌드를 분석하고, 하반기 숏폼 마케팅 전략을 어떻게 준비해야 할지 구체적으로 알려드린다.',
  
  // 섹션2: 상반기 트렌드 (card1 이미지 뒤)
  '📊 상반기 보험 마케팅 트렌드 3가지\n\n첫째, 릴스·쇼츠 기반 FP 브랜딩이 정착됐다. 보험설계사의 개인 SNS 채널에서 숏폼 영상이 차지하는 비중이 70%를 넘었다.\n\n둘째, 영상 편집 아웃소싱 시장이 급성장했다. FP 본인이 직접 찍더라도 편집은 전문가에게 맡기는 영상편집외주가 늘었다.\n\n셋째, AI 영상 편집 툴보다 전문 에디터 선호도가 높다. AI 툴은 빠르지만, 보험 상품 설명처럼 신뢰와 정확성이 중요한 분야에서는 전문 편집자의 감각이 더 신뢰를 받았다.',
  
  // 섹션3: 하반기 전략 (card2 이미지 뒤)
  '🚀 하반기 FP 마케팅, 숏폼으로 준비하라\n\n하반기 보험 마케팅의 핵심 키워드는 정기성과 신뢰감이다. 하루 1개 릴스, 일주일에 3개 유튜브 쇼츠 — 꾸준함이 가장 강력한 무기가 되는 시장이다.\n\nPOINT 1. 채널별 최적화 전략 — 릴스(인스타그램)는 15~30초 감성형 콘텐츠, 쇼츠(유튜브)는 30~60초 정보형 콘텐츠, 틱톡은 트렌드 밈 기반 가벼운 콘텐츠가 효과적이다.\n\nPOINT 2. 정기 납품이 정답이다 — FP 혼자서 촬영·편집·업로드까지 하면 2주도 못 간다. 숏폼 마케팅은 꾸준함이 생명이다. 에이컷 같은 전문 영상편집외주 업체와 월 정기 계약으로 안정적인 콘텐츠 파이프라인을 구축한 FP가 진짜 승자다.',
  
  // 섹션4: 실제 사례 (card3 이미지 뒤)
  '✅ 실제 사례: FP A님의 180% 예약률 상승\n\n도입 전: 블로그 글과 정적 이미지 위주 SNS 운영 → 월 상담 예약 10~12건\n\n도입 후: 주 5회 숏폼 영상 정기 납품 (에이컷) + 본인 촬영 → 월 상담 예약 28~32건 (180% 상승)\n\n비결은 간단했다. 매일 같은 시간, 같은 퀄리티의 영상이 꾸준히 올라가면서 알고리즘이 FP의 콘텐츠를 우선 노출하기 시작한 것이다.\n\nFP 브랜딩에서 가장 중요한 것은 신뢰의 축적이다. 쌓여가는 영상 하나하나가 고객의 신뢰 자산이 된다.',
  
  // 섹션5: CTA (ctaCard 이미지 뒤)
  '💎 에이컷과 함께하는 하반기 준비\n\n에이컷은 FP·보험설계사 전용 숏폼 마케팅 아웃소싱 서비스를 제공한다.\n\n✅ 월 20~40편 정기 납품 (릴스·쇼츠·틱톡 대응)\n✅ FP 개인 브랜딩 맞춤 편집 스타일\n✅ 촬영 가이드 제공 — FP는 찍기만 하면 된다\n✅ 빠른 턴어라운드 (24~48시간 이내 납품)\n\n상반기 성과를 분석하고, 하반기 전략을 세우는 지금이 가장 좋은 타이밍이다.\n\n지금 상담 신청하면 FP 브랜딩 맞춤 전략 제안서를 무료로 제공한다.\n\n📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat\n📧 이메일 문의: master@aicut.co.kr\n🌐 홈페이지: https://aicut.co.kr\n\n#보험마케팅 #FP브랜딩 #보험설계사 #영상편집외주 #숏폼마케팅 #하반기전략 #영상마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #AI영상편집 #SNS마케팅 #보험영상 #FP마케팅 #보험설계사마케팅 #여름마케팅 #상반기분석 #콘텐츠마케팅 #에이컷 #영상편집 #숏폼영상 #릴스 #쇼츠 #인스타그램마케팅 #보험상담 #예약률 #FP브랜딩전략 #마케팅아웃소싱 #정기납품 #영상콘텐츠'
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 1. 문서 초기화
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await wp.waitForTimeout(1000);
  console.log('📄 문서 초기화 완료');

  // 2. 제목 설정
  await wp.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요');
  });
  await wp.waitForTimeout(300);
  console.log('📝 제목 설정 완료');

  // 3. 텍스트-이미지 교차 입력
  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    const text = SECTIONS[i];
    const fullPath = path.join(WS, img.file);

    console.log(`\n📌 섹션 ${i+1}: ${img.section}`);

    // 3a. 이미지 업로드 (먼저 upload)
    const fcPromise = wp.waitForEvent('filechooser', { timeout: 10000 });
    await wp.locator('.se-document-toolbar-basic-button').filter({ hasText: '사진' }).first().click();
    await wp.waitForTimeout(300);
    const fc = await fcPromise;
    await fc.setFiles([fullPath]);
    await wp.waitForTimeout(2000);
    console.log(`  ✅ 이미지 업로드: ${img.file}`);

    // 3b. 텍스트 입력
    const result = await wp.evaluate((txt) => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        se._editingService.writeTextWithSoftLineBreak(txt);
        return { ok: true, len: se.getContentText().length };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }, text);
    console.log(`  ✅ 텍스트 입력: ${result.ok ? result.len + '자' : '실패: ' + result.error}`);
    await wp.waitForTimeout(500);
  }

  // 4. 센터 정렬 적용
  const alignResult = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    paras.forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    const wrap = document.querySelector('.se-text-document') || document.querySelector('.se-canvas-layer');
    if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return { count: paras.length };
  });
  console.log(`\n📐 센터 정렬: ${alignResult.count}개 문단 적용`);

  // 5. 최종 검증
  const finalState = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    return {
      title: document.querySelector('input[placeholder*="제목"]')?.value || '(확인불가)',
      contentLen: se.getContentText().length,
      paraCount: paras.length,
      imgCount: imgs.length,
      imgSizes: Array.from(imgs).map(img => `${img.naturalWidth}x${img.naturalHeight}`)
    };
  });
  console.log('\n=== 최종 상태 ===');
  console.log(JSON.stringify(finalState, null, 2));

  // 저장
  const saveBtn = wp.locator('button').filter({ hasText: '저장' }).first();
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await wp.waitForTimeout(1000);
    console.log('💾 저장 완료');
  }

  await wp.screenshot({ path: path.join(WS, '_se_final.png') });
  console.log('📸 스크린샷 저장 완료');

  await b.close();
  console.log('\n✅ 모든 작업 완료!');
}
main().catch(e => console.error('❌', e.message));

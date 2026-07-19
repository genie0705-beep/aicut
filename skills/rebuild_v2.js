const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

const IMAGES = [
  { file: 'aicut_blog_fp_main.png', size: '700x700' },
  { file: 'aicut_blog_fp_card1.png', size: '600x338' },
  { file: 'aicut_blog_fp_card2.png', size: '600x338' },
  { file: 'aicut_blog_fp_card3.png', size: '600x338' },
  { file: 'aicut_blog_fp_cta.png', size: '600x338' }
];

// 각 섹션: 이미지 다음에 올 텍스트 (1문단 = 2~3줄, 각각 \n\n 으로 분리)
const SECTIONS = [
  // Section 1: 도입부 (main 이미지 뒤)
  `보험설계사, 이제 영상이 답이다

2026년 상반기가 끝나간다. FP(보험설계사)라면 이 질문을 스스로 해봐야 할 시점이다.

"내 SNS 채널에 영상 콘텐츠를 꾸준히 올리고 있는가?"

올해 보험업계는 영상 마케팅이 대세가 되었다. 고객은 더 이상 긴 글을 읽지 않는다.

짧고 강렬한 숏폼 영상이 신뢰를 만들고 있다. 영상편집외주로 퀄리티를 높이는 FP가 예약률에서 차이를 만들고 있다.

이 글에서는 상반기 보험 마케팅 트렌드를 분석한다. 그리고 하반기 숏폼 마케팅 전략을 어떻게 준비해야 할지 구체적으로 알려드린다.`,

  // Section 2: 상반기 트렌드 (card1 이미지 뒤)
  `📊 상반기 보험 마케팅 트렌드 3가지

첫째, 릴스·쇼츠 기반 FP 브랜딩이 정착됐다. 보험설계사의 개인 SNS 채널에서 숏폼 영상이 차지하는 비중이 70%를 넘었다.

영상으로 신뢰감을 주는 FP가 고객 상담 예약에서 압도적 우위를 보이고 있다. 단순한 이미지보다 영상이 전달하는 진정성이 더 큰 영향을 미친다.

둘째, 영상 편집 아웃소싱 시장이 급성장했다. FP 본인이 직접 찍더라도 편집은 전문가에게 맡기는 영상편집외주가 늘었다.

하루 1~2개 숏폼을 정기 납품받는 FP가 일반화되고 있다. 편집에 쏟는 시간을 줄이고, 본인의 핵심 업무인 상담에 집중할 수 있기 때문이다.

셋째, AI 영상 편집 툴보다 전문 에디터 선호도가 높다. AI 툴은 빠르지만, 보험 상품 설명처럼 신뢰와 정확성이 중요한 분야에서는 전문 편집자의 감각이 더 신뢰를 받았다.

2026년 보험 마케팅의 핵심은 단순하다. "FP가 직접 찍고, 전문가가 편집한다."`,

  // Section 3: 하반기 전략 (card2 이미지 뒤)
  `🚀 하반기 FP 마케팅, 숏폼으로 준비하라

하반기 보험 마케팅의 핵심 키워드는 정기성과 신뢰감이다. 하루 1개 릴스, 일주일에 3개 유튜브 쇼츠 — 꾸준함이 가장 강력한 무기다.

POINT 1. 채널별 최적화 전략

릴스(인스타그램)는 15~30초 감성형 콘텐츠가 효과적이다. 쇼츠(유튜브)는 30~60초 정보형 콘텐츠, 틱톡은 트렌드 밈 기반 가벼운 콘텐츠가 좋다.

같은 원본 영상을 채널별로 편집 방식을 달리해야 한다. 이것이 바로 전문 영상편집외주 업체의 핵심 가치다.

POINT 2. 정기 납품이 정답이다

FP 혼자서 촬영·편집·업로드까지 하면 2주도 못 간다. 숏폼 마케팅은 꾸준함이 생명이다.

에이컷 같은 전문 영상편집외주 업체와 월 정기 계약을 체결하자. 안정적인 콘텐츠 파이프라인을 구축한 FP가 진짜 승자다.

상반기 동안 시도해본 FP라면 알 것이다. 혼자 하는 숏폼 마케팅은 지속 가능하지 않다. 전문가의 도움을 받는 것이 현명한 선택이다.`,

  // Section 4: 사례 (card3 이미지 뒤)
  `✅ 실제 사례: FP A님의 180% 예약률 상승

도입 전: 블로그 글과 정적 이미지 위주 SNS 운영. 월 상담 예약 10~12건.

도입 후: 주 5회 숏폼 영상 정기 납품 (에이컷) + 본인 촬영. 월 상담 예약 28~32건 (180% 상승).

비결은 간단했다. 매일 같은 시간, 같은 퀄리티의 영상이 꾸준히 올라갔다. 알고리즘이 FP의 콘텐츠를 우선 노출하기 시작했다.

FP 브랜딩에서 가장 중요한 것은 신뢰의 축적이다. 쌓여가는 영상 하나하나가 고객의 신뢰 자산이 된다.

3개월 후 A님의 릴스는 업계에서 입소문이 났다. "저 FP, 진짜 꾸준하다"는 말이 입소문을 탔다.

실제로 A님은 "영상편집외주로 시간을 아꼈다. 그 시간에 고객 상담을 더 했다"고 말한다. 정기 납품의 힘이다.`,

  // Section 5: CTA (ctaCard 이미지 뒤)
  `💎 에이컷과 함께하는 하반기 준비

에이컷은 FP·보험설계사 전용 숏폼 마케팅 아웃소싱 서비스를 제공한다.

✅ 월 20~40편 정기 납품 (릴스·쇼츠·틱톡 대응)
✅ FP 개인 브랜딩 맞춤 편집 스타일
✅ 촬영 가이드 제공 — FP는 찍기만 하면 된다
✅ 빠른 턴어라운드 (24~48시간 이내 납품)

상반기 성과를 분석하고, 하반기 전략을 세우는 지금이 가장 좋은 타이밍이다.

FP 브랜딩, 영상편집외주, 숏폼 마케팅 — 이 세 가지가 2026년 하반기 보험 마케팅의 핵심 키워드다.

지금 상담 신청하면 FP 브랜딩 맞춤 전략 제안서를 무료로 제공한다. 예약률 상승을 원한다면 지금 시작하라.

📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat
📧 이메일 문의: master@aicut.co.kr
🌐 홈페이지: https://aicut.co.kr

#보험마케팅 #FP브랜딩 #보험설계사 #영상편집외주 #숏폼마케팅 #하반기전략 #영상마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #AI영상편집 #SNS마케팅 #보험영상 #FP마케팅 #보험설계사마케팅 #여름마케팅 #상반기분석 #콘텐츠마케팅 #에이컷 #영상편집 #숏폼영상 #릴스 #쇼츠 #인스타그램마케팅 #보험상담 #예약률 #FP브랜딩전략 #마케팅아웃소싱 #정기납품 #영상콘텐츠`
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 1. 문서 리셋
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await wp.waitForTimeout(800);
  console.log('📄 문서 초기화 완료');

  // 2. 제목
  await wp.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요');
  });
  console.log('📝 제목 설정 완료');

  // 3. 이미지-텍스트 교차 입력 (5개 섹션)
  for (let i = 0; i < IMAGES.length; i++) {
    const fullPath = path.join(WS, IMAGES[i].file);
    
    console.log(`\n📌 섹션 ${i+1}/${IMAGES.length}`);

    // 이미지 업로드
    const fcPromise = wp.waitForEvent('filechooser', { timeout: 10000 });
    await wp.locator('.se-document-toolbar-basic-button').filter({ hasText: '사진' }).first().click();
    await wp.waitForTimeout(300);
    const fc = await fcPromise;
    await fc.setFiles([fullPath]);
    await wp.waitForTimeout(2000);

    // 텍스트 입력
    await wp.evaluate((txt) => {
      const se = SmartEditor._editors['blogpc001'];
      se._editingService.writeTextWithSoftLineBreak(txt);
    }, SECTIONS[i]);
    await wp.waitForTimeout(500);
    
    console.log(`  ✅ 이미지 + 텍스트 완료`);
  }

  // 4. 센터 정렬
  await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    paras.forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  console.log('\n📐 센터 정렬 적용');

  // 5. 검증
  const state = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const fullText = se.getContentText();
    const paras = document.querySelectorAll('.se-text-paragraph');
    const imgs = document.querySelectorAll('img');
    const longParas = Array.from(paras).filter(p => (p.textContent || '').length > 50);
    
    // 해시태그
    const hashtagCount = (fullText.match(/#[가-힣a-zA-Z]+/g) || []).length;
    const keywordCounts = {
      '영상편집외주': (fullText.match(/영상편집외주/g) || []).length,
      '숏폼': (fullText.match(/숏폼/g) || []).length,
      '보험 마케팅': (fullText.match(/보험 마케팅/g) || []).length,
      'FP 브랜딩': (fullText.match(/FP 브랜딩/g) || []).length,
      '하반기': (fullText.match(/하반기/g) || []).length,
    };

    return {
      length: fullText.length,
      paraCount: paras.length,
      imgCount: imgs.length,
      imgSizes: Array.from(imgs).map(img => `${img.naturalWidth}x${img.naturalHeight}`),
      longParasOver50: longParas.length,
      hashtagCount,
      keywords: keywordCounts,
      cta: { 
        kakao: fullText.includes('pf.kakao.com'), 
        email: fullText.includes('master@aicut.co.kr'), 
        home: fullText.includes('aicut.co.kr') 
      },
      // 모바일 최적화 상태
      paraLengths: Array.from(paras).map(p => (p.textContent || '').length)
    };
  });

  console.log('\n=== 최종 검증 ===');
  console.log(JSON.stringify(state, null, 2));

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1000);
  console.log('\n💾 저장 완료');

  await wp.screenshot({ path: path.join(WS, '_se_final_v2.png') });
  console.log('📸 스크린샷 저장');

  await b.close();
  console.log('\n✅ 작업 완료!');
}
main().catch(e => console.error('❌', e.message));

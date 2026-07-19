const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

// 이미지 5장 (업로드 순서대로)
const FILES = [
  { file: 'aicut_blog_fp_main.png', alt: '보험마케팅 FP 숏폼영상 편집 아웃소싱 에이컷' },
  { file: 'aicut_blog_fp_card1.png', alt: '상반기 보험 마케팅 트렌드 영상편집외주 숏폼마케팅' },
  { file: 'aicut_blog_fp_card2.png', alt: '하반기 FP 마케팅 숏폼 영상 전략 영상편집' },
  { file: 'aicut_blog_fp_card3.png', alt: '보험설계사 영상 마케팅 예약률 상승 사례 에이컷' },
  { file: 'aicut_blog_fp_cta.png', alt: '보험 마케팅 아웃소싱 에이컷 무료상담 숏폼' }
];

// 섹션별 텍스트 (이미지 뒤에 올 텍스트, 문단은 \n\n 으로 구분)
const TEXT = [
  // === 섹션 1: 도입부 (main 이미지 뒤) ===
  `보험설계사, 이제 영상이 답이다

2026년 상반기가 끝나간다. FP(보험설계사)라면 스스로에게 물어보자.

"내 SNS에 숏폼 영상을 꾸준히 올리고 있는가?"

올해 보험업계는 영상 마케팅이 대세가 되었다. 고객은 더 이상 긴 글을 읽지 않는다. 짧고 강렬한 숏폼 영상이 신뢰를 만든다.

영상편집외주로 퀄리티를 높이는 FP가 예약률에서 차이를 만들고 있다. 이 글에서는 상반기 트렌드를 분석하고 하반기 숏폼 마케팅 전략을 구체적으로 알려드린다.`,

  // === 섹션 2: 상반기 트렌드 (card1 이미지 뒤) ===
  `📊 상반기 보험 마케팅 트렌드 3가지

첫째, 릴스·쇼츠 기반 FP 브랜딩이 정착됐다. FP 개인 SNS에서 숏폼 영상 비중이 70%를 넘었다. 영상으로 신뢰를 주는 FP가 상담 예약에서 압도적 우위를 보인다.

둘째, 영상 편집 아웃소싱 시장이 급성장했다. FP가 직접 찍어도 편집은 전문가에게 맡기는 영상편집외주가 늘었다. 하루 1~2개 숏폼을 정기 납품받는 FP가 일반화되었다.

셋째, AI 툴보다 전문 편집자 선호도가 높다. AI는 빠르지만 보험 상품 설명처럼 신뢰와 정확성이 중요한 분야는 전문 편집자의 감각이 더 낫다.

핵심은 간단하다. "FP가 찍고, 전문가가 편집한다."`,

  // === 섹션 3: 하반기 전략 (card2 이미지 뒤) ===
  `🚀 하반기 FP 마케팅, 숏폼으로 준비하라

하반기 핵심 키워드는 정기성과 신뢰감이다. 하루 1개 릴스, 주 3개 쇼츠 — 꾸준함이 가장 강력한 무기다.

POINT 1. 채널별 전략
릴스(인스타)는 15~30초 감성형, 쇼츠(유튜브)는 30~60초 정보형, 틱톡은 트렌드 밈 기반. 같은 영상도 채널별 편집을 달리해야 한다. 이것이 영상편집외주의 핵심 가치다.

POINT 2. 정기 납품이 정답
FP 혼자 촬영·편집·업로드까지 하면 2주도 못 간다. 숏폼 마케팅은 꾸준함이 생명이다. 전문 업체와 월 정기 계약으로 안정적인 파이프라인을 구축한 FP가 승자다.

상반기 시도해본 FP는 안다. 혼자 하는 숏폼은 지속 불가능하다. 전문가의 도움을 받는 것이 현명한 선택이다.`,

  // === 섹션 4: 사례 (card3 이미지 뒤) ===
  `✅ 실제 사례: FP A님, 예약률 180% 상승

도입 전: 블로그 + 정적 이미지 SNS → 월 상담 10~12건

도입 후: 주 5회 숏폼 정기 납품(에이컷) + 본인 촬영 → 월 상담 28~32건

비결은 간단했다. 매일 같은 시간, 같은 퀄리티로 영상이 꾸준히 올라갔다. 알고리즘이 FP의 콘텐츠를 우선 노출하기 시작했다.

FP 브랜딩에서 가장 중요한 것은 신뢰의 축적이다. 영상 하나하나가 고객의 신뢰 자산이 된다.

A님의 말: "영상편집외주로 시간을 아꼈다. 그 시간에 고객 상담을 더 했다." 이것이 정기 납품의 힘이다.`,

  // === 섹션 5: CTA (ctaCard 이미지 뒤) ===
  `💎 에이컷과 함께하는 하반기 준비

에이컷은 FP·보험설계사 전용 숏폼 마케팅 아웃소싱 서비스를 제공한다.

✅ 월 20~40편 정기 납품 (릴스·쇼츠·틱톡 대응)
✅ FP 개인 브랜딩 맞춤 편집 스타일
✅ 촬영 가이드 제공 — FP는 찍기만 하면 된다
✅ 빠른 턴어라운드 (24~48시간 이내 납품)

상반기 성과를 분석하고 하반기 전략을 세우는 지금이 타이밍이다. FP 브랜딩, 영상편집외주, 숏폼 마케팅 — 이 세 가지가 2026년 하반기 보험 마케팅의 핵심이다.

지금 상담 신청하면 FP 브랜딩 맞춤 전략 제안서를 무료로 제공한다.

📞 카카오톡: https://pf.kakao.com/_GIesX/chat
📧 이메일: master@aicut.co.kr
🌐 홈페이지: https://aicut.co.kr

#보험마케팅 #FP브랜딩 #보험설계사 #영상편집외주 #숏폼마케팅 #하반기전략 #영상마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #AI영상편집 #SNS마케팅 #보험영상 #FP마케팅 #보험설계사마케팅 #여름마케팅 #상반기분석 #콘텐츠마케팅 #에이컷 #영상편집 #숏폼영상 #릴스 #쇼츠 #인스타그램마케팅 #보험상담 #예약률 #FP브랜딩전략 #마케팅아웃소싱 #정기납품 #영상콘텐츠`
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('❌ 글쓰기 페이지를 찾을 수 없습니다'); await b.close(); return; }

  console.log('📄 1단계: 문서 리셋 + 제목 설정');
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await wp.waitForTimeout(800);
  
  await wp.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요');
  });
  await wp.waitForTimeout(300);
  console.log('✅ 제목 설정 완료');

  // 2단계: 이미지-텍스트 교차 입력
  console.log('\n📸 2단계: 이미지-텍스트 교차 입력');
  
  for (let i = 0; i < FILES.length; i++) {
    const fullPath = path.join(WS, FILES[i].file);
    console.log(`  [${i+1}/5] ${FILES[i].file}`);

    // 이미지 업로드
    try {
      const fcP = wp.waitForEvent('filechooser', { timeout: 10000 });
      await wp.locator('.se-document-toolbar-basic-button').filter({ hasText: '사진' }).first().click();
      await wp.waitForTimeout(400);
      const fc = await fcP;
      await fc.setFiles([fullPath]);
      await wp.waitForTimeout(2000);
    } catch (e) {
      console.log(`  ⚠️ 이미지 업로드 실패: ${e.message}`);
    }

    // 텍스트 입력
    await wp.evaluate((txt) => {
      const se = SmartEditor._editors['blogpc001'];
      se._editingService.writeTextWithSoftLineBreak(txt);
    }, TEXT[i]);
    await wp.waitForTimeout(400);
  }
  console.log('✅ 모든 섹션 입력 완료');

  // 3단계: 모바일 최적화 (이미지 width:100%)
  console.log('\n📱 3단계: 모바일 최적화');
  const mobResult = await wp.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    let fixed = 0;
    imgs.forEach(img => {
      if (img.naturalWidth !== 700) { // 대표 이미지 제외
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxWidth = '100%';
        img.style.display = 'block';
        fixed++;
      }
    });
    // SE4에 변경 알림
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return fixed;
  });
  console.log(`✅ 이미지 ${mobResult}장 width:100% 적용`);

  // 4단계: 센터 정렬
  console.log('\n📐 4단계: 센터 정렬');
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  console.log('✅ 문단 전체 센터 정렬 완료');
  await wp.waitForTimeout(500);

  // 5단계: H2 변환
  console.log('\n🔤 5단계: H2 태그 변환');
  const h2Result = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let count = 0;
    paras.forEach(p => {
      const t = (p.textContent || '').trim();
      if (t.startsWith('📊') || t.startsWith('🚀') || t.startsWith('✅ 실제') || t.startsWith('💎')) {
        const h2 = document.createElement('h2');
        h2.textContent = t;
        h2.style.textAlign = 'center';
        h2.className = p.className;
        p.parentNode.replaceChild(h2, p);
        count++;
      }
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return count;
  });
  console.log(`✅ H2 ${h2Result}개 변환 완료`);
  await wp.waitForTimeout(500);

  // 6단계: Strong 태그
  console.log('\n💪 6단계: Strong 태그 적용');
  const strongResult = await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    const kws = ['영상편집외주', '숏폼 마케팅', '보험 마케팅', 'FP 브랜딩', '하반기'];
    let count = 0;
    paras.forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => {
        const re = new RegExp(`(?![^<]*>)(${kw})`, 'g');
        if (re.test(html)) {
          html = html.replace(re, '<strong>$1</strong>');
          count++;
        }
      });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    return count;
  });
  console.log(`✅ Strong ${strongResult}개 적용 완료`);

  // 7단계: 저장
  console.log('\n💾 7단계: 저장');
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);
  console.log('✅ 저장 완료');

  // 8단계: 최종 검증
  console.log('\n📊 8단계: 최종 검증');
  const final = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');
    const hashCount = (ft.match(/#[가-힣a-zA-Z]+/g) || []).length;

    return {
      '본문 글자수': ft.length,
      '문단 수': paras.length,
      '이미지': `${imgs.length}장`,
      'H2 태그': `${h2s.length}개`,
      'Strong 태그': `${strongs.length}개`,
      '해시태그': `${hashCount}개`,
      'CTA 카톡': ft.includes('pf.kakao.com') ? '✅' : '❌',
      'CTA 이메일': ft.includes('master@aicut.co.kr') ? '✅' : '❌',
      'CTA 홈페이지': ft.includes('aicut.co.kr') ? '✅' : '❌',
      '이미지 반응형': Array.from(imgs).map(img => `${img.naturalWidth}x${img.naturalHeight} style="${img.getAttribute('style') || '-'}"`)
    };
  });

  console.log(JSON.stringify(final, null, 2));
  
  // 스크린샷
  await wp.screenshot({ path: path.join(WS, '_se_final_v3.png') });
  console.log('\n📸 스크린샷 저장 완료');

  await b.close();
  console.log('\n✅ 모든 작업 완료!');
}
main().catch(e => console.error('❌', e.message));

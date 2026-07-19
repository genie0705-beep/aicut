const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

const FILES = [
  { file: 'aicut_blog_fp_main.png', alt: '보험마케팅 FP 숏폼영상 편집 아웃소싱 에이컷' },
  { file: 'aicut_blog_fp_card1.png', alt: '상반기 보험 마케팅 트렌드 영상편집외주 숏폼마케팅' },
  { file: 'aicut_blog_fp_card2.png', alt: '하반기 FP 마케팅 숏폼 영상 전략 영상편집' },
  { file: 'aicut_blog_fp_card3.png', alt: '보험설계사 영상 마케팅 예약률 상승 사례 에이컷' },
  { file: 'aicut_blog_fp_cta.png', alt: '보험 마케팅 아웃소싱 에이컷 무료상담 숏폼' }
];

// Ref 스타일: 공감형 스토리텔링, 짧은 문단(2~3줄), 이모지, 대화체
const TEXTS = [
  // === Section 1: 도입부 (main 이미지 뒤) ===
  `보험설계사 FP라면 상상해보세요.

당신의 SNS에 잠재 고객이 먼저 찾아옵니다.

"○○FP님 릴스 봤어요. 보험 상담 받고 싶어요."

텍스트와 이미지만으로는 더 이상 경쟁력이 없습니다.

숏폼 영상 마케팅이 선택이 아닌 필수가 된 이유입니다. 💡

이 글에서는 상반기 보험 마케팅 트렌드와 하반기 숏폼 전략을 구체적으로 알려드립니다.`,

  // === Section 2: 상반기 트렌드 (card1 뒤) ===
  `☀️ 상반기 FP 마케팅, 왜 영상인가

2026년 상반기, 보험업계에 큰 변화가 있었습니다.

릴스·쇼츠 기반 FP 브랜딩이 완전히 정착됐습니다.

FP 개인 SNS에서 숏폼 영상이 차지하는 비중이 70%를 넘었습니다.

영상으로 신뢰를 주는 FP가 상담 예약에서 압도적 우위를 보이고 있습니다.

문제는 직접 찍고 편집하려면 시간이 너무 많이 든다는 겁니다.

여기서 영상편집외주의 필요성이 생겼습니다. ✂️

FP가 직접 촬영하고, 전문가가 편집하는 구조가 가장 효율적입니다.

하루 1~2개 숏폼을 정기 납품받는 FP가 벌써 일반화되었습니다.`,

  // === Section 3: 하반기 전략 (card2 뒤) ===
  `📋 FP 숏폼 마케팅, 이렇게 준비하세요

첫째, 채널별 최적화가 필요합니다.

릴스(인스타)는 15~30초 감성형이 효과적입니다. 쇼츠(유튜브)는 30~60초 정보형 콘텐츠가 좋습니다.

틱톡은 트렌드 밈 기반 가벼운 콘텐츠가 통합니다.

둘째, 정기 납품이 정답입니다. 📦

FP 혼자 촬영·편집·업로드까지 하면 2주도 못 버팁니다.

숏폼 마케팅은 꾸준함이 생명입니다. 전문 영상편집외주 업체와 월 정기 계약을 맺으세요.

안정적인 콘텐츠 파이프라인을 구축한 FP가 진짜 승자입니다.

상반기 시도해본 FP는 압니다. 혼자 하는 숏폼은 지속 불가능합니다.`,

  // === Section 4: 사례 (card3 뒤) ===
  `✅ 영상편집외주, FP가 선택해야 하는 이유

FP A님의 실제 사례입니다.

도입 전: 블로그와 이미지 위주 SNS → 월 상담 10~12건

도입 후: 주 5회 숏폼 정기 납품(에이컷) → 월 상담 28~32건 (180% 상승) 📈

비결은 간단했습니다.

매일 같은 시간, 같은 퀄리티로 영상이 꾸준히 올라갔습니다. 알고리즘이 FP의 콘텐츠를 우선 노출하기 시작했습니다.

FP 브랜딩에서 가장 중요한 것은 신뢰의 축적입니다.

A님의 말: "영상편집외주 덕분에 상담에 집중할 수 있었습니다."

영상 하나하나가 고객의 신뢰 자산이 됩니다.`,

  // === Section 5: CTA (cta 뒤) ===
  `🎯 하반기, 지금 준비하세요

하반기 핵심 키워드는 정기성과 신뢰감입니다.

FP 브랜딩, 영상편집외주, 숏폼 마케팅 — 이 세 가지가 2026년 하반기 보험 마케팅의 핵심입니다.

에이컷은 FP·보험설계사 전용 숏폼 아웃소싱 서비스를 제공합니다.

✅ 월 20~40편 정기 납품
✅ FP 브랜딩 맞춤 편집 스타일
✅ 촬영 가이드 제공
✅ 24~48시간 이내 빠른 납품

하반기 전략을 세우는 지금이 가장 좋은 타이밍입니다.

지금 상담 신청하면 FP 브랜딩 맞춤 전략 제안서를 무료로 제공합니다.

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
  if (!wp) { console.log('❌ 글쓰기 페이지 없음'); await b.close(); return; }

  // 1. 리셋 + 제목
  console.log('📄 1. 리셋 + 제목');
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await wp.waitForTimeout(600);
  await wp.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요');
  });
  console.log('✅ 제목 설정');

  // 2. 이미지-텍스트 교차 입력
  console.log('\n📝 2. 이미지-텍스트 입력');
  for (let i = 0; i < FILES.length; i++) {
    const fullPath = path.join(WS, FILES[i].file);
    console.log(`  [${i+1}/5] ${FILES[i].file}`);

    // 이미지
    try {
      const fcP = wp.waitForEvent('filechooser', { timeout: 10000 });
      await wp.locator('.se-document-toolbar-basic-button').filter({ hasText: '사진' }).first().click();
      await wp.waitForTimeout(400);
      const fc = await fcP;
      await fc.setFiles([fullPath]);
      await wp.waitForTimeout(1500);
    } catch (e) {
      console.log('  ⚠️ 업로드 실패: ' + e.message);
    }

    // 텍스트
    await wp.evaluate((txt) => {
      SmartEditor._editors['blogpc001']._editingService.writeTextWithSoftLineBreak(txt);
    }, TEXTS[i]);
    await wp.waitForTimeout(300);
  }
  console.log('✅ 입력 완료');

  // 3. 이미지 alt + 반응형
  console.log('\n🖼️ 3. 이미지 최적화');
  await wp.evaluate((altMap) => {
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || '';
      for (const [key, val] of Object.entries(altMap)) {
        if (src.includes(key.replace('.png','').substring(0,20))) {
          img.setAttribute('alt', val);
          if (img.naturalWidth !== 700) { // 대표 제외
            img.removeAttribute('width'); img.removeAttribute('height');
            img.style.width = '100%'; img.style.height = 'auto';
            img.style.maxWidth = '100%'; img.style.display = 'block';
          }
          break;
        }
      }
    });
  }, Object.fromEntries(FILES.map(f => [f.file, f.alt])));
  console.log('✅ 이미지 alt + 반응형 적용');

  await wp.waitForTimeout(400);

  // 4. 센터 정렬
  console.log('📐 4. 센터 정렬');
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // 5. H2 변환 (이모지 시작 문단 → H2)
  await wp.evaluate(() => {
    const h2targets = ['☀️ 상반기 FP 마케팅, 왜 영상인가', '📋 FP 숏폼 마케팅, 이렇게 준비하세요', '✅ 영상편집외주, FP가 선택해야 하는 이유', '🎯 하반기, 지금 준비하세요'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const t = (p.textContent || '').trim();
      if (h2targets.some(h => t.startsWith(h.substring(0,10)))) {
        const h2 = document.createElement('h2');
        h2.textContent = t;
        h2.style.textAlign = 'center';
        h2.className = p.className;
        p.parentNode.replaceChild(h2, p);
      }
    });
  });

  // 6. Strong 적용
  const kws = ['영상편집외주', '숏폼 마케팅', 'FP 브랜딩', '하반기'];
  await wp.evaluate((keywords) => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      keywords.forEach(kw => {
        html = html.replace(new RegExp('(?![^<]*>)(' + kw + ')', 'g'), '<strong>$1</strong>');
      });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  }, kws);

  await wp.waitForTimeout(500);

  // 7. 저장
  console.log('💾 7. 저장');
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1000);
  console.log('✅ 저장 완료');

  // 8. 검증
  console.log('\n📊 8. 검증');
  const final = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const h2s = document.querySelectorAll('h2');
    const strongs = document.querySelectorAll('strong, b');
    const lens = Array.from(paras).filter(p => (p.textContent || '').trim().length > 0 && !(p.textContent || '').trim().startsWith('#')).map(p => (p.textContent || '').length);
    return {
      contentLen: ft.length,
      paraCount: paras.length,
      h2Count: h2s.length,
      strongCount: strongs.length,
      imgCount: imgs.length,
      imgInfo: Array.from(imgs).map(img => ({ size: img.naturalWidth + 'x' + img.naturalHeight, alt: img.getAttribute('alt'), mobile: (img.style.width === '100%') })),
      avgLen: Math.round(lens.reduce((a,b) => a+b, 0) / lens.length) + '자',
      over50: lens.filter(l => l > 50).length + '개',
      over70: lens.filter(l => l > 70).length + '개',
      maxLen: Math.max(0, ...lens) + '자',
      hashTags: (ft.match(/#[가-힣a-zA-Z]+/g) || []).length,
      cta: { kakao: ft.includes('pf.kakao.com'), email: ft.includes('master@aicut.co.kr'), home: ft.includes('aicut.co.kr') }
    };
  });

  console.log(JSON.stringify(final, null, 2));

  await b.close();
  console.log('\n✅ 모든 작업 완료!');
}
main().catch(e => console.error('❌', e.message));

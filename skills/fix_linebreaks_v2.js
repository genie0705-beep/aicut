const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

// 전체 텍스트를 하나의 문자열로 구성 (writeTextWithSoftLineBreak 1회 호출)
// 각 문단은 \n\n 으로 분리, 섹션 사이는 \n\n\n 으로 넉넉히 분리
const FULL_TEXT = [
  // === 섹션 1 ===
  '보험설계사 FP라면 상상해보세요.',
  '',
  '당신의 SNS에 잠재 고객이 먼저 찾아옵니다.',
  '',
  '"○○FP님 릴스 봤어요. 보험 상담 받고 싶어요."',
  '',
  '텍스트와 이미지만으로는 더 이상 경쟁력이 없습니다.',
  '',
  '숏폼 영상 마케팅이 선택이 아닌 필수가 된 이유입니다. 💡',
  '',
  '이 글에서는 상반기 보험 마케팅 트렌드와 하반기 숏폼 전략을 구체적으로 알려드립니다.',
  '',
  '',
  // === 섹션 2 ===
  '☀️ 상반기 FP 마케팅, 왜 영상인가',
  '',
  '2026년 상반기, 보험업계에 큰 변화가 있었습니다.',
  '',
  '릴스·쇼츠 기반 FP 브랜딩이 완전히 정착됐습니다.',
  '',
  'FP 개인 SNS에서 숏폼 영상이 차지하는 비중이 70%를 넘었습니다.',
  '',
  '영상으로 신뢰를 주는 FP가 상담 예약에서 압도적 우위를 보이고 있습니다.',
  '',
  '문제는 직접 찍고 편집하려면 시간이 너무 많이 든다는 겁니다.',
  '',
  '여기서 영상편집외주의 필요성이 생겼습니다. ✂️',
  '',
  'FP가 직접 촬영하고, 전문가가 편집하는 구조가 가장 효율적입니다.',
  '',
  '하루 1~2개 숏폼을 정기 납품받는 FP가 벌써 일반화되었습니다.',
  '',
  '',
  // === 섹션 3 ===
  '📋 FP 숏폼 마케팅, 이렇게 준비하세요',
  '',
  '첫째, 채널별 최적화가 필요합니다.',
  '',
  '릴스(인스타)는 15~30초 감성형이 효과적입니다. 쇼츠(유튜브)는 30~60초 정보형 콘텐츠가 좋습니다.',
  '',
  '틱톡은 트렌드 밈 기반 가벼운 콘텐츠가 통합니다.',
  '',
  '둘째, 정기 납품이 정답입니다. 📦',
  '',
  'FP 혼자 촬영·편집·업로드까지 하면 2주도 못 버팁니다.',
  '',
  '숏폼 마케팅은 꾸준함이 생명입니다. 전문 영상편집외주 업체와 월 정기 계약을 맺으세요.',
  '',
  '안정적인 콘텐츠 파이프라인을 구축한 FP가 진짜 승자입니다.',
  '',
  '상반기 시도해본 FP는 압니다. 혼자 하는 숏폼은 지속 불가능합니다.',
  '',
  '',
  // === 섹션 4 ===
  '✅ 영상편집외주, FP가 선택해야 하는 이유',
  '',
  'FP A님의 실제 사례입니다.',
  '',
  '도입 전: 블로그와 이미지 위주 SNS → 월 상담 10~12건',
  '',
  '도입 후: 주 5회 숏폼 정기 납품(에이컷) → 월 상담 28~32건 (180% 상승) 📈',
  '',
  '비결은 간단했습니다.',
  '',
  '매일 같은 시간, 같은 퀄리티로 영상이 꾸준히 올라갔습니다. 알고리즘이 FP의 콘텐츠를 우선 노출하기 시작했습니다.',
  '',
  'FP 브랜딩에서 가장 중요한 것은 신뢰의 축적입니다.',
  '',
  'A님의 말: "영상편집외주 덕분에 상담에 집중할 수 있었습니다."',
  '',
  '영상 하나하나가 고객의 신뢰 자산이 됩니다.',
  '',
  '',
  // === 섹션 5 ===
  '🎯 하반기, 지금 준비하세요',
  '',
  '하반기 핵심 키워드는 정기성과 신뢰감입니다.',
  '',
  'FP 브랜딩, 영상편집외주, 숏폼 마케팅 — 이 세 가지가 2026년 하반기 보험 마케팅의 핵심입니다.',
  '',
  '에이컷은 FP·보험설계사 전용 숏폼 아웃소싱 서비스를 제공합니다.',
  '',
  '✅ 월 20~40편 정기 납품',
  '✅ FP 브랜딩 맞춤 편집 스타일',
  '✅ 촬영 가이드 제공',
  '✅ 24~48시간 이내 빠른 납품',
  '',
  '하반기 전략을 세우는 지금이 가장 좋은 타이밍입니다.',
  '',
  '지금 상담 신청하면 FP 브랜딩 맞춤 전략 제안서를 무료로 제공합니다.',
  '',
  '📞 카카오톡: https://pf.kakao.com/_GIesX/chat',
  '📧 이메일: master@aicut.co.kr',
  '🌐 홈페이지: https://aicut.co.kr',
  '',
  '#보험마케팅 #FP브랜딩 #보험설계사 #영상편집외주 #숏폼마케팅 #하반기전략 #영상마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #AI영상편집 #SNS마케팅 #보험영상 #FP마케팅 #보험설계사마케팅 #여름마케팅 #상반기분석 #콘텐츠마케팅 #에이컷 #영상편집 #숏폼영상 #릴스 #쇼츠 #인스타그램마케팅 #보험상담 #예약률 #FP브랜딩전략 #마케팅아웃소싱 #정기납품 #영상콘텐츠'
].join('\n'); // 배열을 \n으로 연결 → \n\n은 빈줄(문단구분), \n\n\n은 여유있는 섹션 구분

const FILES = [
  'aicut_blog_fp_main.png', 'aicut_blog_fp_card1.png',
  'aicut_blog_fp_card2.png', 'aicut_blog_fp_card3.png',
  'aicut_blog_fp_cta.png'
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 없음'); await b.close(); return; }

  // 리셋
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await wp.waitForTimeout(500);

  // 제목
  await wp.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요');
  });
  await wp.waitForTimeout(300);
  console.log('✅ 제목');

  // 본문: writeTextWithSoftLineBreak 한 번에 전체 입력
  await wp.evaluate((text) => {
    SmartEditor._editors['blogpc001']._editingService.writeTextWithSoftLineBreak(text);
  }, FULL_TEXT);
  await wp.waitForTimeout(1000);
  console.log('✅ 본문 입력 완료');

  // 이미지 확인 및 업로드
  const existingImgs = await wp.evaluate(() => document.querySelectorAll('img').length);
  console.log('기존 이미지:', existingImgs, '장');
  
  if (existingImgs < 5) {
    // 사진 버튼 → filechooser 방식으로 업로드
    for (let i = existingImgs; i < FILES.length; i++) {
      const fullPath = path.join(WS, FILES[i]);
      try {
        const [fc] = await Promise.all([
          wp.waitForEvent('filechooser', { timeout: 15000 }),
          wp.evaluate(() => {
            const btn = document.querySelector('button.se-image-toolbar-button');
            if (btn) btn.click();
          })
        ]);
        await fc.setFiles([fullPath]);
        await wp.waitForTimeout(1500);
        console.log(`  🖼️ 이미지 ${i+1}/5 업로드`);
      } catch (e) {
        console.log(`  ⚠️ 이미지 ${i+1}/5 업로드 실패`);
      }
    }
  } else {
    console.log('✅ 이미지 모두 있음, 업로드 생략');
  }

  // SEO 최적화
  await wp.evaluate(() => {
    // alt + 반응형
    const altMap = {
      'aicut_blog_fp_main.png': '보험마케팅 FP 숏폼영상 편집 아웃소싱 에이컷',
      'aicut_blog_fp_card1.png': '상반기 보험 마케팅 트렌드 영상편집외주 숏폼마케팅',
      'aicut_blog_fp_card2.png': '하반기 FP 마케팅 숏폼 영상 전략 영상편집',
      'aicut_blog_fp_card3.png': '보험설계사 영상 마케팅 예약률 상승 사례 에이컷',
      'aicut_blog_fp_cta.png': '보험 마케팅 아웃소싱 에이컷 무료상담 숏폼'
    };
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || '';
      for (const [key, val] of Object.entries(altMap)) {
        if (src.includes(key.replace('.png','').substring(0,20))) {
          img.setAttribute('alt', val);
          if (img.naturalWidth !== 700) {
            img.removeAttribute('width'); img.removeAttribute('height');
            img.style.width = '100%'; img.style.height = 'auto';
            img.style.maxWidth = '100%'; img.style.display = 'block';
          }
          break;
        }
      }
    });

    // 센터 정렬
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });

    // H2 (이모지로 시작하는 문단)
    const h2txts = ['☀️ 상반기 FP 마케팅, 왜 영상인가', '📋 FP 숏폼 마케팅, 이렇게 준비하세요', '✅ 영상편집외주, FP가 선택해야 하는 이유', '🎯 하반기, 지금 준비하세요'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const t = (p.textContent || '').trim();
      if (h2txts.some(h => t.startsWith(h.substring(0,10)))) {
        const h2 = document.createElement('h2');
        h2.textContent = t;
        h2.style.textAlign = 'center';
        h2.className = p.className;
        p.parentNode.replaceChild(h2, p);
      }
    });

    // Strong
    const kws = ['영상편집외주', '숏폼 마케팅', 'FP 브랜딩', '하반기'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => { html = html.replace(new RegExp('(?![^<]*>)(' + kw + ')', 'g'), '<strong>$1</strong>'); });
      p.innerHTML = html;
    });

    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await wp.waitForTimeout(500);
  console.log('✅ SEO 최적화 완료');

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1000);
  console.log('💾 저장 완료');

  // 검증
  const v = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const lines = ft.split('\n');
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    const lens = Array.from(paras).filter(p => (p.textContent||'').trim().length>3 && !(p.textContent||'').trim().startsWith('#')).map(p => (p.textContent||'').length);
    const h2 = document.querySelectorAll('h2');
    
    return {
      본문: ft.length + '자',
      전체_줄: lines.length + '줄',
      문단: paras.length + '개',
      이미지: imgs.length + '장',
      H2: h2.length + '개',
      Strong: document.querySelectorAll('strong, b').length + '개',
      평균문단: Math.round(lens.reduce((a,b)=>a+b,0)/(lens.length||1)) + '자',
      '70자초과': lens.filter(l=>l>70).length + '개',
      '머지_없음': !ft.includes('알려드립니다.☀') && !ft.includes('되었습니다.📋') && !ft.includes('됩니다.🎯'),
      '이모지_분리': ft.includes('☀️\n') || ft.includes('📋\n') || ft.includes('💡\n') || ft.includes('🎯\n'),
      H2_목록: Array.from(h2).map(h=>h.textContent),
      샘플: lines.slice(0, 15).map((l,i)=>`[${i}] ${l.substring(0,50)}`)
    };
  });

  console.log('\n=== 검증 ===');
  console.log(JSON.stringify({ 본문: v.본문, 줄: v.전체_줄, 문단: v.문단, H2: v.H2, Strong: v.Strong, 평균: v.평균문단, '70자초과': v['70자초과'] }, null, 2));
  console.log('H2:', v.H2_목록);
  console.log('머지없음:', v['머지_없음'], '이모지분리:', v['이모지_분리']);
  console.log('\n줄 구조:');
  v.샘플.forEach(l => console.log(l));

  await b.close();
}
main().catch(e => console.error('❌', e.message));

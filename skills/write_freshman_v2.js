const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

// 전체 텍스트 한 번에 입력 (빈 줄 2개로 섹션 구분)
const CONTENT = [
  '보험 영업 사회 초년생이라면 상상해보세요.',
  '',
  '아침 출근길, 자연스럽게 찍은 릴스 하나가',
  '고객의 첫인상을 결정합니다.',
  '',
  '더 이상 발품 팔지 마세요.',
  '',
  '이제는 SNS에서 신뢰를 쌓는 시대입니다. 💡',
  '',
  '이 글에서는 보험 영업 사회 초년생이',
  '인스타그램으로 브랜딩하는 방법을 알려드립니다.',
  '',
  '',
  '☀️ 보험 영업, 왜 인스타그램인가',
  '',
  '요즘 고객들은 보험 상품을 검색할 때',
  '인스타그램부터 먼저 확인합니다.',
  '',
  '텍스트와 이미지만으로는 경쟁력이 부족합니다.',
  '',
  '일상 속에 보험 키워드를 자연스럽게 녹이는',
  '숏폼 영상이 가장 효과적입니다.',
  '',
  '출근길 커피 한 잔에도 #보험영업 #출근',
  '상담 마치고 #보험상담 #가입완료',
  '',
  '자연스러운 키워드 노출이 검색 노출로 이어집니다.',
  '',
  '',
  '📋 보험 영업 사회 초년생, 이렇게 시작하세요',
  '',
  '첫째, 일상 속에 키워드를 자연스럽게 녹이세요.',
  '',
  '출근길, 점심시간, 상담 후기, 하루 마무리까지',
  '모든 순간이 콘텐츠입니다.',
  '',
  '둘째, 꾸준함이 가장 중요합니다. 📦',
  '',
  '하루 1개 릴스, 일주일에 3개 숏폼.',
  '혼자 하기 어렵다면 전문가의 도움을 받으세요.',
  '',
  '셋째, 고객의 눈높이에 맞춰 말하세요.',
  '',
  '어려운 보험 용어는 쉽게 풀어서 설명하는 것이',
  '신뢰를 쌓는 가장 빠른 길입니다.',
  '',
  '',
  '✅ 보험 영업, 영상 편집 맡기고 성공한 실제 사례',
  '',
  'A씨의 실제 이야기입니다.',
  '',
  '도입 전: 블로그 글만 올리는 SNS → 월 상담 5~8건',
  '',
  '도입 후: 주 5회 숏폼 정기 납품',
  '→ 월 상담 20~25건 (250% 상승) 📈',
  '',
  '비결은 간단했습니다.',
  '',
  '일상 속에서 자연스럽게 찍고, 전문가가 편집했습니다.',
  '키워드는 자동으로 녹아들었습니다.',
  '',
  '고객은 "이 분, 진짜 꾸준하다"는 인상을 받았고',
  '알고리즘이 콘텐츠를 우선 노출하기 시작했습니다.',
  '',
  '',
  '🎯 지금 시작하세요, 하반기 준비',
  '',
  '하반기 보험 영업의 핵심은 SNS 브랜딩입니다.',
  '',
  '에이컷은 보험 영업 사회 초년생을 위한',
  '숏폼 영상 전문 서비스를 제공합니다.',
  '',
  '✅ 주 5~10편 정기 납품',
  '✅ 일상 속 키워드 최적화 편집',
  '✅ 촬영 가이드 제공',
  '✅ 24~48시간 이내 빠른 납품',
  '',
  '하반기 준비, 지금 시작하세요.',
  '',
  '지금 상담 신청하면 맞춤 전략 제안서를 무료로 제공합니다.',
  '',
  '📞 카카오톡: https://pf.kakao.com/_GIesX/chat',
  '📧 이메일: master@aicut.co.kr',
  '🌐 홈페이지: https://aicut.co.kr',
  '',
  '#보험영업 #보험설계사 #사회초년생 #보험대리점 #숏폼마케팅 #영상편집외주 #인스타그램마케팅 #릴스마케팅 #보험상담 #종신보험 #변액보험 #실비보험 #건강보험 #연금저축 #보험마케팅 #SNS마케팅 #영상콘텐츠 #출근 #보험일상 #에이컷 #숏폼영상 #릴스 #유튜브쇼츠 #틱톡마케팅 #영상편집 #마케팅전략 #하반기준비 #보험대행 #정기납품 #보장설계'
].join('\n');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
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
    SmartEditor._editors['blogpc001'].setDocumentTitle('보험 영업 사회 초년생, 인스타그램으로 성공하는 법');
  });
  console.log('1. 제목 설정');

  // 이미지 5장 업로드 + 본문
  const imgFiles = ['aicut_blog_fp_main.png','aicut_blog_fp_card1.png','aicut_blog_fp_card2.png','aicut_blog_fp_card3.png','aicut_blog_fp_cta.png'];
  
  // 본문을 섹션별로 나누기 (빈 줄 2개 = \n\n\n 기준)
  const sections = CONTENT.split('\n\n\n');
  
  for (let i = 0; i < sections.length; i++) {
    const fullPath = path.join(WS, imgFiles[i]);
    
    try {
      const [fc] = await Promise.all([
        wp.waitForEvent('filechooser', { timeout: 15000 }),
        wp.evaluate(() => document.querySelector('button.se-image-toolbar-button')?.click())
      ]);
      await fc.setFiles([fullPath]);
      await wp.waitForTimeout(1500);
    } catch (e) {
      console.log('  ⚠️ 이미지 실패');
    }

    await wp.evaluate((text) => {
      SmartEditor._editors['blogpc001']._editingService.writeTextWithSoftLineBreak(text);
    }, sections[i]);
    await wp.waitForTimeout(300);
    console.log('  [' + (i+1) + '/5] 완료');
  }

  // SEO
  await wp.evaluate(() => {
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || '';
      const altMap = {
        'main.png': '보험영업 사회초년생 숏폼 영상 편집 아웃소싱',
        'card1.png': '보험 영업 인스타그램 마케팅 숏폼 영상편집',
        'card2.png': '보험설계사 사회초년생 릴스 마케팅 전략',
        'card3.png': '보험 영업 영상 편집 아웃소싱 성공 사례',
        'cta.png': '보험 영업 아웃소싱 에이컷 무료상담'
      };
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
    // 이미지 센터
    document.querySelectorAll('.se-section-image').forEach(s => {
      s.style.margin = '0 auto'; s.style.display = 'block';
    });
    document.querySelectorAll('.se-module-image').forEach(m => {
      m.style.textAlign = 'center';
    });
    // 텍스트 센터
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    // H2
    const h2t = ['☀️ 보험 영업, 왜 인스타그램인가', '📋 보험 영업 사회 초년생', '✅ 보험 영업', '🎯 지금 시작하세요'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const t = (p.textContent || '').trim();
      if (h2t.some(h => t.startsWith(h.substring(0,10)))) {
        const h2 = document.createElement('h2');
        h2.textContent = t; h2.style.textAlign = 'center';
        h2.className = p.className;
        p.parentNode.replaceChild(h2, p);
      }
    });
    // Strong
    const kws = ['보험영업', '보험설계사', '사회초년생', '릴스', '숏폼'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => { html = html.replace(new RegExp('(?![^<]*>)(' + kw + ')', 'g'), '<strong>$1</strong>'); });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);

  // 검증
  const v = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const paras = document.querySelectorAll('.se-text-paragraph');
    const lens = Array.from(paras).filter(p => (p.textContent||'').trim().length>3 && !(p.textContent||'').trim().startsWith('#')).map(p => (p.textContent||'').length);
    return {
      본문: ft.length + '자',
      이미지: document.querySelectorAll('img').length + '장',
      H2: document.querySelectorAll('h2').length + '개',
      Strong: document.querySelectorAll('strong, b').length + '개',
      CTA: ft.includes('pf.kakao.com') && ft.includes('master@aicut.co.kr') && ft.includes('aicut.co.kr'),
      해시태그: (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개',
      FP_없음: !ft.includes('FP') ? '✅' : '⚠️',
      머지: !ft.includes('알려드립니다.☀') && !ft.includes('시작했습니다.🎯') ? '✅' : '⚠️',
      평균문단: Math.round(lens.reduce((a,b)=>a+b,0)/lens.length) + '자',
      '70자초과': lens.filter(l=>l>70).length + '개'
    };
  });
  console.log('\n=== 검증 ===');
  console.log(JSON.stringify(v, null, 2));

  await b.close();
  console.log('\n✅ 완료!');
}
main().catch(e => console.error('에러:', e.message));

// 새 접근법: 이미지 먼저 업로드 → 텍스트 붙여넣기
const { chromium } = require('playwright');
const path = require('path');
const { TITLE, buildBodyHTML } = require('./_blog_realestate_content.js');

const IMAGES = [
  { file: 'aicut_blog_realestate_main.png', alt: '부동산 중개사무소 영상 마케팅 대표 이미지' },
  { file: 'aicut_blog_realestate_card1.png', alt: '부동산 중개사무소 영상 마케팅 중요성' },
  { file: 'aicut_blog_realestate_card2.png', alt: '릴스 쇼츠 부동산 숏폼 마케팅 전략' },
  { file: 'aicut_blog_realestate_card3.png', alt: '하반기 분양 시즌 모델하우스 영상 마케팅 준비' },
  { file: 'aicut_blog_realestate_cta.png', alt: '에이컷 부동산 영상 편집 무료 견적 문의' },
];
const WORKSPACE = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace');

// 이미지 src 태그 없는 순수 텍스트만의 HTML
function buildTextOnlyHTML() {
  const lines = [];
  function p(text) { lines.push(`<p style="text-align: center;">${text}</p>`); }
  function h2(text) { lines.push(`<h2 style="text-align: center;"><strong>${text}</strong></h2>`); }
  function br() { lines.push('<p style="text-align: center;">&nbsp;</p>'); }
  function marker(id, text) { lines.push(`<p style="text-align: center; color: #888;">📌 ${text}</p>`); }

  p('"요즘 사진만 올리면 문의가 안 와요."');
  p('부동산 중개사무소를 운영하는');
  p('지인분이 요즘 가장 많이 하는 말입니다.');
  br();
  p('몇 년 전만 해도 매물 사진 몇 장이면');
  p('하루에 3~4통씩 문의가 들어왔는데요.');
  p('지금은 상황이 완전히 달라졌습니다.');
  br();
  p('고객들은 이제 <strong>영상</strong>을 원합니다.');
  p('사진으로는 공간 감이 안 잡히니까요.');
  p('실제로 <strong>매물 영상</strong>을 올린');
  p('중개사무소는 문의량이 평균 2~3배');
  p('증가했다고 합니다.');
  br();
  // [이미지1: card1]
  br();
  h2('☀️ 사진만으로는 안 팔리는 시대');
  br();
  p('생각해보세요.');
  p('여러분이 집을 구한다고 가정해볼게요.');
  p('사진 5장보다 30초짜리 영상 하나가');
  p('훨씬 더 현장감 있지 않나요?');
  br();
  p('거실이 실제로 얼마나 넓은지,');
  p('채광이 어떤지, 주변 환경은 어떤지...');
  p('이는 사진으로 전달하기 어렵습니다.');
  br();
  p('특히 요즘처럼 <strong>부동산 규제 완화</strong>로');
  p('거래가 살아나는 시기에는요.');
  p('더 빠르게, 더 정확하게');
  p('정보를 전달하는 쪽이 결국');
  p('계약까지 이어집니다.');
  br();
  // [이미지2: card2]
  br();
  h2('📱 릴스·쇼츠 하나로 문의량이 3배');
  br();
  p('직접 경험한 사례를 하나 소개할게요.');
  p('서초동의 한 중개사무소는');
  p('아파트 매물 하나를 30초 <strong>릴스</strong>로');
  p('제작했습니다.');
  br();
  p('그 결과, 조회수 8,000회에');
  p('문의가 12건이나 들어왔어요.');
  p('사진만 올렸을 때는');
  p('문의가 3~4건이었거든요.');
  p('<strong>무려 3배 차이</strong>입니다.');
  br();
  p('이게 바로 <strong>숏폼 마케팅</strong>의 힘입니다.');
  p('릴스, 쇼츠, 틱톡 같은 숏폼 플랫폼은');
  p('알고리즘이 지역 기반 콘텐츠를');
  p('적극적으로 밀어주기 때문이에요.');
  br();
  p('내 사무소 근처에 사는 사람들에게');
  p('내 매물이 노출되는 거죠.');
  p('이보다 더 정확한');
  p('<strong>타겟 마케팅</strong>이 있을까요?');
  br();
  // [이미지3: card3]
  br();
  h2('🏗️ 하반기 분양 시즌, 지금부터 준비하세요');
  br();
  p('7월부터 본격적인');
  p('<strong>하반기 분양 시즌</strong>입니다.');
  p('여름 방학을 앞두고');
  p('이사 수요도 늘어나고요.');
  p('지금이 바로 <strong>영상 마케팅</strong>을');
  p('준비할 타이밍입니다.');
  br();
  p('모델하우스 오픈 영상,');
  p('단지 내부 투어 영상,');
  p('주변 인프라 소개 영상...');
  p('생각보다 할 수 있는');
  p('콘텐츠가 많습니다.');
  br();
  // [이미지4: cta]
  br();
  h2('✂️ 편집은 에이컷에 맡기고, 본업에 집중하세요');
  br();
  p('문제는 <strong>편집</strong>이죠.');
  p('직접 촬영하는 건 그래도 할 만한데,');
  p('편집하려면 시간도 기술도 부족합니다.');
  br();
  p('촬영은 공인중개사님이 직접 하세요.');
  p('고객과의 신뢰는');
  p('본인만이 전달할 수 있으니까요.');
  p('하지만 편집은 <strong>전문가</strong>에게');
  p('맡기세요.');
  br();
  p('에이컷은 <strong>부동산 영상 편집</strong>에');
  p('특화된 프로페셔널 에디터들이');
  p('모여 있습니다.');
  br();
  p('✅ 매주 정해진 요일에 영상 납품');
  p('✅ 1~2일 내 빠른 턴어라운드');
  p('✅ 숏폼 최적화 편집');
  p('✅ 합리적인 월 정기 가격');
  br();
  p('특히 <strong>분양대행사</strong>나');
  p('<strong>중개법인</strong>처럼');
  p('대량 영상이 필요한 곳이라면');
  p('월 정기 납품이 가장 효율적입니다.');
  br();
  // [이미지5: main]
  br();
  h2('📞 지금 바로 문의하세요');
  br();
  p('💬 카카오톡: pf.kakao.com/_GIesX/chat');
  p('📧 이메일: master@aicut.co.kr');
  p('🌐 홈페이지: aicut.co.kr');
  br();
  p('무료 상담과 견적, 부담 없이 문의하세요.');
  p('에이컷이 여러분의');
  p('<strong>부동산 영상 마케팅</strong>을');
  p('책임집니다.');
  br();

  // 해시태그
  const hashtagLines = [
    '#부동산마케팅 #부동산영상 #공인중개사 #부동산중개 #매물영상 #분양마케팅 #숏폼마케팅 #부동산릴스 #영상편집외주 #영상편집',
    '#에이컷 #부동산SNS #부동산유튜브 #모델하우스영상 #분양영상 #부동산쇼츠 #릴스마케팅 #여름분양 #하반기분양 #부동산인스타',
    '#부동산마케팅전략 #영상마케팅 #중개사마케팅 #부동산광고 #숏폼영상',
    '#부동산홍보 #매물마케팅 #중개업소마케팅 #부동산전문가 #AICUT'
  ];
  hashtagLines.forEach(line => p(line));

  return lines.join('\n');
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // === 새 탭에서 postwrite 열기 ===
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 팝업 처리 (이어서 작성 팝업)
  await page.evaluate(() => {
    const popup = document.querySelector('.se-popup-container.__se-pop-layer');
    if (popup) {
      const newBtn = Array.from(popup.querySelectorAll('button')).find(b => b.innerText.includes('새로 작성'));
      if (newBtn) newBtn.click();
    }
  });
  await page.waitForTimeout(2000);
  
  console.log('새 탭 postwrite 로드 완료');
  
  // === 1. 제목 입력 ===
  console.log('📝 제목 입력...');
  await page.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, TITLE);
  console.log('  ✅ 제목:', TITLE);
  
  // === 2. 이미지 업로드 (사진 툴바 버튼 → file chooser) ===
  console.log('\n📸 이미지 업로드 시작...');
  
  for (let i = 0; i < IMAGES.length; i++) {
    const imgFile = path.join(WORKSPACE, IMAGES[i].file);
    console.log(`  [${i+1}/${IMAGES.length}] ${IMAGES[i].file}...`);
    
    // file chooser 대기 설정
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    
    // 사진 툴바 버튼 클릭
    await page.click('.se-image-toolbar-button', { timeout: 5000 });
    await page.waitForTimeout(800);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(imgFile);
      console.log('    ✅ 업로드 완료');
      await page.waitForTimeout(3000);
    } else {
      console.log('    ❌ file chooser 없음');
      break;
    }
  }
  
  // === 3. 텍스트 붙여넣기 ===
  console.log('\n📝 본문 텍스트 붙여넣기...');
  const textHTML = buildTextOnlyHTML();
  
  // 클립보드 복사
  await page.evaluate((html) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()], { type: 'text/plain' })
      })
    ]);
  }, textHTML);
  console.log('  ✅ 클립보드 복사');
  await page.waitForTimeout(500);
  
  // 에디터 본문 영역 클릭 후 붙여넣기
  await page.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      ce.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(5000);
  
  // === 4. 결과 확인 ===
  const result = await page.evaluate(() => {
    const seContent = document.querySelector('.se-content.__se-scroll-target');
    const comps = document.querySelectorAll('.se-component');
    const imgComps = document.querySelectorAll('.se-component.se-image');
    return {
      compsTotal: comps.length,
      imgComps: imgComps.length,
      imgOk: Array.from(imgComps).filter(c => !!c.querySelector('img')).length,
      imgBroken: Array.from(imgComps).filter(c => c.innerText.includes('존재하지 않는 이미지')).length,
      textLen: (seContent?.innerText || '').length,
    };
  });
  console.log('\n📊 최종 결과:', JSON.stringify(result, null, 2));
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('💾 저장 완료');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug_new_approach.png', fullPage: true });
  console.log('✅ 스크린샷 저장');
  
  await b.disconnect();
  console.log('\n✅ 작업 완료! 브라우저 확인 바랍니다.');
}

main().catch(e => console.error('❌', e.message));

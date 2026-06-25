const { chromium } = require('playwright');
const fs = require('fs');

const IMAGES = [
  'aicut_worldcup_main.png',
  'aicut_worldcup_01.png',
  'aicut_worldcup_02.png',
  'aicut_worldcup_03.png',
  'aicut_worldcup_cta.png'
];

(async () => {
  console.log('=== 블로그 작성 (월드컵) ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Redirect=Update 탭 찾거나 새로 열기
  let page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
  } else {
    await page.bringToFront();
    await page.waitForTimeout(3000);
  }
  
  const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
  if (!pf) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
  console.log('에디터 접근 성공');
  
  // ===== Step 1: 초기화 =====
  console.log('\n1. 초기화 + 제목 설정...');
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('2026 월드컵, 숏폼 마케팅으로 응원 열기 올리는 법');
    se._canvasScrollingService.focusToFirstComp();
  });
  await page.waitForTimeout(2000);
  console.log('   ✅ 초기화 완료');
  
  // ===== Step 2: 텍스트 블록 준비 =====
  const title = '2026 월드컵, 숏폼 마케팅으로 응원 열기 올리는 법';
  
  // 각 텍스트 블록을 \n으로 연결 (writeTextWithSoftLineBreak 사용)
  const textBlocks = [
    // 블록 1
    '2026 월드컵이 한창입니다. 경기장의 열기가 그대로 SNS로 이어지면서 숏폼 콘텐츠의 소비량이 폭발적으로 증가하고 있습니다.',
    '특히 응원 릴스, 경기 하이라이트, 선수 인터뷰 영상이 가장 빠르게 확산되는 콘텐츠로 자리잡았습니다.',
    '',
    '릴스 알고리즘 2026, 월드컵 숏폼이 답이다',
    '',
    '릴스는 15~30초의 짧은 호흡으로 완전 시청률이 핵심입니다. 유튜브 쇼츠는 30~60초로 좋아요율이 중요하고, 틱톡은 15~60초로 재시청과 공유율이 관건입니다.',
    '월드컵 콘텐츠는 각 플랫폼의 특성에 맞게 최적화해야 합니다.',
    '',
    '경기 종료 후 30분이 가장 중요한 골든타임입니다. 승리 세리머니, 결정적 장면, 선수 인터뷰 등을 빠르게 편집해서 발행해야 조회수가 극대화됩니다.',
    '',
    '월드컵 마케팅, 데이터로 증명하다',
    '',
    '2026년 상반기 에이컷 자체 분석 결과, 월드컵 시즌 동안 숏폼 콘텐츠의 사용자 참여율은 일반 피드 콘텐츠 대비 평균 3.7배 높은 것으로 나타났습니다.',
    '특히 주 3~4회 꾸준히 발행한 계정의 팔로워 증가율은 더욱 두드러졌습니다.',
    '',
    '에이컷과 준비하는 월드컵 숏폼 마케팅',
    '',
    '바쁜 월드컵 시즌, 매일 콘텐츠를 기획하고 촬영하고 편집하는 것은 내부 마케터만으로는 한계가 있습니다.',
    '촬영 원본만 보내주세요. 에이컷의 전문 에디터가 릴스, 쇼츠, 틱톡에 최적화된 숏폼으로 편집해 드립니다.',
    '자막, BGM, 브랜드 로고 자동 적용, 주 2~3편 꾸준히 납품, 약정 부담 없이 가능합니다.',
    '',
    '지금 바로 무료 상담 신청하세요',
    '',
    '카카오톡 채널: pf.kakao.com/_GIesX/chat',
    '이메일: master@aicut.co.kr',
    '홈페이지: aicut.co.kr'
  ];
  
  // 해시태그
  const hashtags = '#릴스알고리즘 #월드컵 #월드컵마케팅 #숏폼마케팅 #AI영상편집 #영상편집아웃소싱 #에이컷 #릴스 #쇼츠 #틱톡 #스포츠마케팅 #응원릴스 #경기하이라이트 #숏폼콘텐츠 #인스타그램릴스 #유튜브쇼츠 #틱톡마케팅 #여름마케팅 #6월마케팅 #하반기준비 #영상편집 #영상제작 #마케팅전략 #콘텐츠마케팅 #SNS마케팅 #디지털마케팅 #브랜디드콘텐츠 #영상외주 #AICUT #무료상담';
  
  const fullText = textBlocks.join('\n') + '\n\n' + hashtags;
  
  // ===== Step 3: 텍스트 입력 =====
  console.log('2. 텍스트 입력...');
  await pf.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    const es = se._editingService;
    if (typeof es.writeTextWithSoftLineBreak === 'function') {
      es.writeTextWithSoftLineBreak(text);
    } else {
      // line by line
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        es.write(lines[i]);
        if (i < lines.length - 1) es.lineBreak();
      }
    }
  }, fullText);
  await page.waitForTimeout(3000);
  
  // ===== Step 4: 입력 확인 =====
  const check1 = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const paras = wrap?.querySelectorAll('.se-text-paragraph');
    return {
      textLen: se.getContentText().length,
      paraCount: paras?.length || 0,
      textComps: wrap?.querySelectorAll('.se-component.se-text').length || 0
    };
  });
  console.log(`   textLen: ${check1.textLen}, paraCount: ${check1.paraCount}, comps: ${check1.textComps}`);
  
  if (check1.textLen > 500 && check1.paraCount > 10) {
    console.log('   ✅ 텍스트 입력 성공');
  } else {
    console.log('   ⚠️ 텍스트 입력 부족');
  }
  
  // ===== Step 5: 이미지 placeholder (RULES.md 4-0-1 방식: 텍스트→이미지 순서) =====
  console.log('3. 이미지 placeholder 추가...');
  await pf.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    if (!wrap) return;
    
    // 각 텍스트 섹션 사이에 이미지 컴포넌트 추가
    // image → text → image → text → image → text 순서로 구성
    const imgHtml = `<div class="se-component se-image se-l-default"><div class="se-component-content"><div class="se-section se-section-image se-l-default se-section-align-center" style="max-width:700px;"><div class="se-module se-module-image"><p style="text-align:center;padding:40px 20px;background:#f5f5f5;border:2px dashed #ccc;border-radius:8px;color:#999;font-size:16px;">📷 사진 버튼으로 이미지를 등록해주세요</p></div></div></div></div>`;
    
    // 첫 번째 이미지는 가장 앞에 추가
    const firstComp = wrap.querySelector('.se-component');
    if (firstComp) firstComp.insertAdjacentHTML('beforebegin', imgHtml);
    
    // 추가 이미지는 text 컴포넌트 사이에 삽입
    const textComps = wrap.querySelectorAll('.se-component.se-text');
    if (textComps.length >= 3) {
      textComps[0].insertAdjacentHTML('afterend', imgHtml);
    }
    if (textComps.length >= 5) {
      textComps[2].insertAdjacentHTML('afterend', imgHtml);
    }
    if (textComps.length >= 7) {
      textComps[4].insertAdjacentHTML('afterend', imgHtml);
    }
    if (textComps.length >= 9) {
      textComps[6].insertAdjacentHTML('afterend', imgHtml);
    }
  });
  await page.waitForTimeout(1000);
  console.log('   ✅ 이미지 placeholder 추가 완료');
  
  // ===== Step 6: 저장 =====
  console.log('4. 저장...');
  let saved = false;
  for (let a = 0; a < 10; a++) {
    saved = await page.evaluate(() => {
      const all = document.querySelectorAll('button, em, a, span');
      for (const el of all) {
        const t = (el.textContent || '').trim();
        if (t === '저장' && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (saved) break;
    await page.waitForTimeout(1000);
  }
  console.log(`   저장: ${saved ? '✅' : '⚠️ 못 찾음'}`);
  
  // ===== Step 7: 최종 확인 =====
  const final = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    return {
      title: se.getDocumentTitle(),
      textLen: se.getContentText().length,
      comps: wrap?.querySelectorAll('.se-component').length || 0,
      textComps: wrap?.querySelectorAll('.se-component.se-text').length || 0,
      imgComps: wrap?.querySelectorAll('.se-component.se-image').length || 0,
      paras: wrap?.querySelectorAll('.se-text-paragraph').length || 0
    };
  });
  
  console.log('\n=== 최종 결과 ===');
  console.log(JSON.stringify(final, null, 2));
  console.log('\n✅ 완료');
  
  await ctx.close();
})().catch(e => console.error('FATAL:', e.message));

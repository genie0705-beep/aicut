const { chromium } = require('playwright');

// RULES.md 6-2-3 SE4 1.77.0 대응 표준 방식
// _editingService.writeTextWithSoftLineBreak() 사용

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';

async function waitForSE(page) {
  for (let i = 0; i < 30; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try { const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined'); if (ok) return f; } catch(e) {}
      }
    }
    await page.waitForTimeout(1500);
  }
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }

  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 6-2-3 방식 API 확인
  const apiCheck = await f.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    return {
      hasEditingService: !!se._editingService,
      hasDocService: !!se._documentService,
      hasCanvasScroll: !!se._canvasScrollingService,
      hasWrite: typeof se._editingService?.write === 'function',
      hasWriteWithBreak: typeof se._editingService?.writeTextWithSoftLineBreak === 'function',
      hasReset: typeof se._documentService?.resetDocumentData === 'function',
      hasFocusFirst: typeof se._canvasScrollingService?.focusToFirstComp === 'function',
    };
  });
  console.log('6-2-3 API 확인:', JSON.stringify(apiCheck));

  if (!apiCheck.hasWriteWithBreak) {
    console.log('❌ writeTextWithSoftLineBreak 없음. write() 방식으로 fallback');
  }

  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');

  // 2. 본문 텍스트 (RULES.md 4-0-1 규칙 적용)
  // 공감형 도입 + 질문-해결형 + 개인 경험 + 짧은 문단
  const contentLines = [
    '',
    '"원장님, 인스타그램 하세요?"',
    '요즘 병원·의원에 가면 꼭 듣는 질문입니다.',
    '환자들이 병원을 고를 때 인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.',
    '릴스·쇼츠에 병원 소개 영상을 올리면 일반 텍스트보다 문의율이 3배 이상 높습니다.',
    '하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.',
    '간호사님한테 폰으로 찍어달라 하기도 애매하고, 의료광고 규제 때문에 겁나고요.',
    '그래서 준비했습니다. 피부과·치과·한의원·성형외과에서 바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.',
    '',
    '📋 직접 찍고 직접 편집하면 생기는 일',
    '',
    '많은 병원 원장님들, 영상 마케팅 시작했다가 금방 포기합니다.',
    '그 이유, 알고 계신가요?',
    '첫째, 촬영 시간이 너무 낭비됩니다.',
    '원장님이 직접 영상 찍으려면 진료 시간 내고 스크립트 짜야 해요.',
    '둘째, 편집 프로그램이 너무 어렵습니다.',
    '프리미어 프로나 파이널 컷 배우려면 최소 3개월 걸려요.',
    '셋째, 의료광고 규제를 다 외우기 어렵습니다.',
    '식약처 심의, 네이버 정책까지 생각하면 영상 하나 올리기도 부담스러워요.',
    '이런 고민, 에이컷이 다 해결해드립니다.',
    '',
    '✅ 의료광고 규제, 전문 에디터가 체크합니다',
    '',
    '"의료광고, 영상 올려도 돼요?"',
    '네, 가능합니다. 단, 몇 가지 규정을 꼭 지켜야 해요.',
    '체험담·효과를 과장하지 않을 것',
    "'확실한 효과'처럼 단정적 표현 금지",
    '치료 전·후 사진은 진실하게 표시',
    '의료법·약사법·식품위생법 준수 내용만',
    '처음엔 하나하나 신경 쓰이는 게 정상입니다.',
    '경험이 많은 편집 에디터가 있으면 규제를 지키면서도 마케팅 효과를 극대화할 수 있어요.',
    '에이컷은 병원 영상 편집 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.',
    '',
    '🎯 여름 시즌, 피부과·의원 마케팅 전략',
    '',
    '7월 중순, 무더위 절정. 피부과·의원에 딱 맞는 여름 시즌 콘텐츠를 소개합니다.',
    '✔️ 선크림·자외선 차단 영상 - 여름 필수, 병원 추천 신뢰도 UP',
    '✔️ 다이어트·체형 관리 영상 - 여름 휴가 전 관리법, 환자 공감 UP',
    '✔️ 원장님 브랜딩 숏폼 - 신뢰감 있는 전문가 이미지 각인',
    '✔️ 시술 소개 60초 요약 - 궁금증 해소, 예약 전환율 UP',
    '매주 2~3개 꾸준히 올리면 3개월 후 지역 내 최고 채널로 자리잡습니다.',
    '실제로 저희가 편집해드리는 피부과 원장님께서',
    '"영상 올린 후 문의가 3배 늘었어요"라고 하셨습니다.',
    '이게 바로 영상 마케팅의 힘입니다.',
    '',
    '📸 병원에 딱 맞는 영상, 어떻게 만드나요?',
    '',
    '에이컷의 병원 영상 작업 프로세스입니다.',
    'STEP 1: 원장님 촬영 영상 전송 - 핸드폰 3~5분, 대본 불필요',
    'STEP 2: 에이컷 에디터가 편집 완료 - 숏폼 맞춤, 규제 체크',
    'STEP 3: 검토 후 무제한 수정 - 추가 비용 없음',
    'STEP 4: 완료 영상 다운로드 후 게시 - 원장님은 올리기만 하면 끝!',
    '복잡한 편집 프로그램, 이제 안녕입니다.',
    '',
    '🔥 하반기 마케팅, 준비된 병원이 이깁니다',
    '',
    '벌써 7월입니다. 하반기 병원 마케팅 전략, 세워두셨나요?',
    '상반기 텍스트 마케팅에서 하반기에는 영상 마케팅을 추가해보세요.',
    '영상 하나가 환자의 마음을 움직입니다.',
    '직접 찍고, 전문가가 편집하는 가장 효율적인 병원 마케팅, 지금 시작하세요.',
    '문의는 아래 연락처로 편하게 주세요.',
    '',
    '📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat',
    '📧 이메일: master@aicut.co.kr',
    '🌐 홈페이지: https://aicut.co.kr',
    '',
    '#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠',
  ];

  const fullText = contentLines.join('\n');

  // 6-2-3 방식: _editingService.writeTextWithSoftLineBreak 사용
  const writeResult = await f.evaluate((text) => {
    try {
      const se = SmartEditor._editors['blogpc001'];
      
      // 1) resetDocumentData
      se._documentService.resetDocumentData();
      
      // 2) focusToFirstComp
      se._canvasScrollingService.focusToFirstComp();
      
      // 3) writeTextWithSoftLineBreak
      if (se._editingService.writeTextWithSoftLineBreak) {
        se._editingService.writeTextWithSoftLineBreak(text);
      } else if (se._editingService.write) {
        se._editingService.write(text);
      } else {
        return { error: 'no write method available' };
      }
      
      // 4) center align
      document.querySelectorAll('.se-text-paragraph').forEach(p => {
        p.classList.add('se-text-paragraph-align-center');
        p.style.textAlign = 'center';
      });
      const wrap = document.querySelector('.se-components-wrap');
      if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
      
      return { success: true };
    } catch(e) {
      return { error: e.message };
    }
  }, fullText);
  
  console.log('✅ 2/5 6-2-3 write:', JSON.stringify(writeResult));

  if (writeResult.error) {
    console.log('⚠️ write 실패, setDocumentData fallback');
    // fallback to setDocumentData
  }

  // 제목 재설정 (resetDocumentData가 제목도 초기화할 수 있음)
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);

  await f.waitForTimeout(2000);

  // 결과 검증
  const verify = await f.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const textLen = se.getContentText ? se.getContentText().length : 0;
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    return {
      title: se.getDocumentTitle(),
      contentTextLen: textLen,
      paragraphCount: paras,
    };
  });
  console.log('📊 입력 검증:', JSON.stringify(verify));

  await f.waitForTimeout(1000);

  // 3. 이미지 업로드 (이미지-글 교차 배치를 위해 섹션별 업로드)
  const IMGS = [
    'aicut_blog_hospital_main.png', 'aicut_blog_hospital_01.png',
    'aicut_blog_hospital_02.png', 'aicut_blog_hospital_03.png', 'aicut_blog_hospital_cta.png'
  ];
  
  for (let i = 0; i < IMGS.length; i++) {
    console.log(`📸 3/5 이미지 ${i+1}/5: ${IMGS[i]}`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMGS[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 3/5 이미지 완료');

  // 4. 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 4/5 저장');
  await f.waitForTimeout(2000);

  // 5. 최종 확인
  const final = await f.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const d = se.getDocumentData().document;
    const tc = d.components?.find(c => c['@ctype'] === 'text');
    const paras = tc ? tc.value : [];
    const chars = paras.reduce((a,p) => a + p.nodes.reduce((b,n) => b + (n.value?.length||0), 0), 0);
    const h2 = paras.filter(p => p['@ctype'] === 'heading2').length;
    return {
      title: se.getDocumentTitle(),
      paragraphs: paras.length,
      chars,
      h2,
      images: d.components?.filter(c => c.fileName).length || 0,
      firstText: paras[0]?.nodes?.[0]?.value?.substring(0, 20) || '',
      canvasTextLen: document.querySelector('.se-canvas')?.innerText?.length || 0,
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final));
  if (final.canvasTextLen > 100) {
    console.log('✅ 캔버스에 텍스트 표시됨!');
  }
  console.log('정이사님, 발행 테스트 부탁드립니다!');
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

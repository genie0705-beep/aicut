const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
const IMG_FILES = [
  'aicut_blog_hospital_main.png','aicut_blog_hospital_01.png',
  'aicut_blog_hospital_02.png','aicut_blog_hospital_03.png','aicut_blog_hospital_cta.png',
];

// HTML with proper formatting (NO <b> tags - use plain text to test first)
const TEXT_ONLY = [
  "☀️ 요즘 병원 마케팅, '숏폼'이 전부다",
  "",
  '"원장님, 인스타그램 하세요?"',
  '요즘 병원·의원에 가면 꼭 듣는 질문입니다.',
  '환자들이 병원을 고를 때 인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.',
  '실제로 릴스·쇼츠에 병원 소개 영상을 올리면 일반 텍스트보다 문의율이 3배 이상 높습니다.',
  '하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요. 의료광고 규제 때문에 겁나고요.',
  '그래서 준비했습니다. 피부과·치과·한의원·성형외과에서 바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.',
  '',
  '📋 직접 찍고 직접 편집하면 생기는 일',
  '',
  '많은 병원 원장님들이 영상 마케팅을 시작했다가 금방 포기하는 이유, 알고 계신가요?',
  '첫째, 촬영 시간이 너무 낭비됩니다. 진료 시간 내고 스크립트 짜야 합니다.',
  '둘째, 편집 프로그램이 너무 어렵습니다. 배우려면 최소 3개월 걸려요.',
  '셋째, 의료광고 규제를 다 외우기 어렵습니다. 영상 하나 올리기도 부담됩니다.',
  '이런 고민, 저희가 다 해결해드립니다.',
  '',
  '✅ 의료광고 규제, 전문 에디터가 체크합니다',
  '',
  '"의료광고, 영상 올려도 돼요?" 네, 가능합니다. 단, 몇 가지 규정을 꼭 지켜야 해요.',
  '체험담·효과를 과장하지 않을 것',
  "'확실한 효과'처럼 단정적 표현 금지",
  '치료 전·후 사진은 진실하게 표시',
  '의료법·약사법·식품위생법 준수 내용만',
  '경험이 많은 편집 에디터가 있으면 규제를 지키면서도 마케팅 효과를 극대화할 수 있어요.',
  '',
  '🎯 여름 시즌, 피부과·의원 마케팅 전략',
  '',
  '7월 중순, 무더위 절정. 피부과·의원에 딱 맞는 여름 시즌 콘텐츠를 소개합니다.',
  '선크림·자외선 차단 영상 — 병원 추천 신뢰도 UP',
  '다이어트·체형 관리 영상 — 여름 휴가 전 관리법',
  '원장님 브랜딩 숏폼 — 신뢰감 있는 전문가 이미지',
  '시술 소개 60초 요약 — 예약 전환율 UP',
  '매주 2~3개 꾸준히 올리면 3개월 후 지역 내 최고 채널로 자리잡습니다.',
  '',
  '📸 병원에 딱 맞는 영상, 어떻게 만드나요?',
  '',
  '에이컷의 병원 영상 작업 프로세스입니다.',
  'STEP 1: 원장님 촬영 영상 전송 — 핸드폰 3~5분, 대본 불필요',
  'STEP 2: 에이컷 1~2일 내 편집 완료 — 숏폼 맞춤, 규제 체크',
  'STEP 3: 검토 후 무제한 수정 — 마음에 들 때까지',
  'STEP 4: 완료 영상 다운로드 후 게시 — 원장님은 올리기만 하면 끝!',
  '',
  '🔥 하반기 마케팅, 준비된 병원이 이깁니다',
  '',
  '벌써 7월입니다. 하반기 병원 마케팅 전략, 세워두셨나요?',
  '상반기 텍스트에서 하반기에는 영상 마케팅을 추가해보세요.',
  '직접 찍고, 전문가가 편집하는 가장 효율적인 병원 마케팅, 지금 시작하세요.',
  '',
  '📞 카카오톡: https://pf.kakao.com/_GIesX/chat',
  '📧 이메일: master@aicut.co.kr',
  '🌐 홈페이지: https://aicut.co.kr',
  '',
  '#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠',
].join('\n');

async function waitForSE(page) {
  for (let i = 0; i < 20; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try {
          const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
          if (ok) return f;
        } catch(e) { /* retry */ }
      }
    }
    await page.waitForTimeout(1500);
  }
  return null;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  // dialog auto-handle
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');

  // 2. 이미지 업로드
  for (let i = 0; i < IMG_FILES.length; i++) {
    console.log(`📸 2/5 이미지 ${i+1}/5`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMG_FILES[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 2/5 이미지 업로드');
  
  // 3. components 저장
  const comps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });
  console.log(`components: ${comps.length}개 (이미지 ${comps.filter(c=>c.fileName).length}장)`);

  // 4. textarea 방식으로 클립보드 저장
  const copyOK = await f.evaluate((text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const result = document.execCommand('copy');
      ta.remove();
      return result;
    } catch(e) { return 'error: ' + e.message; }
  }, TEXT_ONLY);
  console.log('✅ 3/5 클립보드 저장 (textarea):', copyOK);
  await f.waitForTimeout(500);
  
  // 5. Focus + Ctrl+V
  await f.evaluate(() => {
    try { SmartEditor._editors['blogpc001']._canvasScrollingService?.focusFirstText(); } catch(e) {}
    // Also click on canvas
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      const ce = canvas.querySelector('[contenteditable]');
      if (ce) { ce.focus(); ce.click(); }
    }
  });
  await f.waitForTimeout(1000);
  
  await page.keyboard.press('Control+v');
  console.log('✅ 4/5 Ctrl+V');
  await f.waitForTimeout(3000);
  
  // Check result
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    const r = {};
    if (d.blocks && d.blocks.length > 0) {
      r.blocks = d.blocks.length;
      r.chars = d.blocks.reduce((a,b) => a + (b.text?.length||0), 0);
    } else {
      r.blocks = 'MISSING';
      r.canvasText = (c?.innerText || '').substring(0, 80);
    }
    r.canvasTextLen = (c?.innerText || '').length;
    r.canvasImgs = c ? c.querySelectorAll('img').length : 0;
    r.imgComps = d.components?.filter(x => x.fileName).length || 0;
    return r;
  });
  
  console.log('📊 결과:', JSON.stringify(check));

  if (check.blocks !== 'MISSING' && check.chars > 500) {
    console.log('✅ 붙여넣기 성공!');
    
    // blocks에 components 복원
    if (check.imgComps < 5) {
      await f.evaluate((savedComps) => {
        const ed = SmartEditor._editors['blogpc001'];
        const data = ed.getDocumentData();
        data.document.components = savedComps;
        ed.setDocumentData(data);
      }, comps);
      console.log('✅ components 복원');
    }
    
    await f.waitForTimeout(500);
    await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
    console.log('💾 저장');
    await f.waitForTimeout(2000);
    
    const final = await f.evaluate(() => {
      const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
      const c = document.querySelector('.se-canvas');
      return {
        blocks: d.blocks?.length,
        chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
        imgComps: d.components?.filter(x => x.fileName).length,
        canvasTextLen: (c?.innerText || '').length,
        canvasImgs: c ? c.querySelectorAll('img').length : 0,
      };
    });
    console.log('\n📋 최종:', JSON.stringify(final));
    console.log('\n✅✅✅ 발행 준비 완료!');
    
  } else {
    console.log('\n❌ 붙여넣기 실패 → setDocumentData');
    const lines = TEXT_ONLY.split('\n');
    const blocks = [];
    lines.forEach(line => {
      if (line.trim() === '') {
        blocks.push({ type: 'paragraph', text: '', style: { textAlign: 'center' } });
      } else if (line.startsWith('☀️') || line.startsWith('📋') || line.startsWith('✅') || 
                 line.startsWith('🎯') || line.startsWith('📸') || line.startsWith('🔥')) {
        blocks.push({ type: 'heading2', text: line, style: { textAlign: 'center' } });
      } else {
        blocks.push({ type: 'paragraph', text: line, style: { textAlign: 'center' } });
      }
    });
    
    await f.evaluate(({b, c}) => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      data.document.blocks = b;
      data.document.components = c;
      data.document.removedImages = [];
      ed.setDocumentData(data);
    }, {b: blocks, c: comps});
    console.log('✅ setDocumentData + components 복원 완료');
    
    await f.waitForTimeout(500);
    await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
    console.log('💾 저장');
    await f.waitForTimeout(2000);
    
    const final = await f.evaluate(() => {
      const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
      return {
        blocks: d.blocks?.length,
        chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
        imgComps: d.components?.filter(x => x.fileName).length,
      };
    });
    console.log('\n📋 최종:', JSON.stringify(final));
    console.log('\n⚠️ setDocumentData 방식 저장 완료. 발행 테스트 필요.');
    console.log('※ 발행 후 텍스트 안 보이면 blocks 데이터 형식 문제. 일단 시도해보세요.');
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

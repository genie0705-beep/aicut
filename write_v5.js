const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
const IMG_FILES = [
  'aicut_blog_hospital_main.png',
  'aicut_blog_hospital_01.png',
  'aicut_blog_hospital_02.png',
  'aicut_blog_hospital_03.png',
  'aicut_blog_hospital_cta.png',
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  
  // Wait for iframe + SE
  let f;
  for (let i = 0; i < 20; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      f = await fe.contentFrame();
      if (f) {
        const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
        if (ok) break;
      }
    }
    await page.waitForTimeout(1500);
  }
  if (!f) { console.log('❌'); process.exit(1); }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목');
  
  // 2. setDocumentData로 데이터 설정
  const blocks = [
    { type: 'heading2', text: "☀️ 요즘 병원 마케팅, '숏폼'이 전부다", style: { textAlign: 'center' } },
    { type: 'paragraph', text: '"원장님, 인스타그램 하세요?"', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '요즘 병원·의원에 가면 꼭 듣는 질문입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '환자들이 병원을 고를 때', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '실제로 릴스·쇼츠에 병원 소개 영상을 올리면', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '일반 텍스트보다 문의율이 3배 이상 높습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '간호사님한테 폰으로 찍어달라 하기도 애매하고,', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '의료광고 규제 때문에 뭐라도 잘못 나갈까 겁나고요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '그래서 준비했습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '피부과·치과·한의원·성형외과에서 바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: "📋 직접 찍고 직접 편집하면 생기는 일", style: { textAlign: 'center' } },
    { type: 'paragraph', text: '많은 병원 원장님들이 영상 마케팅을 시작했다가 금방 포기하는 이유, 알고 계신가요?', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '첫째, 촬영 시간이 너무 낭비됩니다. 원장님이 직접 영상을 찍으려면 진료 시간 내야 하고, 스크립트도 짜야 합니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '둘째, 편집 프로그램이 너무 어렵습니다. 프리미어 프로나 파이널 컷을 배우려면 최소 3개월은 걸려요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '셋째, 의료광고 규제를 다 외우기 어렵습니다. 식약처 심의 기준, 네이버 정책까지 고려하면 영상 하나 올리기도 부담스럽습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '이런 고민, 저희가 다 해결해드립니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: "✅ 의료광고 규제, 전문 에디터가 체크합니다", style: { textAlign: 'center' } },
    { type: 'paragraph', text: '"의료광고, 영상 올려도 돼요?" 네, 가능합니다. 단, 몇 가지 규정을 꼭 지켜야 해요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔹 체험담·효과를 과장하지 않을 것 · 🔹 \'확실한 효과\'처럼 단정적 표현 금지', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔹 치료 전·후 사진은 진실하게 표시 · 🔹 의료법·약사법·식품위생법 준수 내용만', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '처음엔 하나하나 신경 쓰이는 게 정상입니다. 하지만 경험이 많은 편집 에디터가 있으면 이런 규제를 완벽하게 지키면서도 마케팅 효과를 극대화할 수 있어요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '에이컷은 병원 영상 편집 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: "🎯 여름 시즌, 피부과·의원 마케팅 전략", style: { textAlign: 'center' } },
    { type: 'paragraph', text: '7월 중순, 무더위가 절정인 지금. 피부과·의원에 딱 맞는 여름 시즌 콘텐츠를 소개합니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✔️ 선크림·자외선 차단 영상 — 여름 필수 아이템, 병원 추천 신뢰도 UP', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✔️ 다이어트·체형 관리 시즌 영상 — 여름 휴가 전 관리법, 환자 공감 UP', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✔️ 원장님 브랜딩 숏폼 — 신뢰감 있는 전문가 이미지 각인', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✔️ 시술 소개 60초 요약 — 궁금증 해소, 예약 전환율 UP', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '이런 영상들을 매주 2~3개씩 꾸준히 올리면 3개월 후 병원 인스타그램이 지역 내 최고 채널로 자리잡습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: "📸 병원에 딱 맞는 영상, 어떻게 만드나요?", style: { textAlign: 'center' } },
    { type: 'paragraph', text: '에이컷의 병원 영상 작업 프로세스를 소개합니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'STEP 1: 원장님·실장님께서 촬영 영상 전송 — 핸드폰 3~5분, 대본 불필요', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'STEP 2: 에이컷 에디터가 1~2일 내 편집 완료 — 숏폼 맞춤, 의료광고 규제 체크', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'STEP 3: 검토 후 무제한 수정 요청 — 마음에 들 때까지 OK', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'STEP 4: 완료된 영상 다운로드 후 게시 — 원장님은 올리기만 하면 끝!', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: "🔥 하반기 마케팅, 준비된 병원이 이깁니다", style: { textAlign: 'center' } },
    { type: 'paragraph', text: '벌써 7월입니다. 하반기 병원 마케팅 전략, 세워두셨나요?', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '상반기 텍스트 마케팅에서 하반기에는 영상 마케팅을 추가해보세요. 영상 하나가 환자의 마음을 움직입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '직접 찍고, 전문가가 편집하는 가장 효율적인 병원 마케팅, 지금 시작하세요. 문의는 아래 연락처로!', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📞 카카오톡: https://pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📧 이메일: master@aicut.co.kr', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🌐 홈페이지: https://aicut.co.kr', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠', style: { textAlign: 'center' } },
  ];
  
  await f.evaluate((blocks) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.blocks = blocks;
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, blocks);
  console.log('✅ 2/5 데이터 설정 (', blocks.length, '블록)');
  
  // 3. Canvas에 HTML 직접 주입 (SE4 형식)
  await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return;
    
    const wrap = canvas.querySelector('.se-components-wrap') || document.createElement('article');
    if (!canvas.contains(wrap)) {
      wrap.className = 'se-components-wrap';
    }
    
    // 텍스트 HTML 생성
    const ed = SmartEditor._editors['blogpc001'];
    const blocks = ed.getDocumentData().document.blocks;
    
    let textHTML = '';
    blocks.forEach(b => {
      if (b.type === 'heading2') {
        textHTML += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><h2 style="text-align:center;">${b.text}</h2></div></div></div></div>`;
      } else if (b.type === 'paragraph' && b.text) {
        textHTML += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><p style="text-align:center;">${b.text}</p></div></div></div></div>`;
      } else if (b.type === 'paragraph' && !b.text) {
        textHTML += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><p style="text-align:center;"><br></p></div></div></div></div>`;
      }
    });
    
    // title component 유지
    const titleComp = wrap.querySelector('.se-component[class*="title"]');
    if (titleComp) {
      wrap.innerHTML = titleComp.outerHTML + textHTML;
    } else {
      wrap.innerHTML = textHTML;
    }
    
    // 강제 이벤트
    wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  
  await f.waitForTimeout(2000);
  console.log('✅ 3/5 canvas HTML 업데이트');
  
  // 4. 확인
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const canvas = document.querySelector('.se-canvas');
    return {
      chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
      wrapChildren: canvas?.querySelector('.se-components-wrap')?.children.length || 0,
      canvasText: (canvas?.innerText || '').substring(0, 200),
      canvasTextLen: (canvas?.innerText || '').length,
    };
  });
  
  console.log('📊:', JSON.stringify(check));
  
  // 5. 이미지 업로드
  for (let i = 0; i < IMG_FILES.length; i++) {
    console.log(`📸 ${IMG_FILES[i]}`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup').forEach(el => el.remove()));
    await f.evaluate(() => document.querySelector('.se-image-toolbar-button')?.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMG_FILES[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 4/5 이미지 완료');
  
  // 6. 저장
  await f.waitForTimeout(500);
  const sBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
  if (sBtn) { await sBtn.click(); console.log('💾 5/5 저장'); }
  await f.waitForTimeout(2000);
  
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    return {
      blocks: d.blocks?.length,
      chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
      imgComps: d.components?.filter(x => x.fileName).length,
      canvasTextLen: (c?.innerText || '').length,
    };
  });
  console.log('\n📋 최종:', JSON.stringify(final));
  
  if (final.canvasTextLen > 500) {
    console.log('✅✅✅ 성공! 화면에 텍스트 표시됨!');
  } else {
    console.log('⚠️ 캔버스 표시 안 됨. 데이터는 저장됨.');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

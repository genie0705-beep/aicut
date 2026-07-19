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

const BLOCKS = [
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
  { type: 'paragraph', text: '✔️ 선크림·자외선 차단 영상 — 여름 필수, 병원 추천 신뢰도 UP', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '✔️ 다이어트·체형 관리 시즌 영상 — 여름 휴가 전 관리법, 환자 공감 UP', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '✔️ 원장님 브랜딩 숏폼 — 신뢰감 있는 전문가 이미지 각인', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '✔️ 시술 소개 60초 요약 — 궁금증 해소, 예약 전환율 UP', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '매주 2~3개 꾸준히 올리면 3개월 후 지역 내 최고 채널로 자리잡습니다.', style: { textAlign: 'center' } },
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
  { type: 'paragraph', text: '상반기 텍스트 마케팅에서 하반기에는 영상 마케팅을 추가해보세요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '직접 찍고, 전문가가 편집하는 가장 효율적인 병원 마케팅, 지금 시작하세요.', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '📞 카카오톡: https://pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '📧 이메일: master@aicut.co.kr', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '🌐 홈페이지: https://aicut.co.kr', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '', style: { textAlign: 'center' } },
  { type: 'paragraph', text: '#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠', style: { textAlign: 'center' } },
];

function buildTextHTML(blocks) {
  let html = '';
  blocks.forEach(b => {
    const t = b.text || '';
    if (b.type === 'heading2') {
      html += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><h2 style="text-align:center;">${t}</h2></div></div></div></div>`;
    } else if (b.type === 'paragraph') {
      const content = t || '<br>';
      html += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><p style="text-align:center;">${content}</p></div></div></div></div>`;
    }
  });
  return html;
}

function buildImageHTML(src, w, h, isRepresent) {
  return `<div class="se-component se-image"><div class="se-component-content"><div class="se-section se-section-image se-l-default se-section-align-center"><div class="se-module se-module-image"><img src="${src}" alt="" style="" class="se-image-resource" data-rotate="" data-proportion="true" data-width="${w}" data-height="${h}" width="${w}" height="${h}"></div></div></div></div>`;
}

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
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 완전 새로 시작...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');
  
  // 2. setDocumentData (text blocks)
  await f.evaluate((blocks) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.blocks = blocks;
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, BLOCKS);
  console.log('✅ 2/5 텍스트 데이터 설정 (', BLOCKS.length, '블록)');
  await f.waitForTimeout(500);
  
  // 3. 이미지 업로드 5장 (components에 저장됨)
  for (let i = 0; i < IMG_FILES.length; i++) {
    console.log(`📸 3-${i+1}/5: ${IMG_FILES[i]}`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) { await btn.evaluate(b => b.click()); console.log('  사진버튼 클릭'); }
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMG_FILES[i]); console.log('  업로드 8초...'); await f.waitForTimeout(8000); }
  }
  console.log('✅ 3/5 이미지 업로드 완료');
  
  // 4. 이미지 src 확인 (components에서)
  const imgData = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    return d.components?.filter(c => c.fileName).map(c => ({
      file: c.fileName,
      src: c.src || '',
      width: c.width,
      height: c.height,
      represent: c.represent,
    })) || [];
  });
  console.log('이미지 데이터:', imgData.length, '개');
  
  if (imgData.length < 5) {
    console.log('❌ 이미지가 5개 미만');
    process.exit(1);
  }
  
  // 5. Canvas HTML 주입 (텍스트 + 이미지 함께)
  // 텍스트 블록 사이에 이미지 배치: 
  // 섹션1 텍스트 → 이미지1 → 섹션2 텍스트 → 이미지2 → ... → 이미지5 → CTA
  const textHTML = buildTextHTML(BLOCKS);
  
  // 이미지를 각 섹션 사이에 끼워넣기
  const sectionMarkers = [
    { before: "📋 직접 찍고", imgIdx: 0 }, // image 1 after section 1
    { before: "✅ 의료광고", imgIdx: 1 },   // image 2 after section 2
    { before: "🎯 여름 시즌", imgIdx: 2 },  // image 3 after section 3
    { before: "📸 병원에 딱", imgIdx: 3 },  // image 4 after section 4
    { before: "🔥 하반기", imgIdx: 4 },      // image 5 (CTA) after section 5
  ];
  
  // 텍스트를 섹션별로 분할
  const sections = [];
  let remaining = textHTML;
  for (const marker of sectionMarkers) {
    const idx = remaining.indexOf(marker.before);
    if (idx >= 0) {
      sections.push({ text: remaining.substring(0, idx), imgIdx: marker.imgIdx });
      remaining = remaining.substring(idx);
    }
  }
  sections.push({ text: remaining, imgIdx: -1 });
  
  // 최종 HTML 조립
  let fullHTML = '';
  for (const sec of sections) {
    fullHTML += sec.text;
    if (sec.imgIdx >= 0 && sec.imgIdx < imgData.length) {
      const img = imgData[sec.imgIdx];
      fullHTML += buildImageHTML(img.src, img.width, img.height, img.represent);
    }
  }
  
  await f.evaluate((html) => {
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return;
    
    let wrap = canvas.querySelector('.se-components-wrap');
    if (!wrap) {
      wrap = document.createElement('article');
      wrap.className = 'se-components-wrap';
      canvas.prepend(wrap);
    }
    wrap.innerHTML = html;
  }, fullHTML);
  console.log('✅ 4/5 Canvas HTML 주입 (텍스트+이미지)');
  await f.waitForTimeout(500);
  
  // 6. 저장 (즉시 - React가 덮어쓰기 전에)
  const saved = await f.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) { btn.click(); return 'save clicked'; }
    return 'no save button';
  });
  console.log('💾 5/5 저장:', saved);
  await f.waitForTimeout(2000);
  
  // 7. 최종 확인
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    const blocks = d.blocks || [];
    const chars = blocks.reduce((a,b) => a + (b.text?.length||0), 0);
    const imgs = d.components?.filter(x => x.fileName) || [];
    const canvasImgs = c ? c.querySelectorAll('img').length : 0;
    return {
      blocks: blocks.length,
      chars,
      imgCompsPng: imgs.length,
      imgCompsAll: d.components?.length || 0,
      canvasTextLen: (c?.innerText || '').length,
      canvasImgs,
      canvasText: (c?.innerText || '').substring(0, 100),
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final, null, 2));
  
  if (final.canvasTextLen > 500 && final.canvasImgs >= 5) {
    console.log('\n✅✅✅ 완벽 성공! 텍스트+이미지 모두 캔버스 표시!');
  } else {
    console.log(`\n⚠️ 상태: 텍스트=${final.canvasTextLen}자 이미지=${final.canvasImgs}개`);
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

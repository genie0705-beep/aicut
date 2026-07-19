const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
const IMGS = [
  'aicut_blog_hospital_main.png',
  'aicut_blog_hospital_01.png',
  'aicut_blog_hospital_02.png',
  'aicut_blog_hospital_03.png',
  'aicut_blog_hospital_cta.png',
];

function uid() {
  return 'SE-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/** SE4 native format paragraph builder */
function makePara(text, options = {}) {
  const { isH2 = false, boldParts = [], alignCenter = true } = options;
  
  // 문단 생성
  const para = {
    id: uid(),
    '@ctype': isH2 ? 'heading2' : 'paragraph',
    nodes: [],
    style: alignCenter ? { textAlign: 'center' } : undefined,
  };
  
  if (boldParts.length > 0) {
    // boldParts: [{ text: '일반', bold: false }, { text: '강조', bold: true }]
    para.nodes = boldParts.map(p => ({
      id: uid(),
      value: p.text,
      '@ctype': 'textNode',
      marks: p.bold ? [{ id: uid(), '@ctype': 'bold' }] : undefined,
    }));
  } else {
    para.nodes = [{
      id: uid(),
      value: text || '',
      '@ctype': 'textNode',
    }];
  }
  
  return para;
}

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
  
  // 수정 모드: 발행된 포스트를 에디터로 열기
  await page.goto('https://blog.naver.com/aicut/224348766674?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 수정 모드 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌ SE4 로드 실패. 새 에디터로 진행'); 
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
    const f2 = await waitForSE(page);
    if (!f2) { console.log('❌'); process.exit(1); }
    await doWork(f2);
  } else {
    await doWork(f);
  }
}

async function doWork(f) {
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(1000);

  // 제목 설정
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목 설정');

  // 텍스트 + 이미지 교차 배치를 위한 완전한 데이터 생성
  // SE4 네이티브 형식으로 H2, Bold, 정렬이 모두 포함된 text component
  
  const paragraphs = [];
  
  // Section 1
  paragraphs.push(makePara("☀️ 요즘 병원 마케팅, '숏폼'이 전부다", {isH2: true}));
  paragraphs.push(makePara('"원장님, 인스타그램 하세요?"'));
  paragraphs.push(makePara('요즘 병원·의원에 가면 꼭 듣는 질문입니다.'));
  paragraphs.push(makePara('환자들이 병원을 고를 때'));
  paragraphs.push(makePara('', {boldParts: [
    {text:'인스타그램이나 유튜브 ', bold:false},
    {text:'숏폼', bold:true},
    {text:'을 먼저 본다고 해요.', bold:false},
  ]}));
  paragraphs.push(makePara('릴스·쇼츠에 병원 소개 영상을 올리면'));
  paragraphs.push(makePara('', {boldParts: [
    {text:'일반 텍스트보다 문의율이 ', bold:false},
    {text:'3배 이상', bold:true},
    {text:' 높습니다.', bold:false},
  ]}));
  paragraphs.push(makePara('', {boldParts: [
    {text:'하지만 문제는 ', bold:false},
    {text:'영상 찍고 편집하는 게 너무 어렵다', bold:true},
    {text:'는 거예요.', bold:false},
  ]}));
  paragraphs.push(makePara('', {boldParts: [
    {text:'간호사님한테 폰으로 찍어달라 하기도 애매하고, ', bold:false},
    {text:'의료광고 규제', bold:true},
    {text:' 때문에 겁나고요.', bold:false},
  ]}));
  paragraphs.push(makePara('그래서 준비했습니다.'));
  paragraphs.push(makePara('', {boldParts: [
    {text:'피부과·치과·한의원·성형외과', bold:true},
    {text:'에서 바로 써먹을 수 있는 ', bold:false},
    {text:'영상 마케팅 전략', bold:true},
    {text:'을 알려드릴게요.', bold:false},
  ]}));
  paragraphs.push(makePara('', {isH2: false, boldParts:[]})); // empty line

  // Section 2
  paragraphs.push(makePara("📋 직접 찍고 직접 편집하면 생기는 일", {isH2: true}));
  paragraphs.push(makePara('', {boldParts: [{text:'많은 병원 원장님들, ', bold:false},{text:'영상 마케팅', bold:true},{text:' 시작했다가 금방 포기합니다.', bold:false}]}));
  paragraphs.push(makePara('그 이유, 알고 계신가요?'));
  paragraphs.push(makePara('', {boldParts: [{text:'첫째', bold:true},{text:', 촬영 시간이 너무 낭비됩니다.', bold:false}]}));
  paragraphs.push(makePara('원장님이 직접 영상 찍으려면 진료 시간 내고 스크립트 짜야 해요.'));
  paragraphs.push(makePara('', {boldParts: [{text:'둘째', bold:true},{text:', 편집 프로그램이 너무 어렵습니다.', bold:false}]}));
  paragraphs.push(makePara('프리미어 프로나 파이널 컷 배우려면 최소 3개월 걸려요.'));
  paragraphs.push(makePara('', {boldParts: [{text:'셋째', bold:true},{text:', 의료광고 규제를 다 외우기 어렵습니다.', bold:false}]}));
  paragraphs.push(makePara('식약처 심의, 네이버 정책까지 생각하면 영상 하나 올리기도 부담스러워요.'));
  paragraphs.push(makePara('', {boldParts: [{text:'이런 고민, ', bold:false},{text:'에이컷', bold:true},{text:'이 다 해결해드립니다.', bold:false}]}));
  paragraphs.push(makePara('')); // empty

  // Section 3
  paragraphs.push(makePara("✅ 의료광고 규제, 전문 에디터가 체크합니다", {isH2: true}));
  paragraphs.push(makePara('"의료광고, 영상 올려도 돼요?"'));
  paragraphs.push(makePara('네, 가능합니다.'));
  paragraphs.push(makePara('', {boldParts: [{text:'단, ', bold:false},{text:'몇 가지 규정', bold:true},{text:'을 꼭 지켜야 해요.', bold:false}]}));
  paragraphs.push(makePara('체험담·효과를 과장하지 않을 것'));
  paragraphs.push(makePara("'확실한 효과'처럼 단정적 표현 금지"));
  paragraphs.push(makePara('치료 전·후 사진은 진실하게 표시'));
  paragraphs.push(makePara('의료법·약사법·식품위생법 준수 내용만'));
  paragraphs.push(makePara('처음엔 하나하나 신경 쓰이는 게 정상입니다.'));
  paragraphs.push(makePara('', {boldParts: [{text:'하지만 ', bold:false},{text:'경험이 많은 편집 에디터', bold:true},{text:'가 있으면 규제를 지키면서도 마케팅 효과를 극대화할 수 있어요.', bold:false}]}));
  paragraphs.push(makePara('', {boldParts: [{text:'에이컷', bold:true},{text:'은 ', bold:false},{text:'병원 영상 편집', bold:true},{text:' 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.', bold:false}]}));
  paragraphs.push(makePara('')); // empty

  // Section 4
  paragraphs.push(makePara("🎯 여름 시즌, 피부과·의원 마케팅 전략", {isH2: true}));
  paragraphs.push(makePara('', {boldParts: [{text:'7월 중순, 무더위 절정. 피부과·의원에 딱 맞는 ', bold:false},{text:'여름 시즌 콘텐츠', bold:true},{text:'를 소개합니다.', bold:false}]}));
  paragraphs.push(makePara('✔️ 선크림·자외선 차단 영상 - 여름 필수, 병원 추천 신뢰도 UP'));
  paragraphs.push(makePara('✔️ 다이어트·체형 관리 영상 - 여름 휴가 전 관리법, 환자 공감 UP'));
  paragraphs.push(makePara('✔️ 원장님 브랜딩 숏폼 - 신뢰감 있는 전문가 이미지 각인'));
  paragraphs.push(makePara('✔️ 시술 소개 60초 요약 - 궁금증 해소, 예약 전환율 UP'));
  paragraphs.push(makePara('', {boldParts: [{text:'매주 2~3개 꾸준히 올리면 ', bold:false},{text:'3개월 후 지역 내 최고 채널', bold:true},{text:'로 자리잡습니다.', bold:false}]}));
  paragraphs.push(makePara('실제로 저희가 편집해드리는 피부과 원장님께서'));
  paragraphs.push(makePara('"영상 올린 후 문의가 3배 늘었어요"라고 하셨습니다.'));
  paragraphs.push(makePara('', {boldParts: [{text:'이게 바로 ', bold:false},{text:'영상 마케팅', bold:true},{text:'의 힘입니다.', bold:false}]}));
  paragraphs.push(makePara('')); // empty

  // Section 5
  paragraphs.push(makePara("📸 병원에 딱 맞는 영상, 어떻게 만드나요?", {isH2: true}));
  paragraphs.push(makePara('에이컷의 병원 영상 작업 프로세스입니다.'));
  paragraphs.push(makePara('', {boldParts: [{text:'STEP 1:', bold:true},{text:' 원장님 촬영 영상 전송 - 핸드폰 3~5분, 대본 불필요', bold:false}]}));
  paragraphs.push(makePara('', {boldParts: [{text:'STEP 2:', bold:true},{text:' 에이컷 에디터가 편집 완료 - 숏폼 맞춤, 규제 체크', bold:false}]}));
  paragraphs.push(makePara('', {boldParts: [{text:'STEP 3:', bold:true},{text:' 검토 후 무제한 수정 - 추가 비용 없음', bold:false}]}));
  paragraphs.push(makePara('', {boldParts: [{text:'STEP 4:', bold:true},{text:' 완료 영상 다운로드 후 게시 - 원장님은 올리기만 하면 끝!', bold:false}]}));
  paragraphs.push(makePara('복잡한 편집 프로그램, 이제 안녕입니다.'));
  paragraphs.push(makePara('')); // empty

  // Section 6
  paragraphs.push(makePara("🔥 하반기 마케팅, 준비된 병원이 이깁니다", {isH2: true}));
  paragraphs.push(makePara('벌써 7월입니다.'));
  paragraphs.push(makePara('', {boldParts: [{text:'하반기 병원 마케팅', bold:true},{text:' 전략, 세워두셨나요?', bold:false}]}));
  paragraphs.push(makePara('', {boldParts: [{text:'상반기 텍스트 마케팅에서 ', bold:false},{text:'하반기에는 영상 마케팅', bold:true},{text:'을 추가해보세요.', bold:false}]}));
  paragraphs.push(makePara('영상 하나가 환자의 마음을 움직입니다.'));
  paragraphs.push(makePara('', {boldParts: [{text:'직접 찍고, 전문가가 편집하는 ', bold:false},{text:'가장 효율적인 병원 마케팅', bold:true},{text:', 지금 시작하세요.', bold:false}]}));
  paragraphs.push(makePara('문의는 아래 연락처로 편하게 주세요.'));
  paragraphs.push(makePara('')); // empty

  // CTA
  paragraphs.push(makePara('📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'));
  paragraphs.push(makePara('📧 이메일: master@aicut.co.kr'));
  paragraphs.push(makePara('🌐 홈페이지: https://aicut.co.kr'));
  paragraphs.push(makePara(''));

  // 해시태그
  paragraphs.push(makePara('#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'));

  // text component 생성
  const textComp = {
    id: uid(),
    layout: 'default',
    value: paragraphs,
    '@ctype': 'text',
  };

  // 이미지 업로드
  for (let i = 0; i < IMGS.length; i++) {
    console.log(`📸 이미지 ${i+1}/5`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMGS[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 이미지 업로드 완료');

  // components 저장
  const comps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });

  const newComps = [textComp, ...comps.filter(c => c['@ctype'] !== 'text')];

  // blocks도 함께 설정
  const blocks = paragraphs.map(p => ({
    type: p['@ctype'] === 'heading2' ? 'heading2' : 'paragraph',
    text: p.nodes.map(n => n.value).join(''),
    style: p.style || { textAlign: 'center' },
  }));

  await f.evaluate(({comps, blocks}) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.components = comps;
    data.document.blocks = blocks;
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, {comps: newComps, blocks});

  console.log(`✅ text component 설정: ${paragraphs.length}문단`);

  // 제목 재설정
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);

  // 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 저장 완료');
  await f.waitForTimeout(2000);

  // 검증
  const verify = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const tc = d.components?.find(c => c['@ctype'] === 'text');
    let h2 = 0, bold = 0, chars = 0, center = 0;
    if (tc) {
      tc.value.forEach(p => {
        if (p['@ctype'] === 'heading2') h2++;
        if (p.style?.textAlign === 'center') center++;
        p.nodes?.forEach(n => {
          if (n.value) chars += n.value.length;
          if (n.marks?.some(m => m['@ctype'] === 'bold')) bold++;
        });
      });
    }
    return {
      title: ed.getDocumentTitle(),
      paragraphs: tc?.value?.length || 0,
      h2,
      bold,
      chars,
      centerAligned: center,
      images: d.components?.filter(c => c.fileName).length || 0,
    };
  });

  console.log('\n📋 검증:', JSON.stringify(verify, null, 2));
  
  const allGood = verify.h2 >= 6 && verify.bold >= 15 && verify.centerAligned > 50;
  console.log(`\n${allGood ? '✅✅✅ 모든 포맷팅 적용 완료!' : '⚠️ 일부 누락'}`);
  console.log('다시 발행 테스트 해보세요!');
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

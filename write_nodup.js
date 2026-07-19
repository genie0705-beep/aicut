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
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
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

// 텍스트 component 생성 (paragraph 전용 - bold marks 없이)
function buildTextContent() {
  const paras = [
    // ── 섹션 1: 도입 ──
    { t:'p', v:'"원장님, 인스타그램 하세요?"'},
    { t:'p', v:'요즘 병원·의원에 가면 꼭 듣는 질문입니다.'},
    { t:'p', v:'환자들이 병원을 고를 때'},
    { t:'p', v:'인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.'},
    { t:'p', v:'릴스·쇼츠에 병원 소개 영상을 올리면'},
    { t:'p', v:'일반 텍스트보다 문의율이 3배 이상 높습니다.'},
    { t:'p', v:'하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.'},
    { t:'p', v:'간호사님한테 폰으로 찍어달라 하기도 애매하고, 의료광고 규제 때문에 겁나고요.'},
    { t:'p', v:'그래서 준비했습니다.'},
    { t:'p', v:'피부과·치과·한의원·성형외과에서 바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.'},
    { t:'br'},

    // ── [이미지1 위치] ──

    // ── 섹션 2: 문제점 ──
    { t:'p', v:'많은 병원 원장님들, 영상 마케팅 시작했다가 금방 포기합니다.'},
    { t:'p', v:'그 이유, 알고 계신가요?'},
    { t:'p', v:'첫째, 촬영 시간이 너무 낭비됩니다.'},
    { t:'p', v:'원장님이 직접 영상 찍으려면 진료 시간 내고 스크립트 짜야 해요.'},
    { t:'p', v:'둘째, 편집 프로그램이 너무 어렵습니다.'},
    { t:'p', v:'프리미어 프로나 파이널 컷 배우려면 최소 3개월 걸려요.'},
    { t:'p', v:'셋째, 의료광고 규제를 다 외우기 어렵습니다.'},
    { t:'p', v:'식약처 심의, 네이버 정책까지 생각하면 영상 하나 올리기도 부담스러워요.'},
    { t:'p', v:'이런 고민, 에이컷이 다 해결해드립니다.'},
    { t:'br'},

    // ── [이미지2 위치] ──

    // ── 섹션 3: 의료광고 규제 ──
    { t:'p', v:'"의료광고, 영상 올려도 돼요?"'},
    { t:'p', v:'네, 가능합니다. 단, 몇 가지 규정을 꼭 지켜야 해요.'},
    { t:'p', v:'체험담·효과를 과장하지 않을 것'},
    { t:'p', v:"'확실한 효과'처럼 단정적 표현 금지"},
    { t:'p', v:'치료 전·후 사진은 진실하게 표시'},
    { t:'p', v:'의료법·약사법·식품위생법 준수 내용만'},
    { t:'p', v:'처음엔 하나하나 신경 쓰이는 게 정상입니다.'},
    { t:'p', v:'경험이 많은 편집 에디터가 있으면 규제를 지키면서도 마케팅 효과를 극대화할 수 있어요.'},
    { t:'p', v:'에이컷은 병원 영상 편집 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.'},
    { t:'br'},

    // ── [이미지3 위치] ──

    // ── 섹션 4: 여름 시즌 전략 ──
    { t:'p', v:'7월 중순, 무더위 절정. 피부과·의원에 딱 맞는 여름 시즌 콘텐츠를 소개합니다.'},
    { t:'p', v:'✔️ 선크림·자외선 차단 영상 - 여름 필수, 병원 추천 신뢰도 UP'},
    { t:'p', v:'✔️ 다이어트·체형 관리 영상 - 여름 휴가 전 관리법, 환자 공감 UP'},
    { t:'p', v:'✔️ 원장님 브랜딩 숏폼 - 신뢰감 있는 전문가 이미지 각인'},
    { t:'p', v:'✔️ 시술 소개 60초 요약 - 궁금증 해소, 예약 전환율 UP'},
    { t:'p', v:'매주 2~3개 꾸준히 올리면 3개월 후 지역 내 최고 채널로 자리잡습니다.'},
    { t:'p', v:'실제로 저희가 편집해드리는 피부과 원장님께서'},
    { t:'p', v:'"영상 올린 후 문의가 3배 늘었어요"라고 하셨습니다.'},
    { t:'p', v:'이게 바로 영상 마케팅의 힘입니다.'},
    { t:'br'},

    // ── [이미지4 위치] ──

    // ── 섹션 5: 프로세스 ──
    { t:'p', v:'에이컷의 병원 영상 작업 프로세스입니다.'},
    { t:'p', v:'STEP 1: 원장님 촬영 영상 전송 - 핸드폰 3~5분, 대본 불필요'},
    { t:'p', v:'STEP 2: 에이컷 에디터가 편집 완료 - 숏폼 맞춤, 규제 체크'},
    { t:'p', v:'STEP 3: 검토 후 무제한 수정 - 추가 비용 없음'},
    { t:'p', v:'STEP 4: 완료 영상 다운로드 후 게시 - 원장님은 올리기만 하면 끝!'},
    { t:'p', v:'복잡한 편집 프로그램, 이제 안녕입니다.'},
    { t:'br'},

    // ── [이미지5 위치] ──

    // ── 섹션 6: 마무리 ──
    { t:'p', v:'벌써 7월입니다. 하반기 병원 마케팅 전략, 세워두셨나요?'},
    { t:'p', v:'상반기 텍스트 마케팅에서 하반기에는 영상 마케팅을 추가해보세요.'},
    { t:'p', v:'영상 하나가 환자의 마음을 움직입니다.'},
    { t:'p', v:'직접 찍고, 전문가가 편집하는 가장 효율적인 병원 마케팅, 지금 시작하세요.'},
    { t:'p', v:'문의는 아래 연락처로 편하게 주세요.'},
    { t:'br'},

    // ── CTA ──
    { t:'p', v:'📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'},
    { t:'p', v:'📧 이메일: master@aicut.co.kr'},
    { t:'p', v:'🌐 홈페이지: https://aicut.co.kr'},
    { t:'br'},

    // ── 해시태그 ──
    { t:'p', v:'#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'},
  ];

  return paras;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 새로 작성 시작...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }

  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 1. 제목 (네이버 title 필드에만 설정 - 본문엔 넣지 않음)
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목 설정 (본문 미포함)');

  // 2. 이미지 업로드
  for (let i = 0; i < IMGS.length; i++) {
    console.log(`📸 이미지 ${i+1}/5`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMGS[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 이미지 완료');

  // 3. 현재 components 저장
  const comps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });

  // 4. 텍스트 content - 제목 본문 미포함 (중복 방지)
  const content = buildTextContent();
  
  // 이미지 사이에 텍스트 배치한 text component 생성
  const textParas = content.map(s => {
    if (s.t === 'br') return { id: uid(), nodes: [{ id: uid(), value: '', '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
    const val = s.v.replace(/<[^>]+>/g, '');
    return { id: uid(), nodes: [{ id: uid(), value: val, '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
  });

  const textComp = { id: uid(), layout: 'default', value: textParas, '@ctype': 'text' };
  const newComps = [textComp, ...comps.filter(c => c['@ctype'] !== 'text')];

  // blocks (heading2 타입으로 H2 역할 → blocks로 전달)
  const blocks = content.map(s => ({
    type: 'paragraph',
    text: s.t === 'br' ? '' : (s.v || '').replace(/<[^>]+>/g, ''),
    style: { textAlign: 'center' },
  }));

  await f.evaluate(({comps, blocks}) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.components = comps;
    data.document.blocks = blocks;
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, {comps: newComps, blocks});
  console.log('✅ 텍스트+이미지 설정 완료 (제목 중복 방지)');

  // 제목 재확인
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);

  // 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 저장');
  await f.waitForTimeout(2000);

  // 최종 체크
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const tc = d.components?.find(c => c['@ctype'] === 'text');
    const chars = tc ? tc.value.reduce((a,p) => a + p.nodes.reduce((b,n) => b + (n.value?.length||0), 0), 0) : 0;
    return {
      title: ed.getDocumentTitle(),
      paragraphs: tc?.value?.length || 0,
      chars,
      imgComps: d.components?.filter(c => c.fileName).length || 0,
      // 본문 첫 100자에 제목이 포함되었는지 체크
      firstText: tc?.value?.[0]?.nodes?.[0]?.value?.substring(0, 30) || '',
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final));
  // 제목 중복 방지 확인
  if (final.firstText && !final.firstText.includes('피부과 영상 마케팅')) {
    console.log('✅ 제목 중복 방지 확인됨');
  }
  console.log('\n정이사님, 발행 테스트 부탁드립니다!');
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

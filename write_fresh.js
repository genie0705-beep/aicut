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

// Reference post 스타일: 공감형 + 짧은 문단 + 이모지 헤더
const SECTIONS = [
  // ── 섹션 1 ──
  {t:'h2', v:"☀️ 요즘 병원 마케팅, '숏폼'이 전부다"},
  {t:'p', v:'"원장님, 인스타그램 하세요?"'},
  {t:'p', v:'요즘 병원·의원에 가면 꼭 듣는 질문입니다.'},
  {t:'p', v:'환자들이 병원을 고를 때'},
  {t:'p', v:'인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.'},
  {t:'p', v:'릴스·쇼츠에 병원 소개 영상을 올리면'},
  {t:'p', v:'일반 텍스트보다 문의율이 3배 이상 높습니다.'},
  {t:'p', v:'하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.'},
  {t:'p', v:'간호사님한테 폰으로 찍어달라 하기도 애매하고,'},
  {t:'p', v:'의료광고 규제 때문에 뭐라도 잘못 나갈까 겁나고요.'},
  {t:'p', v:'그래서 준비했습니다.'},
  {t:'p', v:'피부과·치과·한의원·성형외과에서'},
  {t:'p', v:'바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.'},
  {t:'br'},
  // ── 섹션 2 ──
  {t:'h2', v:"📋 직접 찍고 직접 편집하면 생기는 일"},
  {t:'p', v:'많은 병원 원장님들, 영상 마케팅 시작했다가'},
  {t:'p', v:'금방 포기하는 이유 알고 계신가요?'},
  {t:'p', v:'첫째, 촬영 시간이 너무 낭비됩니다.'},
  {t:'p', v:'원장님이 직접 영상 찍으려면'},
  {t:'p', v:'진료 시간 내고 스크립트 짜야 해요.'},
  {t:'p', v:'둘째, 편집 프로그램이 너무 어렵습니다.'},
  {t:'p', v:'프리미어 프로나 파이널 컷,'},
  {t:'p', v:'배우려면 최소 3개월은 걸려요.'},
  {t:'p', v:'셋째, 의료광고 규제를 다 외우기 어렵습니다.'},
  {t:'p', v:'식약처 심의, 네이버 정책까지 생각하면'},
  {t:'p', v:'영상 하나 올리기도 부담스러워요.'},
  {t:'p', v:'이런 고민, 저희가 다 해결해드립니다.'},
  {t:'br'},
  // ── 섹션 3 ──
  {t:'h2', v:"✅ 의료광고 규제, 전문 에디터가 체크합니다"},
  {t:'p', v:'"의료광고, 영상 올려도 돼요?"'},
  {t:'p', v:'네, 가능합니다.'},
  {t:'p', v:'단, 몇 가지 규정을 꼭 지켜야 해요.'},
  {t:'p', v:'체험담·효과를 과장하지 않을 것'},
  {t:'p', v:"'확실한 효과'처럼 단정적 표현 금지"},
  {t:'p', v:'치료 전·후 사진은 진실하게 표시'},
  {t:'p', v:'의료법·약사법·식품위생법 준수 내용만'},
  {t:'p', v:'처음엔 하나하나 신경 쓰이는 게 정상입니다.'},
  {t:'p', v:'경험이 많은 편집 에디터가 있으면'},
  {t:'p', v:'규제 완벽 준수 + 마케팅 효과 극대화,'},
  {t:'p', v:'두 마리 토끼를 다 잡을 수 있어요.'},
  {t:'p', v:'에이컷은 병원 영상 편집 전문 에디터가'},
  {t:'p', v:'의료광고 규제를 모두 숙지하고 작업합니다.'},
  {t:'br'},
  // ── 섹션 4 ──
  {t:'h2', v:"🎯 여름 시즌, 피부과·의원 마케팅 전략"},
  {t:'p', v:'7월 중순, 무더위가 절정인 지금.'},
  {t:'p', v:'피부과·의원에 딱 맞는 여름 시즌 콘텐츠,'},
  {t:'p', v:'지금 준비해야 하는 이유를 알려드릴게요.'},
  {t:'p', v:'✔️ 선크림·자외선 차단 영상'},
  {t:'p', v:'여름 필수 아이템, 병원 추천 = 신뢰도 UP'},
  {t:'p', v:'✔️ 다이어트·체형 관리 시즌 영상'},
  {t:'p', v:'여름 휴가 전 관리법, 환자 공감 얻기 좋음'},
  {t:'p', v:'✔️ 원장님 브랜딩 숏폼'},
  {t:'p', v:'신뢰감 있는 전문가 이미지, 숏폼으로 각인'},
  {t:'p', v:'✔️ 시술 소개 60초 요약'},
  {t:'p', v:'궁금증 해소, 예약 전환율 UP'},
  {t:'p', v:'매주 2~3개 꾸준히 올리면'},
  {t:'p', v:'3개월 후 지역 내 최고 채널로 자리잡습니다.'},
  {t:'br'},
  // ── 섹션 5 ──
  {t:'h2', v:"📸 병원에 딱 맞는 영상, 어떻게 만드나요?"},
  {t:'p', v:'에이컷의 병원 영상 작업 프로세스입니다.'},
  {t:'p', v:'STEP 1: 원장님 촬영 영상 전송'},
  {t:'p', v:'핸드폰 3~5분, 대본도 콘티도 필요 없어요.'},
  {t:'p', v:'STEP 2: 에이컷 에디터가 편집 완료'},
  {t:'p', v:'1~2일 내 숏폼 2~3개로 맞춤 제작'},
  {t:'p', v:'의료광고 규제 체크는 기본입니다.'},
  {t:'p', v:'STEP 3: 검토 후 무제한 수정'},
  {t:'p', v:'마음에 들 때까지 OK, 추가 비용 없음'},
  {t:'p', v:'STEP 4: 완료 영상 다운로드 후 게시'},
  {t:'p', v:'원장님은 그냥 올리기만 하면 끝!'},
  {t:'p', v:'복잡한 편집 프로그램, 이제 안녕입니다.'},
  {t:'br'},
  // ── 섹션 6 ──
  {t:'h2', v:"🔥 하반기 마케팅, 준비된 병원이 이깁니다"},
  {t:'p', v:'벌써 7월입니다.'},
  {t:'p', v:'하반기 병원 마케팅 전략, 세워두셨나요?'},
  {t:'p', v:'상반기 텍스트 위주 마케팅에서,'},
  {t:'p', v:'하반기에는 영상 마케팅을 추가해보세요.'},
  {t:'p', v:'영상 하나가 환자의 마음을 움직입니다.'},
  {t:'p', v:'직접 찍고, 전문가가 편집하는'},
  {t:'p', v:'가장 효율적인 병원 마케팅,'},
  {t:'p', v:'지금 시작하세요.'},
  {t:'p', v:'문의는 아래 연락처로 편하게 주세요.'},
  {t:'br'},
  // ── CTA ──
  {t:'p', v:'📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'},
  {t:'p', v:'📧 이메일: master@aicut.co.kr'},
  {t:'p', v:'🌐 홈페이지: https://aicut.co.kr'},
  {t:'br'},
  // ── 해시태그 ──
  {t:'p', v:'#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'},
];

function uid() {
  return 'SE-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/** SE4 text component 생성 */
function buildTextComponent(sections) {
  const paragraphs = sections.map(s => {
    const nid = uid();
    const tid = uid();
    if (s.t === 'br') {
      return { id: nid, nodes: [{ id: tid, value: '', '@ctype': 'textNode' }], '@ctype': 'paragraph' };
    }
    if (s.t === 'h2') {
      return { id: nid, nodes: [{ id: tid, value: s.v, '@ctype': 'textNode' }], '@ctype': 'heading2', style: { textAlign: 'center' } };
    }
    return { id: nid, nodes: [{ id: tid, value: s.v, '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
  });
  
  return { id: uid(), layout: 'default', value: paragraphs, '@ctype': 'text' };
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
  return null;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 새 탄생...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  // 팝업 정리
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목 설정');

  // 2. 이미지 업로드
  for (let i = 0; i < IMGS.length; i++) {
    console.log(`📸 2/5 이미지 ${i+1}/5`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMGS[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 2/5 이미지 완료');

  // 3. 현재 components 저장
  const comps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });
  console.log(`components: ${comps.length}개`);

  // 4. text component 생성 + components 교체
  const textComp = buildTextComponent(SECTIONS);
  const newComps = [textComp, ...comps.filter(c => c['@ctype'] !== 'text')];
  
  const chars = SECTIONS.reduce((a, s) => a + (s.v?.length || 0), 0);
  const h2Count = SECTIONS.filter(s => s.t === 'h2').length;
  
  await f.evaluate(({tc, comps, blocks}) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.components = comps;
    data.document.blocks = blocks;
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, {
    tc: textComp,
    comps: newComps,
    blocks: SECTIONS.map(s => ({
      type: s.t === 'h2' ? 'heading2' : 'paragraph',
      text: s.t === 'br' ? '' : (s.v || ''),
      style: { textAlign: 'center' },
    })),
  });
  console.log(`✅ 3/5 본문 적용: ${SECTIONS.length}문단 / ${chars}자 / H2 ${h2Count}개`);

  // 5. 제목 다시 확인
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  
  // 6. 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 4/5 저장');
  await f.waitForTimeout(2000);

  // 7. 최종 확인
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const comps = d.components || [];
    const tc = comps.find(c => c['@ctype'] === 'text');
    const imgs = comps.filter(c => c.fileName);
    let c = 0, p = 0, h2 = 0;
    if (tc) {
      p = tc.value?.length || 0;
      tc.value?.forEach(para => {
        if (para['@ctype'] === 'heading2') h2++;
        para.nodes?.forEach(n => { if (n.value) c += n.value.length; });
      });
    }
    const allText = tc ? tc.value.map(x => x.nodes.map(n => n.value).join('')).join(' ') : '';
    return {
      title: ed.getDocumentTitle(),
      textComponent: `✅ ${p}문단 / ${c}자 / H2 ${h2}개`,
      images: `${imgs.length}장`,
      imgFiles: imgs.map(x => x.fileName),
      cta_kakao: allText.includes('pf.kakao.com'),
      cta_email: allText.includes('master@aicut.co.kr'),
      cta_web: allText.includes('aicut.co.kr'),
      hashTags: (allText.match(/#/g) || []).length,
      캔버스: document.querySelector('.se-canvas')?.innerText?.substring(0,50) || '',
    };
  });
  
  console.log('\n🎯 최종 결과:');
  console.log(`📌 제목: ${final.title}`);
  console.log(`📝 ${final.textComponent}`);
  console.log(`🖼️ ${final.images}`);
  final.imgFiles.forEach(f => console.log(`   ${f}`));
  console.log(`🏷️ 해시태그 ${final.hashTags}개`);
  console.log(`📧 CTA: ${final.cta_kakao ? '✅' : '❌'}카톡 ${final.cta_email ? '✅' : '❌'}메일 ${final.cta_web ? '✅' : '❌'}홈페이지`);
  console.log(`\n✅✅✅ 완전 새로 작성 완료!`);
  console.log(`정이사님, 검토 후 "발행해"라고 말씀해주세요!`);
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

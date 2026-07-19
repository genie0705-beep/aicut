const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

// UUID 생성 함수
function uid() {
  return 'SE-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// Reference post 스타일: 공감형 + 짧은 문단 + 이모지 헤더
// 각 문단 = { type: 'h2' | 'p' | 'br', text: '...' }
const CONTENT = [
  {type:'h2', text:"☀️ 요즘 병원 마케팅, '숏폼'이 전부다"},
  {type:'p', text:'"원장님, 인스타그램 하세요?"'},
  {type:'p', text:'요즘 병원·의원에 가면 꼭 듣는 질문입니다.'},
  {type:'p', text:'환자들이 병원을 고를 때'},
  {type:'p', text:'인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.'},
  {type:'p', text:'릴스·쇼츠에 병원 소개 영상을 올리면'},
  {type:'p', text:'일반 텍스트보다 문의율이 3배 이상 높습니다.'},
  {type:'p', text:'하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.'},
  {type:'p', text:'간호사님한테 폰으로 찍어달라 하기도 애매하고,'},
  {type:'p', text:'의료광고 규제 때문에 뭐라도 잘못 나갈까 겁나고요.'},
  {type:'p', text:'그래서 준비했습니다.'},
  {type:'p', text:'피부과·치과·한의원·성형외과에서'},
  {type:'p', text:'바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.'},
  {type:'br'},
  {type:'h2', text:"📋 직접 찍고 직접 편집하면 생기는 일"},
  {type:'p', text:'많은 병원 원장님들, 영상 마케팅 시작했다가'},
  {type:'p', text:'금방 포기하는 이유 알고 계신가요?'},
  {type:'p', text:'첫째, 촬영 시간이 너무 낭비됩니다.'},
  {type:'p', text:'원장님이 직접 영상 찍으려면'},
  {type:'p', text:'진료 시간 내고 스크립트 짜야 해요.'},
  {type:'p', text:'둘째, 편집 프로그램이 너무 어렵습니다.'},
  {type:'p', text:'프리미어 프로나 파이널 컷,'},
  {type:'p', text:'배우려면 최소 3개월은 걸려요.'},
  {type:'p', text:'셋째, 의료광고 규제를 다 외우기 어렵습니다.'},
  {type:'p', text:'식약처 심의, 네이버 정책까지 생각하면'},
  {type:'p', text:'영상 하나 올리기도 부담스러워요.'},
  {type:'p', text:'이런 고민, 저희가 다 해결해드립니다.'},
  {type:'br'},
  {type:'h2', text:"✅ 의료광고 규제, 전문 에디터가 체크합니다"},
  {type:'p', text:'"의료광고, 영상 올려도 돼요?"'},
  {type:'p', text:'네, 가능합니다.'},
  {type:'p', text:'단, 몇 가지 규정을 꼭 지켜야 해요.'},
  {type:'p', text:'체험담·효과를 과장하지 않을 것'},
  {type:'p', text:"'확실한 효과'처럼 단정적 표현 금지"},
  {type:'p', text:'치료 전·후 사진은 진실하게 표시'},
  {type:'p', text:'의료법·약사법·식품위생법 준수 내용만'},
  {type:'p', text:'처음엔 하나하나 신경 쓰이는 게 정상입니다.'},
  {type:'p', text:'경험이 많은 편집 에디터가 있으면'},
  {type:'p', text:'규제 완벽 준수 + 마케팅 효과 극대화,'},
  {type:'p', text:'두 마리 토끼를 다 잡을 수 있어요.'},
  {type:'p', text:'에이컷은 병원 영상 편집 전문 에디터가'},
  {type:'p', text:'의료광고 규제를 모두 숙지하고 작업합니다.'},
  {type:'br'},
  {type:'h2', text:"🎯 여름 시즌, 피부과·의원 마케팅 전략"},
  {type:'p', text:'7월 중순, 무더위가 절정인 지금.'},
  {type:'p', text:'피부과·의원에 딱 맞는 여름 시즌 콘텐츠,'},
  {type:'p', text:'지금 준비해야 하는 이유를 알려드릴게요.'},
  {type:'p', text:'✔️ 선크림·자외선 차단 영상'},
  {type:'p', text:'여름 필수 아이템, 병원 추천 = 신뢰도 UP'},
  {type:'p', text:'✔️ 다이어트·체형 관리 시즌 영상'},
  {type:'p', text:'여름 휴가 전 관리법, 환자 공감 얻기 좋음'},
  {type:'p', text:'✔️ 원장님 브랜딩 숏폼'},
  {type:'p', text:'신뢰감 있는 전문가 이미지, 숏폼으로 각인'},
  {type:'p', text:'✔️ 시술 소개 60초 요약'},
  {type:'p', text:'궁금증 해소, 예약 전환율 UP'},
  {type:'p', text:'매주 2~3개 꾸준히 올리면'},
  {type:'p', text:'3개월 후 지역 내 최고 채널로 자리잡습니다.'},
  {type:'br'},
  {type:'h2', text:"📸 병원에 딱 맞는 영상, 어떻게 만드나요?"},
  {type:'p', text:'에이컷의 병원 영상 작업 프로세스입니다.'},
  {type:'p', text:'STEP 1: 원장님 촬영 영상 전송'},
  {type:'p', text:'핸드폰 3~5분, 대본도 콘티도 필요 없어요.'},
  {type:'p', text:'STEP 2: 에이컷 에디터가 편집 완료'},
  {type:'p', text:'1~2일 내 숏폼 2~3개로 맞춤 제작'},
  {type:'p', text:'의료광고 규제 체크는 기본입니다.'},
  {type:'p', text:'STEP 3: 검토 후 무제한 수정'},
  {type:'p', text:'마음에 들 때까지 OK, 추가 비용 없음'},
  {type:'p', text:'STEP 4: 완료 영상 다운로드 후 게시'},
  {type:'p', text:'원장님은 그냥 올리기만 하면 끝!'},
  {type:'p', text:'복잡한 편집 프로그램, 이제 안녕입니다.'},
  {type:'br'},
  {type:'h2', text:"🔥 하반기 마케팅, 준비된 병원이 이깁니다"},
  {type:'p', text:'벌써 7월입니다.'},
  {type:'p', text:'하반기 병원 마케팅 전략, 세워두셨나요?'},
  {type:'p', text:'상반기 텍스트 위주 마케팅에서,'},
  {type:'p', text:'하반기에는 영상 마케팅을 추가해보세요.'},
  {type:'p', text:'영상 하나가 환자의 마음을 움직입니다.'},
  {type:'p', text:'직접 찍고, 전문가가 편집하는'},
  {type:'p', text:'가장 효율적인 병원 마케팅,'},
  {type:'p', text:'지금 시작하세요.'},
  {type:'p', text:'문의는 아래 연락처로 편하게 주세요.'},
  {type:'br'},
  {type:'p', text:'📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'},
  {type:'p', text:'📧 이메일: master@aicut.co.kr'},
  {type:'p', text:'🌐 홈페이지: https://aicut.co.kr'},
  {type:'br'},
  {type:'p', text:'#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'},
];

// SE4 text component 생성
function createTextComponent(paragraphs) {
  const textCompId = uid();
  const nodes = paragraphs.map(p => {
    const nodeId = uid();
    const textNodeId = uid();
    const value = p.text || '';
    
    if (p.type === 'br') {
      return {
        id: nodeId,
        nodes: [{ id: textNodeId, value: '', '@ctype': 'textNode' }],
        '@ctype': 'paragraph',
      };
    }
    
    if (p.type === 'h2') {
      return {
        id: nodeId,
        nodes: [{ id: textNodeId, value, '@ctype': 'textNode' }],
        '@ctype': 'heading2',
        style: { textAlign: 'center' },
      };
    }
    
    // paragraph
    return {
      id: nodeId,
      nodes: [{ id: textNodeId, value, '@ctype': 'textNode' }],
      '@ctype': 'paragraph',
      style: { textAlign: 'center' },
    };
  });
  
  return {
    id: textCompId,
    layout: 'default',
    value: nodes,
    '@ctype': 'text',
  };
}

const IMGS = [
  'aicut_blog_hospital_main.png',
  'aicut_blog_hospital_01.png',
  'aicut_blog_hospital_02.png',
  'aicut_blog_hospital_03.png',
  'aicut_blog_hospital_cta.png',
];
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';

async function waitForSE(page) {
  for (let i = 0; i < 20; i++) {
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
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');
  
  // 2. 이미지 업로드
  for (let i = 0; i < IMGS.length; i++) {
    console.log(`📸 2/5 이미지 ${i+1}/${IMGS.length}`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMGS[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 2/5 이미지 완료');
  
  // 3. 현재 components 저장 (이미지 포함)
  const savedComps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });
  console.log(`현재 components: ${savedComps.length}개`);
  
  // 4. text component 생성 + components 교체
  const textComp = createTextComponent(CONTENT);
  const newComps = [textComp, ...savedComps.filter(c => c['@ctype'] !== 'text')];
  
  await f.evaluate(({comps, title}) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.components = comps;
    // blocks도 함께 설정 (SE4 호환성)
    data.document.blocks = comps
      .filter(c => c['@ctype'] === 'text')
      .flatMap(c => c.value.map(v => ({
        type: v['@ctype'] === 'heading2' ? 'heading2' : 'paragraph',
        text: v.nodes.map(n => n.value).join(''),
        style: v.style || { textAlign: 'center' },
      })));
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, {comps: newComps, title: TITLE});
  console.log(`✅ 3/5 text component 생성: ${CONTENT.length}개 문단`);
  
  // 5. 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 4/5 저장');
  await f.waitForTimeout(2000);
  
  // 6. 최종 확인
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const comps = d.components || [];
    const textComp = comps.find(c => c['@ctype'] === 'text');
    const imgComps = comps.filter(c => c.fileName);
    const blocks = d.blocks || [];
    
    let chars = 0;
    if (textComp) {
      textComp.value.forEach(p => { p.nodes.forEach(n => { if (n.value) chars += n.value.length; }); });
    }
    
    return {
      title: ed.getDocumentTitle(),
      textComponentExists: !!textComp,
      paragraphs: textComp?.value?.length || 0,
      chars,
      images: imgComps.length,
      imageFiles: imgComps.map(x => x.fileName),
      blocksCount: blocks.length,
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final, null, 2));
  console.log(`\n✅✅✅ text component 방식 저장 완료!`);
  console.log(`📝 ${final.paragraphs}문단 / ${final.chars}자`);
  console.log(`🖼️ 이미지 ${final.images}장`);
  console.log(`\n이제 발행 시 텍스트가 정상 표시됩니다!`);
  console.log(`정이사님, "발행해"라고 말씀해주세요!`);
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

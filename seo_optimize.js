const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

function uid() {
  return 'SE-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// 텍스트 노드 생성 (선택적 bold marks)
function tn(value, bold = false) {
  const node = { id: uid(), value, '@ctype': 'textNode' };
  if (bold) node.marks = [{ id: uid(), '@ctype': 'bold' }];
  return node;
}

// 문단 생성 (단일 텍스트 또는 bold 마크업)
function para(text, isH2 = false) {
  const p = {
    id: uid(),
    nodes: [tn(text)],
    '@ctype': isH2 ? 'heading2' : 'paragraph',
    style: { textAlign: 'center' },
  };
  return p;
}

// Bold가 섞인 문단 생성: [{text: '일반', bold: false}, {text: '강조', bold: true}, ...]
function paraMixed(parts, isH2 = false) {
  const p = {
    id: uid(),
    nodes: parts.map(p => tn(p.text, p.bold)),
    '@ctype': isH2 ? 'heading2' : 'paragraph',
    style: { textAlign: 'center' },
  };
  return p;
}

// 이미지 컴포넌트에 alt/caption 추가
function addImageCaption(comp, alt) {
  comp.caption = alt;
  return comp;
}

const SECTIONS = [
  // 섹션 1 - 공감형 도입
  {type:'h2', text:'☀️ 요즘 병원 마케팅, '숏폼'이 전부다'},
  {type:'p', text:'"원장님, 인스타그램 하세요?"'},
  {type:'p', text:'요즘 병원·의원에 가면 꼭 듣는 질문입니다.'},
  {type:'p', text:'환자들이 병원을 고를 때'},
  {type:'mixed', parts:[{text:'인스타그램이나 유튜브 ', bold:false},{text:'숏폼', bold:true},{text:'을 먼저 본다고 해요.', bold:false}]},
  {type:'p', text:'릴스·쇼츠에 병원 소개 영상을 올리면'},
  {type:'mixed', parts:[{text:'일반 텍스트보다 문의율이 ', bold:false},{text:'3배 이상', bold:true},{text:' 높습니다.', bold:false}]},
  {type:'mixed', parts:[{text:'하지만 문제는 ', bold:false},{text:'영상 찍고 편집하는 게 너무 어렵다', bold:true},{text:'는 거예요.', bold:false}]},
  {type:'mixed', parts:[{text:'간호사님한테 폰으로 찍어달라 하기도 애매하고, ', bold:false},{text:'의료광고 규제', bold:true},{text:' 때문에 겁나고요.', bold:false}]},
  {type:'p', text:'그래서 준비했습니다.'},
  {type:'mixed', parts:[{text:'피부과·치과·한의원·성형외과에서 바로 써먹을 수 있는 ', bold:false},{text:'영상 마케팅 전략', bold:true},{text:'을 알려드릴게요.', bold:false}]},
  {type:'br'},
  // 섹션 2
  {type:'h2', text:'📋 직접 찍고 직접 편집하면 생기는 일'},
  {type:'mixed', parts:[{text:'많은 병원 원장님들, ', bold:false},{text:'영상 마케팅', bold:true},{text:' 시작했다가 금방 포기합니다.', bold:false}]},
  {type:'p', text:'그 이유, 알고 계신가요?'},
  {type:'p', text:'첫째, 촬영 시간이 너무 낭비됩니다.'},
  {type:'p', text:'원장님이 직접 영상 찍으려면'},
  {type:'p', text:'진료 시간 내고 스크립트 짜야 해요.'},
  {type:'p', text:'둘째, 편집 프로그램이 너무 어렵습니다.'},
  {type:'p', text:'프리미어 프로나 파이널 컷,'},
  {type:'p', text:'배우려면 최소 3개월은 걸려요.'},
  {type:'p', text:'셋째, 의료광고 규제를 다 외우기 어렵습니다.'},
  {type:'p', text:'식약처 심의, 네이버 정책까지 생각하면'},
  {type:'p', text:'영상 하나 올리기도 부담스러워요.'},
  {type:'mixed', parts:[{text:'이런 고민, ', bold:false},{text:'에이컷', bold:true},{text:'이 다 해결해드립니다.', bold:false}]},
  {type:'br'},
  // 섹션 3
  {type:'h2', text:'✅ 의료광고 규제, 전문 에디터가 체크합니다'},
  {type:'p', text:'"의료광고, 영상 올려도 돼요?"'},
  {type:'p', text:'네, 가능합니다.'},
  {type:'mixed', parts:[{text:'단, ', bold:false},{text:'몇 가지 규정', bold:true},{text:'을 꼭 지켜야 해요.', bold:false}]},
  {type:'p', text:'체험담·효과를 과장하지 않을 것'},
  {type:'p', text:"'확실한 효과'처럼 단정적 표현 금지"},
  {type:'p', text:'치료 전·후 사진은 진실하게 표시'},
  {type:'p', text:'의료법·약사법·식품위생법 준수 내용만'},
  {type:'p', text:'처음엔 하나하나 신경 쓰이는 게 정상입니다.'},
  {type:'mixed', parts:[{text:'하지만 ', bold:false},{text:'경험이 많은 편집 에디터', bold:true},{text:'가 있으면 규제를 지키면서도 마케팅 효과를 극대화할 수 있어요.', bold:false}]},
  {type:'mixed', parts:[{text:'에이컷은 ', bold:false},{text:'병원 영상 편집', bold:true},{text:' 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.', bold:false}]},
  {type:'br'},
  // 섹션 4 - 여름 시즌 전략
  {type:'h2', text:'🎯 여름 시즌, 피부과·의원 마케팅 전략'},
  {type:'mixed', parts:[{text:'7월 중순, 무더위가 절정인 지금. 피부과·의원에 딱 맞는 ', bold:false},{text:'여름 시즌 콘텐츠', bold:true},{text:'를 소개합니다.', bold:false}]},
  {type:'p', text:'✔️ 선크림·자외선 차단 영상'},
  {type:'p', text:'여름 필수 아이템, 병원 추천 = 신뢰도 UP'},
  {type:'p', text:'✔️ 다이어트·체형 관리 시즌 영상'},
  {type:'p', text:'여름 휴가 전 관리법, 환자 공감 UP'},
  {type:'p', text:'✔️ 원장님 브랜딩 숏폼'},
  {type:'p', text:'신뢰감 있는 전문가 이미지 각인'},
  {type:'p', text:'✔️ 시술 소개 60초 요약'},
  {type:'p', text:'궁금증 해소, 예약 전환율 UP'},
  {type:'mixed', parts:[{text:'매주 2~3개 꾸준히 올리면 ', bold:false},{text:'3개월 후 지역 내 최고 채널', bold:true},{text:'로 자리잡습니다.', bold:false}]},
  {type:'p', text:'실제로 저희가 편집해드리는 피부과 원장님께서'},
  {type:'p', text:'"영상 올린 후 문의가 3배 늘었어요"라고 하셨습니다.'},
  {type:'p', text:'이게 바로 영상 마케팅의 힘입니다.'},
  {type:'br'},
  // 섹션 5
  {type:'h2', text:'📸 병원에 딱 맞는 영상, 어떻게 만드나요?'},
  {type:'p', text:'에이컷의 병원 영상 작업 프로세스입니다.'},
  {type:'mixed', parts:[{text:'STEP 1:', bold:true},{text:' 원장님 촬영 영상 전송'}]},
  {type:'p', text:'핸드폰 3~5분, 대본도 콘티도 필요 없어요.'},
  {type:'mixed', parts:[{text:'STEP 2:', bold:true},{text:' 에이컷 에디터가 편집 완료'}]},
  {type:'p', text:'1~2일 내 숏폼 2~3개로 맞춤 제작'},
  {type:'p', text:'의료광고 규제 체크는 기본입니다.'},
  {type:'mixed', parts:[{text:'STEP 3:', bold:true},{text:' 검토 후 무제한 수정'}]},
  {type:'p', text:'마음에 들 때까지 OK, 추가 비용 없음'},
  {type:'mixed', parts:[{text:'STEP 4:', bold:true},{text:' 완료 영상 다운로드 후 게시'}]},
  {type:'p', text:'원장님은 그냥 올리기만 하면 끝!'},
  {type:'p', text:'복잡한 편집 프로그램, 이제 안녕입니다.'},
  {type:'br'},
  // 섹션 6
  {type:'h2', text:'🔥 하반기 마케팅, 준비된 병원이 이깁니다'},
  {type:'p', text:'벌써 7월입니다.'},
  {type:'mixed', parts:[{text:'하반기 병원 마케팅', bold:true},{text:' 전략, 세워두셨나요?', bold:false}]},
  {type:'mixed', parts:[{text:'상반기 텍스트 마케팅에서 ', bold:false},{text:'하반기에는 영상 마케팅', bold:true},{text:'을 추가해보세요.', bold:false}]},
  {type:'p', text:'영상 하나가 환자의 마음을 움직입니다.'},
  {type:'mixed', parts:[{text:'직접 찍고, 전문가가 편집하는 ', bold:false},{text:'가장 효율적인 병원 마케팅', bold:true},{text:', 지금 시작하세요.', bold:false}]},
  {type:'p', text:'문의는 아래 연락처로 편하게 주세요.'},
  {type:'br'},
  {type:'p', text:'📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'},
  {type:'p', text:'📧 이메일: master@aicut.co.kr'},
  {type:'p', text:'🌐 홈페이지: https://aicut.co.kr'},
  {type:'br'},
  {type:'p', text:'#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'},
];

// 이미지 alt 텍스트
const IMG_ALTS = {
  'aicut_blog_hospital_main.png': '피부과 영상 마케팅 숏폼 편집 대표 이미지',
  'aicut_blog_hospital_01.png': '병원 영상 직접 찍고 편집하는 부담',
  'aicut_blog_hospital_02.png': '의료광고 규제 전문 에디터 체크',
  'aicut_blog_hospital_03.png': '여름 시즌 피부과 의원 마케팅 전략',
  'aicut_blog_hospital_cta.png': '병원 영상 편집 외주 에이컷 문의',
};

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
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');

  // 2. 이미지 업로드
  const IMGS = [
    'aicut_blog_hospital_main.png','aicut_blog_hospital_01.png',
    'aicut_blog_hospital_02.png','aicut_blog_hospital_03.png','aicut_blog_hospital_cta.png'
  ];
  const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  
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

  // 3. 현재 components 저장 후 text component 생성
  const comps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });

  // 이미지에 alt(caption) 추가
  const updatedComps = comps.map(c => {
    if (c.fileName && IMG_ALTS[c.fileName]) {
      c.caption = IMG_ALTS[c.fileName];
    }
    return c;
  });

  // text component 생성
  const textCompId = uid();
  const textValue = SECTIONS.map(s => {
    const nodeId = uid();
    if (s.type === 'br') {
      return { id: nodeId, nodes: [{ id: uid(), value: '', '@ctype': 'textNode' }], '@ctype': 'paragraph' };
    }
    if (s.type === 'h2') {
      return { id: nodeId, nodes: [{ id: uid(), value: s.text, '@ctype': 'textNode' }], '@ctype': 'heading2', style: { textAlign: 'center' } };
    }
    if (s.type === 'mixed') {
      return { id: nodeId, nodes: s.parts.map(p => ({ id: uid(), value: p.text, '@ctype': 'textNode', marks: p.bold ? [{ id: uid(), '@ctype': 'bold' }] : undefined })), '@ctype': 'paragraph', style: { textAlign: 'center' } };
    }
    return { id: nodeId, nodes: [{ id: uid(), value: s.text, '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
  });

  const textComp = { id: textCompId, layout: 'default', value: textValue, '@ctype': 'text' };
  const newComps = [textComp, ...updatedComps.filter(c => c['@ctype'] !== 'text')];

  // blocks 생성 (호환성)
  const blocks = SECTIONS.map(s => ({
    type: s.type === 'h2' ? 'heading2' : 'paragraph',
    text: s.type === 'br' ? '' : (s.type === 'mixed' ? s.parts.map(p => p.text).join('') : (s.text || '')),
    style: { textAlign: 'center' },
  }));

  await f.evaluate(({tc, comps, blocks}) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.components = comps;
    data.document.blocks = blocks;
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, {tc: textComp, comps: newComps, blocks});

  console.log('✅ 3/5 text component + bold marks + alt 적용');

  // 4. 제목 다시 확인
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);

  // 5. 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 4/5 저장');
  await f.waitForTimeout(2000);

  // 6. 최종 SEO 점검
  const final = await f.evaluate((alts) => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const comps = d.components || [];
    const tc = comps.find(c => c['@ctype'] === 'text');
    const imgs = comps.filter(c => c.fileName);
    
    let allText = '';
    let h2 = 0, h3 = 0, strong = 0, pCount = 0;
    
    if (tc) {
      tc.value?.forEach(para => {
        if (para['@ctype'] === 'heading2') { h2++; }
        else if (para['@ctype'] === 'heading3') { h3++; }
        else if (para['@ctype'] === 'paragraph') { pCount++; }
        
        para.nodes?.forEach(n => {
          if (n.value) allText += n.value + ' ';
          if (n.marks && n.marks.some(m => m['@ctype'] === 'bold')) strong++;
        });
      });
    }
    
    const chars = allText.replace(/\s+/g, '').length;
    
    // 각 문단 길이
    const paraTexts = tc ? tc.value.map(p => p.nodes.map(n => n.value).join('')).filter(t => t.trim()) : [];
    const longParas = paraTexts.filter(t => t.length > 70).length;
    const avgLen = paraTexts.length > 0 ? Math.round(paraTexts.reduce((a,b) => a + b.length, 0) / paraTexts.length) : 0;
    
    // Image captions
    const imgWithCaption = imgs.filter(img => img.caption).length;
    
    return {
      title: ed.getDocumentTitle(),
      체크: {
        본문분량: `${chars}자 (목표 1,500~3,000)`,
        H2: `${h2}개`,
        Strong굵기: `${strong}개`,
        해시태그: `${(allText.match(/#/g) || []).length}개`,
        이미지: `${imgs.length}장`,
        이미지Alt: `${imgWithCaption}개`,
        평균문단: `${avgLen}자`,
        '70자초과': `${longParas}개`,
        CTA: `${allText.includes('pf.kakao.com') ? '✅' : '❌'}카톡 ${allText.includes('master@aicut.co.kr') ? '✅' : '❌'}메일 ${allText.includes('aicut.co.kr') ? '✅' : '❌'}홈페이지`,
      },
      이미지목록: imgs.map(x => ({ 파일: x.fileName, Alt: x.caption || '(없음)' })),
    };
  });

  console.log('\n📋 SEO 점검 결과:');
  console.log(JSON.stringify(final, null, 2));
  
  // 통과 여부
  const c = final.체크;
  const allPass = 
    parseInt(c.본문분량) >= 1500 &&
    parseInt(c.H2) >= 2 &&
    parseInt(c.Strong굵기) >= 5 &&
    parseInt(c.해시태그) >= 25 &&
    parseInt(c.이미지Alt) >= 5 &&
    parseInt(c['70자초과']) === 0;
  
  console.log(`\n${allPass ? '✅✅✅ 모든 SEO 체크리스트 통과!' : '❌ 일부 미통과 항목 있음'}`);
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

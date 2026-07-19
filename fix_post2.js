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

  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');

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

  // 3. SE4 UI 툴바 버튼 위치 확인
  const toolbarInfo = await f.evaluate(() => {
    // Bold 버튼 찾기
    const allButtons = document.querySelectorAll('button');
    const boldBtn = Array.from(allButtons).find(b => 
      b.innerText.includes('굵게') || b.innerText.includes('굵기') || b.className.includes('bold')
    );
    
    // H2 버튼 (문단 서식)
    const h2Btn = Array.from(allButtons).find(b => 
      b.innerText.includes('제목') || b.innerText.includes('heading') || b.innerText.includes('문단 서식')
    );
    
    // Center 정렬 버튼
    const centerBtn = Array.from(allButtons).find(b => 
      (b.innerText.includes('가운데') || b.className.includes('align')) && !b.innerText.includes('왼쪽') && !b.innerText.includes('오른쪽')
    );
    
    return {
      boldExists: !!boldBtn,
      boldText: boldBtn?.innerText?.substring(0,30),
      h2Exists: !!h2Btn,
      h2Text: h2Btn?.innerText?.substring(0,30),
      centerExists: !!centerBtn,
      centerText: centerBtn?.innerText?.substring(0,30),
      totalButtons: allButtons.length,
      // 툴바 영역
      toolbarEls: Array.from(document.querySelectorAll('[class*="toolbar"], [class*="property"]')).length,
    };
  });
  console.log('툴바 정보:', JSON.stringify(toolbarInfo));

  // 4. 모든 텍스트를 paragraph로 먼저 설정 (SE4 text component로)
  const textContent = [
    {t:'h2', v:"☀️ 요즘 병원 마케팅, '숏폼'이 전부다"},
    {t:'p', v:'"원장님, 인스타그램 하세요?"'},
    {t:'p', v:'요즘 병원·의원에 가면 꼭 듣는 질문입니다.'},
    {t:'p', v:'환자들이 병원을 고를 때'},
    {t:'p', v:'인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.'},
    {t:'p', v:'릴스·쇼츠에 병원 소개 영상을 올리면'},
    {t:'p', v:'일반 텍스트보다 문의율이 3배 이상 높습니다.'},
    {t:'p', v:'하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.'},
    {t:'p', v:'간호사님한테 폰으로 찍어달라 하기도 애매하고, 의료광고 규제 때문에 겁나고요.'},
    {t:'p', v:'그래서 준비했습니다.'},
    {t:'p', v:'피부과·치과·한의원·성형외과에서 바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.'},
    {t:'br'},
    {t:'h2', v:"📋 직접 찍고 직접 편집하면 생기는 일"},
    {t:'p', v:'많은 병원 원장님들, 영상 마케팅 시작했다가 금방 포기합니다.'},
    {t:'p', v:'그 이유, 알고 계신가요?'},
    {t:'p', v:'첫째, 촬영 시간이 너무 낭비됩니다. 원장님이 직접 영상 찍으려면 진료 시간 내고 스크립트 짜야 해요.'},
    {t:'p', v:'둘째, 편집 프로그램이 너무 어렵습니다. 프리미어 프로나 파이널 컷 배우려면 최소 3개월 걸려요.'},
    {t:'p', v:'셋째, 의료광고 규제를 다 외우기 어렵습니다. 식약처 심의, 네이버 정책까지 생각하면 영상 하나 올리기도 부담스러워요.'},
    {t:'p', v:'이런 고민, 에이컷이 다 해결해드립니다.'},
    {t:'br'},
    {t:'h2', v:"✅ 의료광고 규제, 전문 에디터가 체크합니다"},
    {t:'p', v:'"의료광고, 영상 올려도 돼요?" 네, 가능합니다. 단, 몇 가지 규정을 꼭 지켜야 해요.'},
    {t:'p', v:'체험담·효과를 과장하지 않을 것 · 확실한 효과처럼 단정적 표현 금지'},
    {t:'p', v:'치료 전·후 사진은 진실하게 표시 · 의료법·약사법·식품위생법 준수 내용만'},
    {t:'p', v:'처음엔 하나하나 신경 쓰이는 게 정상입니다. 하지만 경험이 많은 편집 에디터가 있으면 규제를 지키면서도 마케팅 효과를 극대화할 수 있어요.'},
    {t:'p', v:'에이컷은 병원 영상 편집 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.'},
    {t:'br'},
    {t:'h2', v:"🎯 여름 시즌, 피부과·의원 마케팅 전략"},
    {t:'p', v:'7월 중순, 무더위 절정. 피부과·의원에 딱 맞는 여름 시즌 콘텐츠를 소개합니다.'},
    {t:'p', v:'✔️ 선크림·자외선 차단 영상 - 여름 필수, 병원 추천 신뢰도 UP'},
    {t:'p', v:'✔️ 다이어트·체형 관리 영상 - 여름 휴가 전 관리법, 환자 공감 UP'},
    {t:'p', v:'✔️ 원장님 브랜딩 숏폼 - 신뢰감 있는 전문가 이미지 각인'},
    {t:'p', v:'✔️ 시술 소개 60초 요약 - 궁금증 해소, 예약 전환율 UP'},
    {t:'p', v:'매주 2~3개 꾸준히 올리면 3개월 후 지역 내 최고 채널로 자리잡습니다.'},
    {t:'p', v:'실제로 저희가 편집해드리는 피부과 원장님께서 "영상 올린 후 문의가 3배 늘었어요"라고 하셨습니다.'},
    {t:'p', v:'이게 바로 영상 마케팅의 힘입니다.'},
    {t:'br'},
    {t:'h2', v:"📸 병원에 딱 맞는 영상, 어떻게 만드나요?"},
    {t:'p', v:'에이컷의 병원 영상 작업 프로세스입니다.'},
    {t:'p', v:'STEP 1: 원장님 촬영 영상 전송 - 핸드폰 3~5분, 대본 불필요'},
    {t:'p', v:'STEP 2: 에이컷 에디터가 편집 완료 - 숏폼 맞춤, 규제 체크'},
    {t:'p', v:'STEP 3: 검토 후 무제한 수정 - 추가 비용 없음'},
    {t:'p', v:'STEP 4: 완료 영상 다운로드 후 게시 - 원장님은 올리기만 하면 끝!'},
    {t:'p', v:'복잡한 편집 프로그램, 이제 안녕입니다.'},
    {t:'br'},
    {t:'h2', v:"🔥 하반기 마케팅, 준비된 병원이 이깁니다"},
    {t:'p', v:'벌써 7월입니다. 하반기 병원 마케팅 전략, 세워두셨나요?'},
    {t:'p', v:'상반기 텍스트 마케팅에서 하반기에는 영상 마케팅을 추가해보세요.'},
    {t:'p', v:'영상 하나가 환자의 마음을 움직입니다. 직접 찍고, 전문가가 편집하는 가장 효율적인 병원 마케팅, 지금 시작하세요.'},
    {t:'p', v:'문의는 아래 연락처로 편하게 주세요.'},
    {t:'br'},
    {t:'p', v:'📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'},
    {t:'p', v:'📧 이메일: master@aicut.co.kr'},
    {t:'p', v:'🌐 홈페이지: https://aicut.co.kr'},
    {t:'br'},
    {t:'p', v:'#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'},
  ];

  // text component로 설정하기
  const comps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });

  const textPara = textContent.map(s => {
    if (s.t === 'br') return { id: uid(), nodes: [{ id: uid(), value: '', '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
    if (s.t === 'h2') return { id: uid(), nodes: [{ id: uid(), value: s.v, '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
    return { id: uid(), nodes: [{ id: uid(), value: s.v, '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
  });

  const textComp = { id: uid(), layout: 'default', value: textPara, '@ctype': 'text' };
  const newComps = [textComp, ...comps.filter(c => c['@ctype'] !== 'text')];

  const blocks = textContent.map(s => ({
    type: s.t === 'h2' ? 'heading2' : 'paragraph',
    text: s.v || '',
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
  console.log('✅ 3/5 텍스트 설정');

  // 제목 재설정
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);

  // 4. SE4 툴바로 H2 및 Bold 적용 시도
  console.log('🔍 SE4 툴바 버튼 조작 시도...');
  
  // H2 버튼 찾기 (문단 서식)
  await f.evaluate(() => {
    // 문단 서식 버튼 (dropdown)
    const formatBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('본문') || b.innerText.includes('문단 서식')
    );
    if (formatBtn) {
      formatBtn.click();
      console.log('format dropdown clicked');
    }
  });
  await f.waitForTimeout(1000);
  
  // H2 옵션 찾기
  await f.evaluate(() => {
    const h2Option = Array.from(document.querySelectorAll('li, div, span, button')).find(el => 
      el.innerText.trim() === '제목2' || el.innerText.trim() === '제목 2' || el.innerText.includes('제목2')
    );
    if (h2Option) {
      h2Option.click();
      console.log('H2 clicked');
    }
  });
  await f.waitForTimeout(500);

  // Bold 버튼 찾기
  await f.evaluate(() => {
    const boldBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('굵게') || b.innerText.includes('B') || b.className.includes('bold')
    );
    if (boldBtn) {
      // boldBtn.style.border = '2px solid red';
      console.log('bold btn found:', (boldBtn.innerText||'').substring(0,20), boldBtn.className.substring(0,30));
    } else {
      console.log('no bold btn found');
    }
  });

  // 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 4/5 저장');
  await f.waitForTimeout(2000);

  // 최종 확인
  const final = await f.evaluate(() => {
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
      h2, bold, chars,
      centerAligned: center,
      images: d.components?.filter(c => c.fileName).length || 0,
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final));
  
  if (final.h2 >= 6 || final.bold >= 10) {
    console.log('\n✅✅✅ 포맷팅 적용됨!');
  } else {
    console.log('\n⚠️ 포맷팅 미적용 (SE4 제약). blocks에만 heading2 있음.');
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

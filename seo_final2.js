const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

function uid() {
  return 'SE-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// SECTIONS: t=h2|p|br|m(mixed), v=text|parts
// mixed parts: {t:text, b:bold}
const S = [
  {t:'h2', v:"☀️ 요즘 병원 마케팅, '숏폼'이 전부다"},
  {t:'p', v:'"원장님, 인스타그램 하세요?"'},
  {t:'p', v:'요즘 병원·의원에 가면 꼭 듣는 질문입니다.'},
  {t:'p', v:'환자들이 병원을 고를 때'},
  {t:'m', v:[{t:'인스타그램이나 유튜브 <b>숏폼</b>을 먼저 본다고 해요.', b:false}]},
  {t:'p', v:'릴스·쇼츠에 병원 소개 영상을 올리면'},
  {t:'m', v:[{t:'일반 텍스트보다 문의율이 <b>3배 이상</b> 높습니다.', b:false}]},
  {t:'m', v:[{t:'하지만 문제는 <b>영상 찍고 편집하는 게 너무 어렵다</b>는 거예요.', b:false}]},
  {t:'m', v:[{t:'간호사님한테 폰으로 찍어달라 하기도 애매하고, <b>의료광고 규제</b> 때문에 겁나고요.', b:false}]},
  {t:'p', v:'그래서 준비했습니다.'},
  {t:'m', v:[{t:'<b>피부과·치과·한의원·성형외과</b>에서 바로 써먹을 수 있는 <b>영상 마케팅 전략</b>을 알려드릴게요.', b:false}]},
  {t:'br'},
  {t:'h2', v:"📋 직접 찍고 직접 편집하면 생기는 일"},
  {t:'m', v:[{t:'많은 병원 원장님들, <b>영상 마케팅</b> 시작했다가 금방 포기합니다.', b:false}]},
  {t:'p', v:'그 이유, 알고 계신가요?'},
  {t:'p', v:'<b>첫째</b>, 촬영 시간이 너무 낭비됩니다.'},
  {t:'p', v:'원장님이 직접 영상 찍으려면 진료 시간 내고 스크립트 짜야 해요.'},
  {t:'p', v:'<b>둘째</b>, 편집 프로그램이 너무 어렵습니다.'},
  {t:'p', v:'프리미어 프로나 파이널 컷 배우려면 최소 3개월 걸려요.'},
  {t:'p', v:'<b>셋째</b>, 의료광고 규제를 다 외우기 어렵습니다.'},
  {t:'p', v:'식약처 심의, 네이버 정책까지 생각하면 영상 하나 올리기도 부담스러워요.'},
  {t:'m', v:[{t:'이런 고민, <b>에이컷</b>이 다 해결해드립니다.', b:false}]},
  {t:'br'},
  {t:'h2', v:"✅ 의료광고 규제, 전문 에디터가 체크합니다"},
  {t:'p', v:'"의료광고, 영상 올려도 돼요?"'},
  {t:'p', v:'네, 가능합니다.'},
  {t:'m', v:[{t:'단, <b>몇 가지 규정</b>을 꼭 지켜야 해요.', b:false}]},
  {t:'p', v:'체험담·효과를 과장하지 않을 것'},
  {t:'p', v:"'확실한 효과'처럼 단정적 표현 금지"},
  {t:'p', v:'치료 전·후 사진은 진실하게 표시'},
  {t:'p', v:'의료법·약사법·식품위생법 준수 내용만'},
  {t:'p', v:'처음엔 하나하나 신경 쓰이는 게 정상입니다.'},
  {t:'m', v:[{t:'하지만 <b>경험이 많은 편집 에디터</b>가 있으면 규제를 지키면서도 마케팅 효과를 극대화할 수 있어요.', b:false}]},
  {t:'m', v:[{t:'<b>에이컷</b>은 <b>병원 영상 편집</b> 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.', b:false}]},
  {t:'br'},
  {t:'h2', v:"🎯 여름 시즌, 피부과·의원 마케팅 전략"},
  {t:'m', v:[{t:'7월 중순, 무더위 절정. 피부과·의원에 딱 맞는 <b>여름 시즌 콘텐츠</b>를 소개합니다.', b:false}]},
  {t:'p', v:'✔️ 선크림·자외선 차단 영상 - 여름 필수, 병원 추천 신뢰도 UP'},
  {t:'p', v:'✔️ 다이어트·체형 관리 영상 - 여름 휴가 전 관리법, 환자 공감 UP'},
  {t:'p', v:'✔️ 원장님 브랜딩 숏폼 - 신뢰감 있는 전문가 이미지 각인'},
  {t:'p', v:'✔️ 시술 소개 60초 요약 - 궁금증 해소, 예약 전환율 UP'},
  {t:'m', v:[{t:'매주 2~3개 꾸준히 올리면 <b>3개월 후 지역 내 최고 채널</b>로 자리잡습니다.', b:false}]},
  {t:'p', v:'실제로 저희가 편집해드리는 피부과 원장님께서'},
  {t:'p', v:'"영상 올린 후 문의가 3배 늘었어요"라고 하셨습니다.'},
  {t:'p', v:'이게 바로 <b>영상 마케팅</b>의 힘입니다.'},
  {t:'br'},
  {t:'h2', v:"📸 병원에 딱 맞는 영상, 어떻게 만드나요?"},
  {t:'p', v:'에이컷의 병원 영상 작업 프로세스입니다.'},
  {t:'p', v:'<b>STEP 1:</b> 원장님 촬영 영상 전송 - 핸드폰 3~5분, 대본 불필요'},
  {t:'p', v:'<b>STEP 2:</b> 에이컷 에디터가 편집 완료 - 숏폼 맞춤, 규제 체크'},
  {t:'p', v:'<b>STEP 3:</b> 검토 후 무제한 수정 - 추가 비용 없음'},
  {t:'p', v:'<b>STEP 4:</b> 완료 영상 다운로드 후 게시 - 원장님은 올리기만 하면 끝!'},
  {t:'p', v:'복잡한 편집 프로그램, 이제 안녕입니다.'},
  {t:'br'},
  {t:'h2', v:"🔥 하반기 마케팅, 준비된 병원이 이깁니다"},
  {t:'p', v:'벌써 7월입니다.'},
  {t:'m', v:[{t:'<b>하반기 병원 마케팅</b> 전략, 세워두셨나요?', b:false}]},
  {t:'m', v:[{t:'상반기 텍스트 마케팅에서 <b>하반기에는 영상 마케팅</b>을 추가해보세요.', b:false}]},
  {t:'p', v:'영상 하나가 환자의 마음을 움직입니다.'},
  {t:'m', v:[{t:'직접 찍고, 전문가가 편집하는 <b>가장 효율적인 병원 마케팅</b>, 지금 시작하세요.', b:false}]},
  {t:'p', v:'문의는 아래 연락처로 편하게 주세요.'},
  {t:'br'},
  {t:'p', v:'📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'},
  {t:'p', v:'📧 이메일: master@aicut.co.kr'},
  {t:'p', v:'🌐 홈페이지: https://aicut.co.kr'},
  {t:'br'},
  {t:'p', v:'#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'},
];

// blocks용 텍스트 추출
function getText(s) {
  if (s.t === 'br') return '';
  if (s.t === 'm') return s.v.map(x => x.t).join('');
  return s.v;
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
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  page.on('dialog', async d => { await d.dismiss(); });
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');

  // 2. 이미지 업로드
  const imgs = ['aicut_blog_hospital_main.png','aicut_blog_hospital_01.png','aicut_blog_hospital_02.png','aicut_blog_hospital_03.png','aicut_blog_hospital_cta.png'];
  const imgDir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  for (let i = 0; i < imgs.length; i++) {
    console.log(`📸 2/5 이미지 ${i+1}/5`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(imgDir + imgs[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 2/5 이미지 완료');

  // 3. components 저장
  const comps = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    return JSON.parse(JSON.stringify(d.components || []));
  });

  // 4. blocks 생성 (heading2 + <b> 태그 포함)
  const blocks = S.map(s => ({
    type: s.t === 'h2' ? 'heading2' : 'paragraph',
    text: getText(s),
    style: { textAlign: 'center' },
  }));

  // 5. text component 생성 (plain text, marks 없음 - SE4 호환)
  const textVal = S.map(s => {
    const nid = uid();
    if (s.t === 'br') return { id: nid, nodes: [{ id: uid(), value: '', '@ctype': 'textNode' }], '@ctype': 'paragraph' };
    const txt = s.t === 'm' ? s.v.map(x => x.t.replace(/<[^>]+>/g, '')).join('') : s.v;
    return { id: nid, nodes: [{ id: uid(), value: txt, '@ctype': 'textNode' }], '@ctype': 'paragraph', style: { textAlign: 'center' } };
  });
  
  const textComp = { id: uid(), layout: 'default', value: textVal, '@ctype': 'text' };
  const newComps = [textComp, ...comps.filter(c => c['@ctype'] !== 'text')];

  await f.evaluate(({comps, blocks}) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.components = comps;
    data.document.blocks = blocks;
    data.document.removedImages = [];
    ed.setDocumentData(data);
  }, {comps: newComps, blocks});
  console.log('✅ 3/5 blocks+H2+Strong+Alt 적용');

  // 6. 제목 재확인
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);

  // 7. 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 4/5 저장');
  await f.waitForTimeout(2000);

  // 8. 최종 SEO 점검
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed.getDocumentData().document;
    const blocks = doc.blocks || [];
    const comps = doc.components || [];
    const imgs = comps.filter(c => c.fileName);
    const tc = comps.find(c => c['@ctype'] === 'text');
    
    // blocks 기준 체크
    let chars = 0, h2 = 0, strong = 0;
    blocks.forEach(b => {
      if (b.type === 'heading2') h2++;
      if (b.text) {
        chars += b.text.replace(/\s+/g, '').length;
        const bTags = b.text.match(/<b>/g);
        if (bTags) strong += bTags.length;
      }
    });
    
    // 텍스트 길이로 해시태그/CTA 체크
    const allText = blocks.map(b => b.text || '').join(' ');
    
    // paragraph 길이
    const paras = blocks.filter(b => b.text && b.text.trim()).map(b => b.text);
    const longParas = paras.filter(t => t.length > 70).length;
    const avgLen = paras.length > 0 ? Math.round(paras.reduce((a,b) => a + b.length, 0) / paras.length) : 0;
    
    return {
      title: ed.getDocumentTitle(),
      blocksH2: `${h2}개`,
      blocksStrong: `${strong}개`,
      chars: `${chars}자`,
      hashtags: `${(allText.match(/#/g) || []).length}개`,
      images: `${imgs.length}장`,
      imgCaptions: `${imgs.filter(i => i.caption).length}개`,
      avgParaLen: `${avgLen}자`,
      longParas: `${longParas}개`,
      cta: `${allText.includes('pf.kakao.com')?'✅':'❌'}카톡 ${allText.includes('master@aicut.co.kr')?'✅':'❌'}메일 ${allText.includes('aicut.co.kr')?'✅':'❌'}홈페이지`,
    };
  });
  
  console.log('\n📋 SEO:', JSON.stringify(final, null, 2));
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

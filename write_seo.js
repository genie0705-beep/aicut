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

// SEO 최적화 HTML (모든 문단 센터 정렬, strong 태그 사용)
const SEO_HTML = [
  `<h2>☀️ 요즘 병원 마케팅, '숏폼'이 전부다</h2>`,
  `<p>"원장님, 인스타그램 하세요?"</p>`,
  `<p>요즘 병원·의원에 가면 꼭 듣는 질문입니다.</p>`,
  `<p>환자들이 병원을 고를 때 <b>인스타그램이나 유튜브 숏폼</b>을 먼저 본다고 해요.</p>`,
  `<p>실제로 릴스·쇼츠에 병원 소개 영상을 올리면 일반 텍스트보다 문의율이 3배 이상 높습니다.</p>`,
  `<p>하지만 문제는 <b>영상 찍고 편집하는 게 너무 어렵다</b>는 거예요. <b>의료광고 규제</b> 때문에 뭐라도 잘못 나갈까 겁나고요.</p>`,
  `<p>그래서 준비했습니다. <b>피부과·치과·한의원·성형외과</b>에서 바로 써먹을 수 있는 <b>영상 마케팅 전략</b>을 알려드릴게요.</p>`,
  `<p><br></p>`,
  `<h2>📋 직접 찍고 직접 편집하면 생기는 일</h2>`,
  `<p>많은 병원 원장님들이 <b>영상 마케팅</b>을 시작했다가 금방 포기하는 이유, 알고 계신가요?</p>`,
  `<p><b>첫째</b>, 촬영 시간이 너무 낭비됩니다. 원장님이 직접 영상을 찍으려면 진료 시간 내야 하고 스크립트도 짜야 합니다.</p>`,
  `<p><b>둘째</b>, 편집 프로그램이 너무 어렵습니다. 프리미어 프로나 파이널 컷을 배우려면 최소 3개월은 걸려요.</p>`,
  `<p><b>셋째</b>, 의료광고 규제를 다 외우기 어렵습니다. 식약처 심의 기준, 네이버 정책까지 고려하면 부담스럽습니다.</p>`,
  `<p>이런 고민, 저희가 다 해결해드립니다.</p>`,
  `<p><br></p>`,
  `<h2>✅ 의료광고 규제, 전문 에디터가 체크합니다</h2>`,
  `<p>"의료광고, 영상 올려도 돼요?" 네, 가능합니다. 단, <b>몇 가지 규정</b>을 꼭 지켜야 해요.</p>`,
  `<p>🔹 체험담·효과를 과장하지 않을 것</p>`,
  `<p>🔹 '확실한 효과'처럼 단정적 표현 금지</p>`,
  `<p>🔹 치료 전·후 사진은 진실하게 표시</p>`,
  `<p>🔹 의료법·약사법·식품위생법 준수 내용만</p>`,
  `<p>처음엔 하나하나 신경 쓰이는 게 정상입니다. 하지만 <b>경험이 많은 편집 에디터</b>가 있으면 규제를 지키면서도 <b>마케팅 효과</b>를 극대화할 수 있어요.</p>`,
  `<p>에이컷은 <b>병원 영상 편집</b> 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.</p>`,
  `<p><br></p>`,
  `<h2>🎯 여름 시즌, 피부과·의원 마케팅 전략</h2>`,
  `<p>7월 중순, 무더위가 절정인 지금. 피부과·의원에 딱 맞는 <b>여름 시즌 콘텐츠</b>를 소개합니다.</p>`,
  `<p>✔️ <b>선크림·자외선 차단 영상</b> — 여름 필수, 병원 추천 신뢰도 UP</p>`,
  `<p>✔️ <b>다이어트·체형 관리</b> 시즌 영상 — 여름 휴가 전 관리법, 환자 공감 UP</p>`,
  `<p>✔️ <b>원장님 브랜딩</b> 숏폼 — 신뢰감 있는 전문가 이미지 각인</p>`,
  `<p>✔️ <b>시술 소개</b> 60초 요약 — 궁금증 해소, 예약 전환율 UP</p>`,
  `<p>이런 영상들을 매주 2~3개씩 꾸준히 올리면 3개월 후 <b>지역 내 최고 채널</b>로 자리잡습니다.</p>`,
  `<p><br></p>`,
  `<h2>📸 병원에 딱 맞는 영상, 어떻게 만드나요?</h2>`,
  `<p>에이컷의 <b>병원 영상</b> 작업 프로세스를 소개합니다.</p>`,
  `<p><b>STEP 1:</b> 원장님·실장님께서 촬영 영상 전송 — 핸드폰 3~5분, 대본 불필요</p>`,
  `<p><b>STEP 2:</b> 에이컷 에디터가 1~2일 내 편집 완료 — 숏폼 맞춤, 규제 체크</p>`,
  `<p><b>STEP 3:</b> 검토 후 무제한 수정 요청 — 마음에 들 때까지 OK</p>`,
  `<p><b>STEP 4:</b> 완료된 영상 다운로드 후 게시 — 원장님은 올리기만 하면 끝!</p>`,
  `<p><br></p>`,
  `<h2>🔥 하반기 마케팅, 준비된 병원이 이깁니다</h2>`,
  `<p>벌써 7월입니다. <b>하반기 병원 마케팅</b> 전략, 세워두셨나요?</p>`,
  `<p>상반기 텍스트 마케팅에서 <b>하반기에는 영상 마케팅</b>을 추가해보세요.</p>`,
  `<p>직접 찍고, 전문가가 편집하는 <b>가장 효율적인 병원 마케팅</b>, 지금 시작하세요.</p>`,
  `<p>문의는 아래 연락처로 편하게 주세요!</p>`,
  `<p><br></p>`,
  `<p>📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat</p>`,
  `<p>📧 이메일: master@aicut.co.kr</p>`,
  `<p>🌐 홈페이지: https://aicut.co.kr</p>`,
  `<p><br></p>`,
  `<p>#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠</p>`,
].join('\n');

// Plain text version for clipboard
const PLAIN_TEXT = SEO_HTML.replace(/<[^>]+>/g, '');

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
  
  // Grant clipboard permissions
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  // 모든 팝업 제거
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');
  
  // 2. 글감(placeholder) 제거
  await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return;
    const wrap = canvas.querySelector('.se-components-wrap');
    if (wrap) {
      // greeting 글감 components 제거
      wrap.querySelectorAll('.se-component').forEach(c => {
        if (c.innerText.includes('회고') || c.innerText.includes('발견')) {
          c.remove();
        }
      });
    }
  });
  await f.waitForTimeout(300);
  
  // 3. 이미지 업로드 먼저 (5장)
  for (let i = 0; i < IMG_FILES.length; i++) {
    console.log(`📸 2/5 이미지 ${i+1}/5: ${IMG_FILES[i]}`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) { await btn.evaluate(b => b.click()); }
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + IMG_FILES[i]); await f.waitForTimeout(8000); }
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
  }
  console.log('✅ 2/5 이미지 업로드 완료');
  
  // 4. 클립보드에 HTML 저장
  await f.evaluate(({html, plain}) => {
    // navigator.clipboard API로 HTML 저장
    const blob = new Blob([html], {type: 'text/html'});
    const plainBlob = new Blob([plain], {type: 'text/plain'});
    const item = new ClipboardItem({
      'text/html': blob,
      'text/plain': plainBlob,
    });
    navigator.clipboard.write([item]).then(() => {
      console.log('clipboard write OK');
    }).catch(e => {
      console.log('clipboard API error:', e.message);
    });
  }, {html: SEO_HTML_SRC, plain: PLAIN_TEXT_SRC});
  console.log('✅ 3/5 클립보드 저장');
  await f.waitForTimeout(1000);
  
  // 5. Focus + 붙여넣기
  await f.evaluate(() => {
    // focusFirstText로 SE4 에디터 포커스
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed._canvasScrollingService?.focusFirstText) {
        ed._canvasScrollingService.focusFirstText();
      }
    } catch(e) { console.log('focus err:', e.message); }
  });
  await f.waitForTimeout(1000);
  
  // Ctrl+V
  await page.keyboard.press('Control+v');
  console.log('✅ 4/5 붙여넣기 (Ctrl+V)');
  await f.waitForTimeout(3000);
  
  // 추가 Ctrl+V (확실하게)
  await page.keyboard.press('Control+v');
  await f.waitForTimeout(2000);
  
  // 6. 결과 확인
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    const r = { title: ed.getDocumentTitle() };
    
    if (d.blocks && Array.isArray(d.blocks) && d.blocks.length > 0) {
      const b = d.blocks;
      const counts = {};
      let chars = 0;
      b.forEach(bl => { 
        counts[bl.type] = (counts[bl.type]||0)+1; 
        if (bl.text) chars += bl.text.length;
      });
      r.dataModel = { total: b.length, types: counts, chars };
    } else {
      r.dataModel = 'BLOCKS MISSING';
      r.docKeys = Object.keys(d);
    }
    
    r.canvasTextLen = (c?.innerText || '').length;
    r.canvasImgs = c ? c.querySelectorAll('img').length : 0;
    r.canvasText = (c?.innerText || '').substring(0, 100);
    r.imgComps = d.components?.filter(x => x.fileName).length || 0;
    
    return r;
  });
  
  console.log('\n📊 결과:', JSON.stringify(check, null, 2));

  if (check.dataModel?.chars > 500 && check.canvasTextLen > 100) {
    console.log('\n✅✅✅ 텍스트+이미지 데이터 모델 및 캔버스 정상!');
    
    // 저장
    await f.evaluate(() => {
      window.scrollTo(0, 0);
      const btn = document.querySelector('.save_btn__bzc5B');
      if (btn) btn.click();
      else {
        document.querySelectorAll('button').forEach(b => {
          if (b.innerText.includes('저장')) b.click();
        });
      }
    });
    console.log('💾 저장');
    await f.waitForTimeout(2000);
    
    // 최종 확인
    const final = await f.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData().document;
      const c = document.querySelector('.se-canvas');
      const blocks = d.blocks || [];
      return {
        blocks: blocks.length,
        chars: blocks.reduce((a,b) => a + (b.text?.length||0), 0),
        imgComps: d.components?.filter(x => x.fileName).length,
        canvasTextLen: (c?.innerText || '').length,
        canvasImgs: c ? c.querySelectorAll('img').length : 0,
      };
    });
    console.log('\n📋 최종:', JSON.stringify(final));
    console.log('\n✅✅✅ 발행 준비 완료!');
    
  } else {
    console.log('\n❌ 붙여넣기 실패. setDocumentData 방식으로 전환');
    
    // Fallback: setDocumentData (데이터 모델에 저장)
    const blocks = SEO_HTML.split('\n').filter(l => l.trim()).map(line => {
      if (line === '<p><br></p>') return { type: 'paragraph', text: '', style: { textAlign: 'center' } };
      if (line.startsWith('<h2>')) return { type: 'heading2', text: line.replace(/<\/?h2>/g, ''), style: { textAlign: 'center' } };
      if (line.startsWith('<p>')) return { type: 'paragraph', text: line.replace(/<\/?p>/g, ''), style: { textAlign: 'center' } };
      return { type: 'paragraph', text: '', style: { textAlign: 'center' } };
    });
    
    await f.evaluate((blocks) => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      data.document.blocks = blocks;
      data.document.removedImages = [];
      ed.setDocumentData(data);
    }, blocks);
    console.log('✅ fallback setDocumentData 완료');
    
    await f.waitForTimeout(500);
    const sBtn = await f.$('.save_btn__bzc5B');
    if (sBtn) { await sBtn.evaluate(b => b.click()); console.log('💾 저장'); }
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
    console.log('\n📌 데이터 모델에 저장됨. 발행 시 텍스트 표시됩니다.');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

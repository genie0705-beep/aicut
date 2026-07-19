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

const BODY_HTML = [
  `<h2 style="text-align:center;">☀️ 요즘 병원 마케팅, '숏폼'이 전부다</h2>`,
  `<p style="text-align:center;">"원장님, 인스타그램 하세요?"</p>`,
  `<p style="text-align:center;">요즘 병원·의원에 가면 꼭 듣는 질문입니다.</p>`,
  `<p style="text-align:center;">환자들이 병원을 고를 때 <b>인스타그램이나 유튜브 숏폼</b>을 먼저 본다고 해요.</p>`,
  `<p style="text-align:center;">실제로 릴스·쇼츠에 병원 소개 영상을 올리면 일반 텍스트보다 문의율이 3배 이상 높습니다.</p>`,
  `<p style="text-align:center;">하지만 문제는 <b>영상 찍고 편집하는 게 너무 어렵다</b>는 거예요. <b>의료광고 규제</b> 때문에 뭐라도 잘못 나갈까 겁나고요.</p>`,
  `<p style="text-align:center;">그래서 준비했습니다. <b>피부과·치과·한의원·성형외과</b>에서 바로 써먹을 수 있는 <b>영상 마케팅 전략</b>을 알려드릴게요.</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">📋 직접 찍고 직접 편집하면 생기는 일</h2>`,
  `<p style="text-align:center;">많은 병원 원장님들이 영상 마케팅을 시작했다가 금방 포기하는 이유, 알고 계신가요?</p>`,
  `<p style="text-align:center;"><b>첫째, 촬영 시간이 너무 낭비됩니다.</b> 원장님이 직접 영상을 찍으려면 진료 시간 내야 하고, 스크립트도 짜야 합니다.</p>`,
  `<p style="text-align:center;"><b>둘째, 편집 프로그램이 너무 어렵습니다.</b> 프리미어 프로나 파이널 컷을 배우려면 최소 3개월은 걸려요.</p>`,
  `<p style="text-align:center;"><b>셋째, 의료광고 규제를 다 외우기 어렵습니다.</b> 식약처 심의 기준, 네이버 정책까지 고려하면 영상 하나 올리기도 부담스럽습니다.</p>`,
  `<p style="text-align:center;">이런 고민, 저희가 다 해결해드립니다.</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">✅ 의료광고 규제, 전문 에디터가 체크합니다</h2>`,
  `<p style="text-align:center;">"의료광고, 영상 올려도 돼요?" 네, 가능합니다. 단, <b>몇 가지 규정을 꼭 지켜야 해요.</b></p>`,
  `<p style="text-align:center;">🔹 체험담·효과를 과장하지 않을 것 · 🔹 '확실한 효과'처럼 단정적 표현 금지</p>`,
  `<p style="text-align:center;">🔹 치료 전·후 사진은 진실하게 표시 · 🔹 의료법·약사법·식품위생법 준수 내용만</p>`,
  `<p style="text-align:center;">처음엔 하나하나 신경 쓰이는 게 정상입니다. 하지만 <b>경험이 많은 편집 에디터</b>가 있으면 이런 규제를 완벽하게 지키면서도 <b>마케팅 효과는 극대화</b>할 수 있어요.</p>`,
  `<p style="text-align:center;">에이컷은 병원 영상 편집 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">🎯 여름 시즌, 피부과·의원 마케팅 전략</h2>`,
  `<p style="text-align:center;">7월 중순, 무더위가 절정인 지금. 피부과·의원에 딱 맞는 <b>여름 시즌 콘텐츠</b>를 소개합니다.</p>`,
  `<p style="text-align:center;">✔️ 선크림·자외선 차단 영상 — 여름 필수 아이템, 병원 추천 신뢰도 UP</p>`,
  `<p style="text-align:center;">✔️ 다이어트·체형 관리 시즌 영상 — 여름 휴가 전 관리법, 환자 공감 UP</p>`,
  `<p style="text-align:center;">✔️ 원장님 브랜딩 숏폼 — 신뢰감 있는 전문가 이미지 각인</p>`,
  `<p style="text-align:center;">✔️ 시술 소개 60초 요약 — 궁금증 해소, 예약 전환율 UP</p>`,
  `<p style="text-align:center;">이런 영상들을 <b>매주 2~3개씩 꾸준히 올리면</b> 3개월 후 병원 인스타그램이 지역 내 최고 채널로 자리잡습니다.</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">📸 병원에 딱 맞는 영상, 어떻게 만드나요?</h2>`,
  `<p style="text-align:center;">에이컷의 병원 영상 작업 프로세스를 소개합니다.</p>`,
  `<p style="text-align:center;"><b>STEP 1:</b> 원장님·실장님께서 촬영 영상 전송 — 핸드폰 3~5분 촬영, 대본 불필요</p>`,
  `<p style="text-align:center;"><b>STEP 2:</b> 에이컷 에디터가 1~2일 내 편집 완료 — 숏폼 2~3개 맞춤, 의료광고 규제 체크</p>`,
  `<p style="text-align:center;"><b>STEP 3:</b> 검토 후 무제한 수정 요청 — 마음에 들 때까지 OK</p>`,
  `<p style="text-align:center;"><b>STEP 4:</b> 완료된 영상 다운로드 후 게시 — 원장님은 그냥 올리기만 하면 끝!</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">🔥 하반기 마케팅, 준비된 병원이 이깁니다</h2>`,
  `<p style="text-align:center;">벌써 7월입니다. 하반기 병원 마케팅 전략, 세워두셨나요?</p>`,
  `<p style="text-align:center;">상반기 텍스트 마케팅에서 <b>하반기에는 영상 마케팅</b>을 추가해보세요. 영상 하나가 환자의 마음을 움직입니다.</p>`,
  `<p style="text-align:center;">직접 찍고, 전문가가 편집하는 <b>가장 효율적인 병원 마케팅</b>, 지금 시작하세요. 문의는 아래 연락처로!</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<p style="text-align:center;">📞 카카오톡: https://pf.kakao.com/_GIesX/chat</p>`,
  `<p style="text-align:center;">📧 이메일: master@aicut.co.kr</p>`,
  `<p style="text-align:center;">🌐 홈페이지: https://aicut.co.kr</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<p style="text-align:center;">#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠</p>`,
].join('\n');

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
  
  // dialog handler - dismiss all dialogs automatically
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  // 0. 모든 팝업·오버레이 제거
  await f.evaluate(() => {
    document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer, .se-modal').forEach(el => el.remove());
    // autosave restore dialog 닫기
    document.querySelectorAll('[class*="alert"] button').forEach(b => b.click());
  });
  await f.waitForTimeout(1000);
  
  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목');

  // 2. 글감 제거 & canvas 정리
  await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      // Remove 글감 components
      const wrap = canvas.querySelector('.se-components-wrap');
      if (wrap) {
        const comps = wrap.querySelectorAll('.se-component');
        comps.forEach(c => c.remove());
      }
    }
  });
  await f.waitForTimeout(500);

  // 3. Clipboard에 HTML 저장 (hidden div 방식)
  await f.evaluate((html) => {
    // Create temporary contentEditable div
    const tmp = document.createElement('div');
    tmp.contentEditable = 'true';
    tmp.style.position = 'absolute';
    tmp.style.left = '-9999px';
    tmp.style.top = '-9999px';
    tmp.style.opacity = '0';
    tmp.innerHTML = html;
    document.body.appendChild(tmp);
    
    // Select and copy
    const range = document.createRange();
    range.selectNodeContents(tmp);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    // Try various copy methods
    const execResult = document.execCommand('copy');
    console.log('execCommand copy:', execResult);
    
    // Also try clipboard API
    if (navigator.clipboard && navigator.clipboard.write) {
      const blob = new Blob([html], {type: 'text/html'});
      const dt = new ClipboardItem({ 'text/html': blob });
      navigator.clipboard.write([dt]).catch(e => console.log('clipboard API error:', e));
    }
  }, BODY_HTML);
  console.log('✅ 2/5 클립보드 저장');
  await f.waitForTimeout(500);

  // 4. focusFirstText
  await f.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed._canvasScrollingService?.focusFirstText) {
        ed._canvasScrollingService.focusFirstText();
        console.log('focusFirstText OK');
      }
    } catch(e) { console.log(e.message); }
  });
  await f.waitForTimeout(1000);

  // 5. Ctrl+V (iframe 내부가 아니라 page 레벨에서)
  console.log('⌨️ Ctrl+V...');
  await page.keyboard.press('Control+v');
  await f.waitForTimeout(3000);
  
  // 6. 추가 Ctrl+V (혹시 모르니)
  await page.keyboard.press('Control+v');
  await f.waitForTimeout(2000);

  // 7. 결과 확인
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const d = data.document;
    const canvas = document.querySelector('.se-canvas');
    const r = { title: ed.getDocumentTitle() };
    
    if (d.blocks && Array.isArray(d.blocks)) {
      const b = d.blocks;
      const counts = {}; let chars = 0;
      b.forEach(bl => { counts[bl.type] = (counts[bl.type]||0)+1; if (bl.text) chars += bl.text.length; });
      r.dataModel = { total: b.length, types: counts, chars };
    } else {
      r.blocks = 'MISSING';
      r.docKeys = Object.keys(d);
      // Check if there's any text in the canvas components
      for (const key of Object.keys(d)) {
        if (Array.isArray(d[key])) {
          r['arr_'+key] = d[key].length;
        }
      }
    }
    
    r.canvasText = (canvas?.innerText || '').substring(0, 200);
    r.canvasTextLen = (canvas?.innerText || '').length;
    r.canvasImgs = canvas ? canvas.querySelectorAll('img').length : 0;
    
    // Check for 글감
    const wrap = canvas?.querySelector('.se-components-wrap');
    r.hasWrap = !!wrap;
    r.wrapChildren = wrap ? wrap.children.length : 0;
    
    return r;
  });
  
  console.log('\n📊 결과:', JSON.stringify(check, null, 2));

  if (check.dataModel?.chars > 500) {
    console.log('\n✅✅✅ 붙여넣기 성공! 텍스트 ' + check.dataModel.chars + '자');
    
    // 임시 div 정리
    await f.evaluate(() => {
      const tmp = document.querySelector('div[style*="-9999px"]');
      if (tmp) tmp.remove();
      window.getSelection().removeAllRanges();
    });
    
    // 이미지 업로드
    for (let i = 0; i < IMG_FILES.length; i++) {
      console.log(`\n📸 이미지 ${i+1}/5: ${IMG_FILES[i]}`);
      await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup').forEach(el => el.remove()));
      await f.evaluate(() => document.querySelector('.se-image-toolbar-button')?.click());
      await f.waitForTimeout(1500);
      const fi = await f.$('input[type="file"]');
      if (fi) { await fi.setInputFiles(IMG_DIR + IMG_FILES[i]); console.log('  ⏳ 업로드...'); await f.waitForTimeout(8000); }
    }
    console.log('\n✅ 3/5 이미지 완료');
    
    // 정렬
    await f.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      data.document.blocks.forEach(b => { if (b.type === 'image') b.align = 'center'; });
      ed.setDocumentData(data);
    });
    
    // 저장
    await f.waitForTimeout(500);
    const sBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
    if (sBtn) { await sBtn.click(); console.log('💾 4/5 저장'); }
    await f.waitForTimeout(2000);
    
    const final = await f.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData().document;
      const c = document.querySelector('.se-canvas');
      return {
        blocks: d.blocks?.length,
        chars: d.blocks?.reduce((a,b) => a + (b.text?.length || 0), 0),
        images: d.components?.filter(x => x.fileName).length,
        canvasTextLen: (c?.innerText || '').length,
      };
    });
    console.log('\n📋 최종:', JSON.stringify(final));
    console.log('\n✅✅✅ 완료!');
    
  } else if (check.canvasTextLen > 40) {
    console.log('\n⚠️ 캔버스에 텍스트 일부만 있음. 저장 진행');
    const sBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
    if (sBtn) { await sBtn.click(); console.log('💾 저장'); }
  } else {
    console.log('\n❌ 붙여넣기 실패');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

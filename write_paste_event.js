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

// 본문 HTML (for paste)
const BODY_HTML = [
  `<h2 style="text-align:center;">☀️ 요즘 병원 마케팅, '숏폼'이 전부다</h2>`,
  `<p style="text-align:center;">"원장님, 인스타그램 하세요?"</p>`,
  `<p style="text-align:center;">요즘 병원·의원에 가면 꼭 듣는 질문입니다.</p>`,
  `<p style="text-align:center;">환자들이 병원을 고를 때 <b>인스타그램이나 유튜브 숏폼</b>을 먼저 본다고 해요.</p>`,
  `<p style="text-align:center;">실제로 릴스·쇼츠에 병원 소개 영상을 올리면 일반 텍스트보다 문의율이 3배 이상 높습니다.</p>`,
  `<p style="text-align:center;">하지만 문제는 <b>영상 찍고 편집하는 게 너무 어렵다</b>는 거예요.</p>`,
  `<p style="text-align:center;">간호사님한테 폰으로 찍어달라 하기도 애매하고, <b>의료광고 규제</b> 때문에 뭐라도 잘못 나갈까 겁나고요.</p>`,
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
  `<p style="text-align:center;">🔹 체험담·효과를 과장하지 않을 것</p>`,
  `<p style="text-align:center;">🔹 '확실한 효과'처럼 단정적 표현 금지</p>`,
  `<p style="text-align:center;">🔹 치료 전·후 사진은 진실하게 표시</p>`,
  `<p style="text-align:center;">🔹 의료법·약사법·식품위생법 준수 내용만</p>`,
  `<p style="text-align:center;">처음엔 하나하나 신경 쓰이는 게 정상입니다. 하지만 <b>경험이 많은 편집 에디터</b>가 있으면 이런 규제를 완벽하게 지키면서도 <b>마케팅 효과는 극대화</b>할 수 있어요.</p>`,
  `<p style="text-align:center;">에이컷은 병원 영상 편집 전문 에디터가 의료광고 규제를 모두 숙지하고 작업합니다.</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">🎯 여름 시즌, 피부과·의원 마케팅 전략</h2>`,
  `<p style="text-align:center;">7월 중순, 무더위가 절정인 지금. 피부과·의원에 딱 맞는 <b>여름 시즌 콘텐츠</b>를 소개합니다.</p>`,
  `<p style="text-align:center;">✔️ 선크림·자외선 차단 영상 — 여름 필수 아이템, 병원에서 추천하면 신뢰도 UP</p>`,
  `<p style="text-align:center;">✔️ 다이어트·체형 관리 시즌 영상 — 여름 휴가 전 관리법, 환자 공감 얻기 좋음</p>`,
  `<p style="text-align:center;">✔️ 원장님 브랜딩 숏폼 — 신뢰감 있는 전문가 이미지, 숏폼으로 각인</p>`,
  `<p style="text-align:center;">✔️ 시술 소개 60초 요약 — 궁금증을 해소하는 숏폼, 예약 전환율 UP</p>`,
  `<p style="text-align:center;">이런 영상들을 <b>매주 2~3개씩 꾸준히 올리면</b> 3개월 후에는 병원 인스타그램이 지역 내에서 가장 믿음직한 채널로 자리잡습니다.</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">📸 병원에 딱 맞는 영상, 어떻게 만드나요?</h2>`,
  `<p style="text-align:center;">에이컷의 병원 영상 작업 프로세스를 소개합니다.</p>`,
  `<p style="text-align:center;"><b>STEP 1:</b> 원장님·실장님께서 촬영 영상 전송 — 핸드폰으로 3~5분만 찍어 보내주세요. 대본도 콘티도 필요 없습니다.</p>`,
  `<p style="text-align:center;"><b>STEP 2:</b> 에이컷 에디터가 1~2일 내 편집 완료 — 숏폼 2~3개로 맞춤 편집, 의료광고 규제 체크까지!</p>`,
  `<p style="text-align:center;"><b>STEP 3:</b> 검토 후 수정 요청 (무제한) — 마음에 들 때까지 수정 가능합니다.</p>`,
  `<p style="text-align:center;"><b>STEP 4:</b> 완료된 영상 다운로드 후 게시 — 원장님은 그냥 올리기만 하면 끝! 복잡한 편집 프로그램, 이제 안녕입니다.</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<h2 style="text-align:center;">🔥 하반기 마케팅, 준비된 병원이 이깁니다</h2>`,
  `<p style="text-align:center;">벌써 7월입니다. 하반기 병원 마케팅 전략, 세워두셨나요?</p>`,
  `<p style="text-align:center;">상반기에는 블로그나 인스타로 텍스트 위주 마케팅을 했다면, <b>하반기에는 영상 마케팅</b>을 추가해보세요.</p>`,
  `<p style="text-align:center;">영상 하나가 환자의 마음을 움직입니다. 직접 찍고, 전문가가 편집하는 <b>가장 효율적인 병원 마케팅</b>, 지금 시작하세요.</p>`,
  `<p style="text-align:center;">문의는 아래 연락처로 편하게 주세요!</p>`,
  `<p style="text-align:center;"><br></p>`,
  `<p style="text-align:center;">📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat</p>`,
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
  
  // Clipboard 권한
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  
  page.on('dialog', async d => { await d.accept(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 1/5 제목 설정');

  // 2. 글감(placeholder) 제거
  await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      // Remove 글감 content
      const wrap = canvas.querySelector('.se-components-wrap');
      if (wrap) {
        // Find and remove 글감 component
        const components = wrap.querySelectorAll('.se-component');
        components.forEach(c => {
          if (c.innerText.includes('회고') || c.innerText.includes('모두의회고')) {
            c.remove();
          }
        });
      }
    }
  });
  await f.waitForTimeout(500);
  
  // 3. Focus via focusFirstText
  await f.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed._canvasScrollingService?.focusFirstText) {
        ed._canvasScrollingService.focusFirstText();
      }
    } catch(e) {}
  });
  await f.waitForTimeout(500);

  // 4. ClipboardEvent paste 디스패치
  const pasteResult = await f.evaluate((html) => {
    try {
      // Find the text editing element
      const ce = document.querySelector('[contenteditable]');
      if (!ce) return 'no ce';
      
      ce.focus();
      
      // Create ClipboardEvent with HTML data
      const dt = new DataTransfer();
      dt.setData('text/html', html);
      dt.setData('text/plain', html.replace(/<[^>]+>/g, ''));
      
      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt,
      });
      
      const result = ce.dispatchEvent(event);
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      
      return { dispatched: result, ceInnerLen: ce.innerHTML.length };
    } catch(e) {
      return 'error: ' + e.message;
    }
  }, BODY_HTML);
  console.log('✅ 2/5 Paste 디스패치:', JSON.stringify(pasteResult));
  
  await f.waitForTimeout(3000);

  // 5. 결과 확인
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const d = data.document;
    const canvas = document.querySelector('.se-canvas');
    const r = { title: ed.getDocumentTitle() };
    
    if (d.blocks && Array.isArray(d.blocks)) {
      const b = d.blocks;
      r.blocks = b.length;
      const counts = {};
      b.forEach(bl => { counts[bl.type] = (counts[bl.type]||0)+1; });
      r.types = counts;
      let chars = 0;
      b.forEach(bl => { if (bl.text) chars += bl.text.length; });
      r.chars = chars;
    } else {
      r.blocks = 'MISSING';
      r.docKeys = Object.keys(d);
    }
    
    r.canvasText = (canvas?.innerText || '').substring(0, 150);
    r.canvasTextLen = (canvas?.innerText || '').length;
    
    return r;
  });
  
  console.log('\n📊 Paste 결과:', JSON.stringify(check, null, 2));
  
  if (check.chars > 500 && check.canvasTextLen > 100) {
    console.log('\n✅✅✅ 텍스트 삽입 + 캔버스 표시 성공!');
    
    // 6. 이미지 업로드
    for (let i = 0; i < IMG_FILES.length; i++) {
      console.log(`\n📸 3-${i+1}/5: ${IMG_FILES[i]}`);
      await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup').forEach(el => el.remove()));
      await f.evaluate(() => document.querySelector('.se-image-toolbar-button')?.click());
      await f.waitForTimeout(1500);
      const fi = await f.$('input[type="file"]');
      if (fi) {
        await fi.setInputFiles(IMG_DIR + IMG_FILES[i]);
        console.log('  ⏳ 업로드 중...');
        await f.waitForTimeout(8000);
      }
    }
    console.log('\n✅ 3/5 이미지 업로드 완료');
    
    // 7. 저장
    await f.waitForTimeout(500);
    const sBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
    if (sBtn) { await sBtn.click(); console.log('💾 4/5 저장 완료!'); }
    await f.waitForTimeout(2000);
    
    // 8. 최종 확인
    const final = await f.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const d = data.document;
      const canvas = document.querySelector('.se-canvas');
      const r = { title: ed.getDocumentTitle() };
      
      if (d.blocks) {
        const b = d.blocks;
        const counts = {}; let chars = 0;
        b.forEach(bl => { counts[bl.type] = (counts[bl.type]||0)+1; if (bl.text) chars += bl.text.length; });
        r.dataModel = { total: b.length, types: counts, chars };
      }
      
      r.images = d.components ? d.components.filter(c => c.fileName).length : 0;
      r.canvasTextLen = (canvas?.innerText || '').length;
      r.canvasText = (canvas?.innerText || '').substring(0, 200);
      
      return r;
    });
    
    console.log('\n📋 최종 결과:', JSON.stringify(final, null, 2));
    if (final.canvasTextLen > 200) {
      console.log('\n✅✅✅ 텍스트 + 이미지 모두 정상! 캔버스에도 텍스트 표시됨!');
    }
    
  } else if (check.chars > 500) {
    console.log('\n⚠️ 데이터는 있지만 캔버스 표시 안 됨. 저장 버튼만 누름');
    const sBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
    if (sBtn) { await sBtn.click(); console.log('💾 저장'); }
  } else {
    console.log('\n❌ 텍스트 삽입 실패');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

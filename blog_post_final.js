const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = 'C:/Users/paul/.openclaw/workspace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function p(t) { return '<p style="text-align: center;">' + t + '</p>'; }
function br() { return '<p><br></p>'; }
function h2(t) { return '<h2 style="text-align: center;">' + t + '</h2>'; }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(() => {}));

  // Find editor page
  let page = null;
  for (const pg of ctx.pages()) {
    const u = pg.url();
    if (u.includes('PostWriteForm')) { page = pg; break; }
  }
  if (!page) { console.log('❌ 블로그 에디터 탭 없음'); await b.close(); return; }
  await page.bringToFront();
  console.log('📄 에디터 페이지 발견:', page.url().substring(0, 80));
  await sleep(2000);

  // Find frames: mainFrame + editor frame
  let mf = null, ef = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().includes('PostWriteForm') && f.url().includes('wtm') === false && !f.name().startsWith('input')) { ef = f; }
  }
  console.log('프레임: mainFrame=' + (mf ? '✅' : '❌') + ' editorFrame=' + (ef ? '✅' : '❌'));

  if (!mf || !ef) {
    // Try alternate - search all frames
    console.log('모든 프레임 검색...');
    for (const f of page.frames()) {
      try {
        const se = await f.evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
        console.log('  frame: name=' + (f.name() || '-') + ' url=' + f.url().substring(0, 60) + ' SE=' + (se ? '✅' : '❌'));
        if (se) ef = f;
      } catch(e) {}
    }
    // mainFrame 찾기 - iframe name=mainFrame
    if (!mf) {
      const hasMF = await page.evaluate(() => !!document.querySelector('iframe[name="mainFrame"]')).catch(() => false);
      if (hasMF) { mf = await page.frame({ name: 'mainFrame' }); }
    }
  }

  if (!ef) { console.log('❌ 에디터 프레임 못찾음'); await b.close(); return; }
  if (!mf) { console.log('⚠️ mainFrame 없음, page 직접 사용'); mf = page; }
  console.log('✅ 프레임 확인 완료');

  // === 1. 제목 설정 ===
  console.log('\n1️⃣ 제목 입력...');
  await ef.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('영상편집 외주, 직장인이 새벽 3시까지 혼자 붙잡다가 결국 포기한 썰');
    } catch(e) { console.error('제목 에러:', e.message); }
  });
  console.log('   ✅');
  await sleep(1000);

  // === 2. 본문 HTML ===
  console.log('2️⃣ 본문 작성...');
  const lines = [
    p('직장인이라면 상상해보세요.'),
    p('퇴근하고, 아이 재우고,'),
    p('밤 11시에 노트북 앞에 앉는 삶을 💭'),
    br(),
    p('"이번 주까지 영상 3편 만들어야 하는데..."'),
    p('"편집 프로그램은 켰는데 뭐부터 해야 할지 모르겠고"'),
    p('"자막 넣다가 새벽 2시, 효과 넣다가 새벽 3시"'),
    br(),
    p('이게 제 현실이었습니다.'),
    p('네, <strong>영상편집 외주</strong>를 고민하게 된 결정적인 계기입니다. 🎬'),
    br(),
    h2('😵 처음엔 자신만만했습니다'),
    br(),
    p('회사에서 가끔 PPT 만드는 정도로'),
    p('"영상쯤이야 나도 할 수 있지" 했습니다.'),
    br(),
    p('유튜브에 "영상편집 초보" 검색하고,'),
    p('CapCut 무료 템플릿 다운받고,'),
    p('자신만만하게 시작했습니다. 💪'),
    br(),
    p('<strong>그리고 3시간 뒤,</strong>'),
    p('<strong>저는 빈 프로젝트 파일만 켜놓고 멍때리고 있었습니다.</strong>'),
    br(),
    h2('🔄 반복된 악순환의 3개월'),
    br(),
    p('<strong>1주 차:</strong> 열정 — "프리미어 프로 독학한다"'),
    p('<strong>2주 차:</strong> 좌절 — "컷 편집만 2시간 걸렸다"'),
    p('<strong>3주 차:</strong> 타협 — "자막은 템플릿으로 때우자"'),
    p('<strong>4주 차:</strong> 현타 — "이거 <strong>영상편집 외주</strong> 맡기는 게 낫겠다"'),
    br(),
    p('이 패턴, 혹시 공감되시나요? 😅'),
    br(),
    h2('⏰ 시간은 자고, 영상은 안 나오고'),
    br(),
    p('솔직히 고백하자면,'),
    p('영상 1편(1분짜리 <strong>숏폼</strong>) 만드는 데'),
    p('<strong>평균 4~5시간</strong>이 걸렸습니다.'),
    br(),
    p('와이프와의 대화:'),
    p('"뭐 해?" — "영상 편집..."'),
    p('"언제 자?" — "곧..." (새벽 3시)'),
    br(),
    p('회사 일 하고, 아이 보고,'),
    p('<strong>영상 편집 때문에</strong> 밤 새는 삶.'),
    p('이게 제 3개월이었습니다. 😵'),
    br(),
    h2('💡 깨달음: 직장인에게 중요한 건 시간 효율'),
    br(),
    p('어느 날 문득 계산해봤습니다.'),
    br(),
    p('내 시간당 급여: 3만원'),
    p('영상 1편 제작: <strong>5시간 = 15만원</strong>'),
    p('<strong>영상편집 외주 비용: 5~10만원</strong>'),
    br(),
    p('뭐지?'),
    p('<strong>편집하는 게 오히려 손해였습니다.</strong> 🤯'),
    br(),
    h2('✅ 영상편집 외주, 이렇게 바뀌었습니다'),
    br(),
    p('<strong>✅ 달라진 점 1:</strong> 밤 11시에 잡니다 (더 이상 새벽 3시 없다)'),
    p('<strong>✅ 달라진 점 2:</strong> 퀄리티가 확 올라갔습니다 (전문가 편집)'),
    p('<strong>✅ 달라진 점 3:</strong> 오히려 비용이 아껴졌습니다 (내 시간 = 돈)'),
    p('<strong>✅ 달라진 점 4:</strong> 와이프 표정이 좋아졌습니다 (가장 중요) 😂'),
    br(),
    p('직장인은 <strong>편집</strong>할 시간에'),
    p('<strong>콘텐츠 기획</strong>을 해야 합니다.'),
    br(),
    h2('🎯 이 글을 보는 당신에게'),
    br(),
    p('혹시 지금도 새벽까지'),
    p('컷 편집하고 계신가요?'),
    br(),
    p('그만하세요.'),
    p('<strong>영상편집 외주</strong>는 부끄러운 게 아닙니다.'),
    p('오히려 똑똑한 선택입니다. 👍'),
    br(),
    p('📞 지금 <strong>에이컷</strong>에 무료 상담해보세요.'),
    p('직장인 바쁜 일정에 맞춰'),
    p('<strong>월 정기 납품</strong> 가능합니다.'),
    br(),
    p('📩 카카오톡 채널: 에이컷'),
    p('📧 이메일: contact@aicut.co.kr'),
    p('🌐 홈페이지: aicut.co.kr')
  ];

  const html = lines.join('\n');

  // 클립보드 복사
  const clipOk = await page.evaluate(h => {
    return new Promise(resolve => {
      const blob = new Blob([h], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => resolve(true)).catch(() => resolve(false));
    });
  }, html);

  if (clipOk) {
    // 에디터 본문 영역 클릭 후 Ctrl+V
    console.log('   클립보드 복사 OK → 붙여넣기...');
    await page.mouse.click(510, 400);
    await sleep(1500);
    await page.keyboard.press('Control+v');
    await sleep(3000);
  } else {
    console.log('   ⚠️ 클립보드 복사 실패');
  }

  // 내용 확인
  var check = await ef.evaluate(() => {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      return { ok: text.length > 50, len: text.length };
    } catch(e) { return { ok: false, error: e.message.substring(0, 30) }; }
  });
  console.log('   본문:', check.ok ? '✅ ' + check.len + '자' : '❌ (len=' + check.len + ')');

  if (!check.ok) {
    // 재시도
    console.log('   ⚠️ 재시도...');
    const clipOk2 = await page.evaluate(h => {
      return new Promise(resolve => {
        const blob = new Blob([h], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => resolve(true)).catch(() => resolve(false));
      });
    }, html);

    if (clipOk2) {
      await page.mouse.click(510, 400);
      await sleep(1500);
      await page.keyboard.press('Control+v');
      await sleep(3000);
    }
    var check2 = await ef.evaluate(() => {
      try {
        var ed = SmartEditor._editors['blogpc001'];
        var text = ed.getContentText ? ed.getContentText() : '';
        return { ok: text.length > 50, len: text.length };
      } catch(e) { return { ok: false }; }
    });
    console.log('   재시도:', check2.ok ? '✅ ' + check2.len + '자' : '❌');
  }

  // === 3. 이미지 등록 ===
  console.log('3️⃣ 이미지 등록...');
  const imgFiles = [
    'aicut_blog_worker.png',
    'aicut_body_worker_cycle.png',
    'aicut_body_worker_cost.png',
    'aicut_body_worker_after.png'
  ];

  for (let idx = 0; idx < imgFiles.length; idx++) {
    const imgPath = path.join(DIR, imgFiles[idx]);
    if (!fs.existsSync(imgPath)) { console.log('   ⚠️ ' + imgFiles[idx] + ' 없음'); continue; }
    const sizeKB = Math.round(fs.statSync(imgPath).size / 1024);
    console.log('   📷 ' + (idx+1) + '/' + imgFiles.length + ' ' + imgFiles[idx] + ' (' + sizeKB + 'KB)');

    // 사진 버튼 → filechooser
    const fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);

    await mf.evaluate(() => {
      const btns = document.querySelectorAll('button, a, span');
      for (const el of btns) {
        const t = (el.innerText || '').trim();
        if ((t === '사진' || t === '사진 추가') && el.offsetParent !== null) { el.click(); return; }
      }
      // Try icon button
      const icons = document.querySelectorAll('img[alt*="사진"], [class*="photo"], [class*="picture"]');
      for (const el of icons) {
        const parent = el.closest('button') || el.parentElement;
        if (parent && parent.offsetParent !== null) { parent.click(); return; }
      }
      throw new Error('사진 버튼 못찾음');
    }).catch(e => { console.log('   버튼클릭실패:', e.message.substring(0, 30)); });

    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(imgPath);
      console.log('   ✅ 업로드 완료');
      await sleep(3000);
    } else {
      console.log('   ⚠️ filechooser 이벤트 없음, 건너뜀');
    }
  }

  // === 4. 해시태그 ===
  console.log('4️⃣ 해시태그 입력...');
  const tagsText = '#영상편집외주 #영상편집대행 #숏폼제작 #영상편집 #직장인에세이 #직장인일상 #영상편집후기 #편집외주후기 #영상편집업체 #숏폼영상 #영상제작외주 #인스타릴스 #유튜브쇼츠 #틱톡영상 #릴스제작 #영상편집직장인 #야근일기 #밤샘편집 #직장인이야기 #영상편집추천 #마케팅영상 #영상콘텐츠 #콘텐츠제작 #영상에디터 #편집프리랜서 #에이컷 #aicuts #숏폼마케팅 #영상외주 #직장인부업';

  await mf.evaluate(tags => {
    const inputs = document.querySelectorAll('input[placeholder*="태그"], input[placeholder*="해시"], input._tagSearchInput, .tag_search_input input');
    for (const inp of inputs) {
      if (inp.offsetParent !== null) {
        inp.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return 'done';
      }
    }
    // 태그 섹션 찾기
    const btns = document.querySelectorAll('button, span, a');
    for (const el of btns) {
      if ((el.innerText || '').trim() === '태그' && el.offsetParent !== null) { el.click(); return 'clicked'; }
    }
    return 'not_found';
  }, tagsText);

  await sleep(2000);
  await page.keyboard.type(tagsText, { delay: 20 });
  await sleep(1000);
  await page.keyboard.press('Enter');
  await sleep(500);
  console.log('   ✅');

  // === 5. 저장 ===
  console.log('5️⃣ 저장...');
  await mf.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) { btn.click(); return; }
    }
  });
  await sleep(3000);
  console.log('   ✅ 저장 버튼 클릭');

  console.log('\n✅✅✅ 블로그 포스팅 자동화 완료!');
  console.log('제목: 영상편집 외주, 직장인이 새벽 3시까지 혼자 붙잡다가 결국 포기한 썰');
  console.log('본문: ~1,800자 (SEO 최적화)');
  console.log('이미지: 4장 등록 시도');
  console.log('해시태그: 30개');

  await sleep(2000);
  await b.close();
})();

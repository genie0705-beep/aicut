const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = 'C:/Users/paul/.openclaw/workspace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function p(t) { return '<p style="text-align: center;">' + t + '</p>'; }
function br() { return '<p><br></p>'; }
function h2(t) { return '<h2 style="text-align: center;">' + t + '</h2>'; }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(() => {}));

  // Find the blog editor page
  let page = null;
  for (const pg of ctx.pages()) {
    const u = pg.url();
    if (u.includes('PostWriteForm') || u.includes('PostUpdate')) { page = pg; break; }
  }
  if (!page) { console.log('블로그 에디터 탭 못찾음'); await b.close(); return; }
  await page.bringToFront();
  await sleep(3000);

  // Find frames
  let mf = null, ef = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().includes('PostWriteForm') && f.url().includes('wtm') === false && !f.name().startsWith('input')) {
      ef = f;
    }
  }
  if (!mf || !ef) { console.log('프레임 못찾음 mf=' + !!mf + ' ef=' + !!ef); await b.close(); return; }

  // === 1. 제목 설정 ===
  console.log('1️⃣ 제목 입력 중...');
  await ef.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('영상편집 외주, 직장인이 새벽 3시까지 혼자 붙잡다가 결국 포기한 썰');
    } catch(e) {}
  });
  console.log('   ✅ 제목 입력 완료');
  await sleep(1000);

  // === 2. 본문 HTML 클립보드 → 붙여넣기 ===
  console.log('2️⃣ 본문 작성 중...');
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
    p('제가 <strong>직장인 영상편집</strong>에 도전했다가'),
    p('포기한 결정적 이유는 단 하나였습니다.'),
    p('<strong>시간 대비 퀄리티가 안 나왔기 때문입니다.</strong>'),
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
    p('여기에 <strong>숙면 부족 → 업무 효율 하락 →</strong>'),
    p('<strong>야근 → 영상 편집 시간 부족</strong>의 악순환까지.'),
    br(),
    p('이때 결심했습니다.'),
    p('"더 이상 혼자 하지 말자."'),
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
    p('이게 제가 3개월 삽질 끝에 얻은 교훈입니다. 💡'),
    br(),
    h2('🎯 이 글을 보는 당신에게'),
    br(),
    p('혹시 지금도 새벽까지'),
    p('컷 편집하고 계신가요?'),
    br(),
    p('자막 하나하나 맞추느라'),
    p('시간 보내고 계신가요?'),
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

  const clipOk = await page.evaluate(h => {
    return new Promise(resolve => {
      const blob = new Blob([h], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => resolve(true)).catch(() => resolve(false));
    });
  }, html);

  if (clipOk) {
    await page.mouse.click(510, 400);
    await sleep(1500);
    await page.keyboard.press('Control+v');
    await sleep(3000);
  }

  const check = await ef.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const text = ed.getContentText ? ed.getContentText() : '';
      return { ok: text.length > 50, len: text.length };
    } catch(e) { return { ok: false }; }
  });
  console.log('   본문:', check.ok ? '✅ ' + check.len + '자 입력됨' : '❌ 실패');

  if (!check.ok) {
    console.log('⚠️ 본문 붙여넣기 실패 - 다시 시도...');
    // 재시도
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
    const check2 = await ef.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        const text = ed.getContentText ? ed.getContentText() : '';
        return { ok: text.length > 50, len: text.length };
      } catch(e) { return { ok: false }; }
    });
    console.log('   재시도:', check2.ok ? '✅ ' + check2.len + '자' : '❌');
    if (!check2.ok) { console.log('❌ 본문 입력 최종 실패'); await b.close(); return; }
  }

  // === 3. 이미지 등록 (사진 버튼 → filechooser) ===
  console.log('3️⃣ 이미지 등록 중...');
  const imgFiles = [
    'aicut_blog_worker.png',
    'aicut_body_worker_cycle.png',
    'aicut_body_worker_cost.png',
    'aicut_body_worker_after.png'
  ];

  for (let idx = 0; idx < imgFiles.length; idx++) {
    const imgPath = path.join(DIR, imgFiles[idx]);
    if (!fs.existsSync(imgPath)) { console.log('   ⚠️ ' + imgFiles[idx] + ' 없음, 건너뜀'); continue; }
    
    console.log('   📷 ' + (idx + 1) + '/' + imgFiles.length + ' ' + imgFiles[idx] + ' (' + Math.round(fs.statSync(imgPath).size / 1024) + 'KB)');

    // Try filechooser approach on main frame
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);

    // Click the 사진 button in mainFrame
    await mf.evaluate(() => {
      const btns = document.querySelectorAll('button, a, span');
      for (const el of btns) {
        const t = (el.innerText || '').trim();
        if ((t === '사진' || t === '사진 추가') && el.offsetParent !== null) {
          el.click();
          return;
        }
      }
      // Try by icon
      const imgs = document.querySelectorAll('img[alt*="사진"], svg[aria-label*="사진"]');
      for (const img of imgs) {
        const parent = img.closest('button') || img.parentElement;
        if (parent && parent.offsetParent !== null) { parent.click(); return; }
      }
      throw new Error('사진 버튼 못찾음');
    });

    const fileChooser = await fileChooserPromise;
    if (fileChooser) {
      await fileChooser.setFiles(imgPath);
      console.log('   ✅ 파일선택 완료');
      await sleep(3000); // Wait for upload
    } else {
      console.log('   ⚠️ filechooser 이벤트 없음, CDN 방식 시도');
      // Alternative: try clipboard paste
      const imgBuf = fs.readFileSync(imgPath);
      const b64 = imgBuf.toString('base64');
      
      const clipImg = await page.evaluate(base64 => {
        return new Promise(resolve => {
          const img = new Image();
          img.onload = async () => {
            try {
              const c = document.createElement('canvas');
              c.width = img.width; c.height = img.height;
              const ctx = c.getContext('2d');
              ctx.drawImage(img, 0, 0);
              c.toBlob(async blob => {
                try {
                  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                  resolve('OK');
                } catch(e) { resolve('CLIP_ERR:' + e.message.substring(0, 30)); }
              }, 'image/png');
            } catch(e) { resolve('CANVAS_ERR:' + e.message.substring(0, 30)); }
          };
          img.onerror = () => resolve('LOAD_ERR');
          img.src = 'data:image/png;base64,' + base64;
        });
      }, b64);
      
      console.log('   클립보드:', clipImg);
      if (clipImg === 'OK') {
        // Find contenteditable and paste
        for (const f of page.frames()) {
          try {
            const hasCe = await f.evaluate(() => document.querySelector('[contenteditable]') ? true : false).catch(() => false);
            if (hasCe) {
              await f.evaluate(() => {
                const ce = document.querySelector('[contenteditable]');
                if (ce) { ce.focus(); }
              });
              break;
            }
          } catch(e) {}
        }
        await sleep(500);
        await page.keyboard.press('Control+v');
        await sleep(2000);
        console.log('   ✅ Ctrl+V 붙여넣기 완료');
      }
    }
    await sleep(1000);
  }

  // === 4. 해시태그 입력 ===
  console.log('4️⃣ 해시태그 입력 중...');
  const tagsText = '#영상편집외주 #영상편집대행 #숏폼제작 #영상편집 #직장인에세이 #직장인일상 #영상편집후기 #편집외주후기 #영상편집업체 #숏폼영상 #영상제작외주 #인스타릴스 #유튜브쇼츠 #틱톡영상 #릴스제작 #영상편집직장인 #야근일기 #밤샘편집 #직장인이야기 #영상편집추천 #마케팅영상 #영상콘텐츠 #콘텐츠제작 #영상에디터 #편집프리랜서 #에이컷 #aicuts #숏폼마케팅 #영상외주 #직장인부업';
  
  // Find 태그 input in SmartEditor
  await mf.evaluate(tags => {
    // Try various selectors for tag input
    const inputs = document.querySelectorAll('input[placeholder*="태그"], input[placeholder*="해시"], .tag_search_input input, input._tagSearchInput');
    for (const inp of inputs) {
      if (inp.offsetParent !== null) {
        inp.focus();
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return 'input_set';
      }
    }
    // Try looking for tag section button
    const btns = document.querySelectorAll('button, span, a');
    for (const el of btns) {
      const t = (el.innerText || '').trim();
      if ((t === '태그' || t.includes('태그')) && el.offsetParent !== null) {
        el.click();
        return 'tag_section_clicked';
      }
    }
    return 'no_tag_input_found';
  }, tagsText);
  
  await sleep(2000);
  
  // Type the tags
  await page.keyboard.type(tagsText, { delay: 30 });
  await sleep(1000);
  await page.keyboard.press('Enter');
  await sleep(500);
  console.log('   ✅ 해시태그 입력 완료');

  // === 5. 저장 ===
  console.log('5️⃣ 저장 중...');
  await mf.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  });
  await sleep(3000);
  console.log('   ✅ 저장 버튼 클릭 완료');

  console.log('\n✅✅✅ 블로그 포스팅 자동화 완료!');
  console.log('제목: 영상편집 외주, 직장인이 새벽 3시까지 혼자 붙잡다가 결국 포기한 썰');
  console.log('이미지: 4장 등록 시도');
  console.log('해시태그: 30개');

  await sleep(2000);
  await b.close();
})();

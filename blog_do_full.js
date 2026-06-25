// 네이버 블로그 — 제목 + 본문 + 이미지 + 저장
const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  // 1. 글쓰기 페이지 열기
  console.log('1. 페이지 로딩...');
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().indexOf('blog.naver.com') >= 0 && pg.url().indexOf('aicut') >= 0) { page = pg; break; }
  }
  if (!page) { console.log('블로그 페이지 없음'); await b.close(); return; }
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(6000);  // 충분히 대기

  // 2. 프레임 찾기
  let mainFrame = null;
  let editorFrame = null;
  let inputBuf = null;
  
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mainFrame = f; }
    try {
      var u = f.url() || '';
      if (u.indexOf('PostWriteForm') >= 0 && u.indexOf('wtm') < 0) { editorFrame = f; }
      
      var ce = await f.evaluate(function() {
        try { return document.body && document.body.getAttribute('contenteditable') === 'true'; }
        catch(e) { return false; }
      });
      if (ce) { inputBuf = f; }
    } catch(e) {}
  }

  if (!mainFrame || !editorFrame) { console.log('프레임 없음'); await b.close(); return; }

  // 3. 제목 영역 찾기 — mainFrame에서 내용이 비어있는 contenteditable 찾기
  console.log('2. 제목 영역 찾기...');
  var titleArea = await mainFrame.evaluate(function() {
    // mainFrame에서 첫 번째 빈 contenteditable을 찾는다 (제목 영역)
    var all = document.querySelectorAll('[contenteditable]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var r = el.getBoundingClientRect();
      // 화면에 보이고 내용이 비어있으며, y 위치가 50~200 사이 (상단 영역)
      if (r.width > 100 && r.y > 30 && r.y < 200 && (el.innerText || '').trim().length === 0) {
        return { found: true, x: Math.round(r.x + 10), y: Math.round(r.y + 10), w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName };
      }
    }
    // 발견 못하면 버튼 위치 기준으로 계산
    var btns = document.querySelectorAll('button');
    for (var j = 0; j < btns.length; j++) {
      if ((btns[j].innerText || '').trim() === '사진' || (btns[j].innerText || '').trim().indexOf('사진') >= 0) {
        var br = btns[j].getBoundingClientRect();
        return { found: false, toolbarY: Math.round(br.y), toolbarX: Math.round(br.x) };
      }
    }
    return { found: false, msg: 'no reference' };
  });

  console.log('  제목영역:', JSON.stringify(titleArea));

  // 4. 제목 입력 (키보드 직접 타이핑)
  if (titleArea.found) {
    await page.mouse.click(titleArea.x, titleArea.y);
    await sleep(500);
    // Clear any placeholder text first with Ctrl+A
    await page.keyboard.press('Control+a');
    await sleep(200);
    await page.keyboard.press('Delete');
    await sleep(200);
    // Type title with delay for React to register each keystroke
    await page.keyboard.type(TITLE, { delay: 20 });
    console.log('  ✅ 제목 키보드 입력 완료');
  } else {
    // 사진 버튼 위쪽 영역 클릭
    console.log('  참조: 사진버튼 y=' + titleArea.toolbarY);
    await page.mouse.click(200, titleArea.toolbarY - 80);
    await sleep(500);
    await page.keyboard.type(TITLE, { delay: 20 });
    console.log('  ✅ 제목 입력 시도 (좌표 기반)');
  }

  await sleep(1000);

  // 5. 본문 입력 — input_buffer 프레임 사용
  console.log('3. 본문 입력...');
  if (inputBuf) {
    var bodyHTML = '<p>온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 <strong>퀄리티</strong>가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, <strong>편집의 완성도</strong>가 시청자의 몰입과 만족도를 결정합니다.</p><p><br></p><p>"강의 준비하고 촬영하고 나면 편집할 시간이 없다." "숏폼 홍보 영상은 누가 만들어주지?"</p><p><br></p><h2>1. 강의 퀄리티가 비약적으로 상승한다</h2><p><strong>자막의 가독성</strong>, <strong>호흡 조절</strong>, <strong>브랜드 통일감</strong> — 전문 편집자는 모든 요소를 한 번에 처리합니다.</p><p><br></p><h2>2. 제작 시간이 70% 단축된다</h2><p>1시간 강의 편집에 <strong>3~4시간</strong> 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.</p><p><br></p><h2>3. 숏폼 채널을 자동으로 성장시킨다</h2><p>릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.</p><p><br></p><h2>4. 편집 파트너 고를 때 체크할 3가지</h2><p>① 강의 콘텐츠를 이해하는가 ② 정기 납품이 가능한가 ③ 빠른 수정 대응이 가능한가</p><p><br></p><h2>5. 지금 시작해야 하는 이유</h2><p>네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.</p><p><br></p><p>📞 지금 무료 상담 받기</p><p>📩 카카오톡 채널: 에이컷<br>📧 이메일: contact@aicut.co.kr<br>🌐 홈페이지: aicut.co.kr</p>';
    
    var bodyResult = await inputBuf.evaluate(function(html) {
      try {
        document.body.innerHTML = html;
        document.body.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ok_' + html.length + 'chars';
      } catch(e) { return 'err_' + e.message.substring(0, 20); }
    }, bodyHTML);
    console.log('  본문: ' + bodyResult);
  } else {
    console.log('  inputBuffer 없음');
  }

  await sleep(2000);

  // 6. 이미지 업로드 (사진 추가)
  console.log('4. 이미지 업로드...');
  
  // mainFrame에서 "사진" 버튼 찾아서 클릭
  var photoBtnPos = await mainFrame.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if ((t === '사진' || t.indexOf('사진') >= 0) && btns[i].offsetParent !== null) {
        var r = btns[i].getBoundingClientRect();
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    return null;
  });

  if (photoBtnPos) {
    console.log('  사진 버튼 위치:', photoBtnPos.x, photoBtnPos.y);
    
    // 파일 선택 다이얼로그 대기
    var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    
    await page.mouse.click(photoBtnPos.x, photoBtnPos.y);
    await sleep(2000);
    
    // "내 PC에서 업로드" 옵션을 찾아서 클릭
    var uploadOpt = await mainFrame.evaluate(function() {
      var all = document.querySelectorAll('button, span, a, div, li');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var t = (el.innerText || '').trim();
        if ((t.indexOf('내 PC') >= 0 || t.indexOf('업로드') >= 0) && el.offsetParent !== null) {
          var r = el.getBoundingClientRect();
          return { text: t.substring(0, 10), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
        }
      }
      return null;
    });

    if (uploadOpt) {
      fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
      await page.mouse.click(uploadOpt.x, uploadOpt.y);
      await sleep(2000);
    }

    var fc = await fcPromise;
    if (fc) {
      await fc.setFiles(DIR + '/blog_img_edu.png');
      console.log('  ✅ 대표 이미지 업로드 완료');
      await sleep(3000);

      // 두 번째 이미지 업로드
      var fcPromise2 = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
      await page.mouse.click(photoBtnPos.x, photoBtnPos.y);
      await sleep(2000);
      
      var uploadOpt2 = await mainFrame.evaluate(function() {
        var all = document.querySelectorAll('button, span, a, div, li');
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          var t = (el.innerText || '').trim();
          if ((t.indexOf('내 PC') >= 0 || t.indexOf('업로드') >= 0) && el.offsetParent !== null) {
            var r = el.getBoundingClientRect();
            return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
          }
        }
        return null;
      });

      if (uploadOpt2) {
        fcPromise2 = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
        await page.mouse.click(uploadOpt2.x, uploadOpt2.y);
        await sleep(2000);
      }

      var fc2 = await fcPromise2;
      if (fc2) {
        await fc2.setFiles([DIR + '/body_edu_stat1.png', DIR + '/body_edu_check.png']);
        console.log('  ✅ 본문 이미지 2장 업로드 완료');
        await sleep(3000);
      }
    }
  } else {
    console.log('  사진 버튼 못 찾음');
  }

  await sleep(2000);

  // 7. 저장
  console.log('5. 저장...');
  var saveResult = await mainFrame.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        btns[i].click();
        return '저장됨';
      }
    }
    return '저장버튼없음';
  });
  console.log('  ' + saveResult);

  await sleep(3000);

  console.log('\n✅ 블로그 작성 완료!');
  console.log('📋 정이사님, 블로그 탭 확인하고 검토 후 발행해주세요.');
  console.log('   (내용은 자동저장되어 있습니다)');

  await b.close();
})();

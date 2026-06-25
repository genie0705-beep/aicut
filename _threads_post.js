// Threads 포스팅 v2
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const TEXT = `온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유 📚

강의 촬영하고 편집하는 데 하루 종일 걸리시나요?

"영상 퀄리티가 맘에 안 드는데 고칠 시간도 없다"
"콘텐츠는 계속 만들어야 하는데 체력이 바닥났다"

교육 콘텐츠의 완성도는 이제 편집이 결정합니다.

에이컷은 교육 콘텐츠 전문 영상 편집 서비스입니다.
촬영 원본만 보내주시면 자막, 인트로, BGM, 숏폼까지 모두 처리해 드립니다 ✨

강사님은 콘텐츠에만 집중하세요!

📩 aicut.co.kr

#온라인강의 #교육콘텐츠 #영상편집 #에이컷 #강사 #크리에이터 #인프런 #클래스101`;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // 프로필 페이지로 이동
  var tp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com') >= 0) { tp = pages[i]; break; }
  }
  if (!tp) {
    tp = await ctx.newPage();
    await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'networkidle', timeout: 30000 });
  }
  
  await tp.bringToFront();
  await sleep(3000);

  // "새로운 소식이 있나요?" 영역 클릭
  console.log('글쓰기 영역 찾기...');
  var clicked = await tp.evaluate(function() {
    // 모든 요소에서 '새로운 소식' 텍스트 찾기
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t.indexOf('새로운 소식') >= 0 || t.indexOf('게시') >= 0) && all[i].offsetParent !== null) {
        if (t.indexOf('게시') >= 0) continue; // 이건 버튼
        all[i].click();
        return { found: true, text: t.substring(0, 50) };
      }
    }
    return { found: false };
  });
  console.log('클릭:', JSON.stringify(clicked));
  await sleep(3000);

  // 에디터 찾기
  var editorFound = await tp.evaluate(function() {
    var editables = document.querySelectorAll('[contenteditable], textarea, [role="textbox"]');
    for (var i = 0; i < editables.length; i++) {
      if (editables[i].offsetParent !== null) {
        return { found: true, tag: editables[i].tagName };
      }
    }
    return { found: false, count: editables.length };
  });
  console.log('에디터:', JSON.stringify(editorFound));

  if (editorFound.found) {
    // 텍스트 입력
    var editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
    if (editor) {
      await editor.click({ force: true });
      await sleep(500);
      for (var c = 0; c < TEXT.length; c++) {
        await tp.keyboard.type(TEXT[c], { delay: 5 });
        if (c % 50 === 0) await sleep(50);
      }
      console.log('✅ 텍스트 입력 완료');
      await sleep(1500);

      // 게시 버튼
      var posted = await tp.evaluate(function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if ((t === '게시' || t === 'Post') && !btns[i].disabled && btns[i].offsetParent !== null) {
            btns[i].click(); return true;
          }
        }
        return false;
      });
      console.log('게시:', posted ? '✅' : '⚠️');
      await sleep(5000);
      console.log('✅ Threads 포스팅 완료!');
    }
  } else {
    console.log('에디터가 안 보입니다. '+' 버튼으로 시도...');
    
    // + 버튼 클릭
    await tp.evaluate(function() {
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === '+' && all[i].offsetParent !== null) {
          all[i].click(); return;
        }
      }
    });
    await sleep(3000);

    // 다시 에디터 찾기
    var retry = await tp.evaluate(function() {
      var editables = document.querySelectorAll('[contenteditable], textarea, [role="textbox"]');
      for (var i = 0; i < editables.length; i++) {
        if (editables[i].offsetParent !== null) return { found: true };
      }
      return { found: false, count: editables.length };
    });
    console.log('재시도 에디터:', JSON.stringify(retry));

    if (retry.found) {
      var editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
      if (editor) {
        await editor.click({ force: true });
        await sleep(500);
        for (var c = 0; c < TEXT.length; c++) {
          await tp.keyboard.type(TEXT[c], { delay: 5 });
          if (c % 50 === 0) await sleep(50);
        }
        console.log('✅ 텍스트 입력 완료');
        await sleep(1500);

        var posted = await tp.evaluate(function() {
          var btns = document.querySelectorAll('button');
          for (var i = 0; i < btns.length; i++) {
            var t = (btns[i].innerText || '').trim();
            if ((t === '게시' || t === 'Post') && !btns[i].disabled && btns[i].offsetParent !== null) {
              btns[i].click(); return true;
            }
          }
          return false;
        });
        console.log('게시:', posted ? '✅' : '⚠️');
        await sleep(5000);
        console.log('✅ Threads 포스팅 완료!');
      }
    } else {
      // 스크린샷
      await tp.screenshot({ path: '_threads_screenshot.png', fullPage: false });
      console.log('❌ 여전히 에디터 못 찾음, 스크린샷 저장됨');
    }
  }

  await b.close();
})();

// Threads 게시 - 실제 마우스 이벤트 방식
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const TEXT = `교육 콘텐츠 만드는 분들, 편집 때문에 밤새고 계신가요?

저희한테 "영상 편집 좀 해주세요" 하고 오시는 강사님들 보면 공통점이 있어요.

"강의는 자신 있는데 편집이 너무 오래 걸려요"
"영상 퀄리티는 높이고 싶은데 편집을 배울 시간이 없어요"

맞아요. 편집이 강의 시간의 3배는 더 걸리거든요.
근데 그걸 강사님이 직접 하실 필요가 있을까요?

저희한테 촬영 원본만 보내주세요.
자막, BGM, 챕터 구분, 릴스/쇼츠용 숏폼까지 다 만들어 드립니다.

강사님은 강의에만 집중하세요.
영상 편집은 저희가 다 합니다 ✨

aicut.co.kr

#교육콘텐츠 #영상편집외주 #에이컷`;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // Threads 페이지 찾기
  var tp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com') >= 0) { tp = pages[i]; break; }
  }
  if (!tp) {
    tp = await ctx.newPage();
    await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  }

  await tp.bringToFront();
  await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(4000);

  // 1단계: "새로운 소식이 있나요?" 영역 찾기 (div 태그)
  console.log('1단계: 글쓰기 영역 찾기...');
  var writeArea = await tp.evaluate(function() {
    var allDivs = document.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
      var d = allDivs[i];
      var t = (d.innerText || '').trim();
      // '새로운 소식이 있나요?' 텍스트 포함된 div 찾기
      if (t.indexOf('새로운 소식이 있나요?') >= 0 && t.indexOf('게시') >= 0 && d.offsetParent !== null) {
        var rect = d.getBoundingClientRect();
        return {
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          text: t.substring(0, 50),
          cls: (d.className || '').substring(0, 60)
        };
      }
    }
    return null;
  });

  if (!writeArea) {
    console.log('⚠️ 입력 영역 못 찾음');
    await b.close();
    return;
  }

  console.log('   영역:', JSON.stringify(writeArea));
  console.log('   좌표 클릭...');

  // Playwright 실제 마우스 클릭
  await tp.mouse.click(writeArea.x, writeArea.y);
  await sleep(3000);

  // 2단계: 에디터가 열렸는지 확인
  var editorFound = await tp.evaluate(function() {
    var editables = document.querySelectorAll('[contenteditable], textarea, [role="textbox"]');
    for (var i = 0; i < editables.length; i++) {
      if (editables[i].offsetParent !== null) {
        return { found: true, tag: editables[i].tagName, rect: JSON.stringify(editables[i].getBoundingClientRect()) };
      }
    }
    return { found: false, count: editables.length };
  });

  console.log('2단계: 에디터 상태:', JSON.stringify(editorFound));

  if (editorFound.found) {
    // 에디터에 텍스트 입력
    console.log('3단계: 텍스트 입력...');
    var editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
    if (editor) {
      await editor.click({ force: true });
      await sleep(500);

      // 천천히 입력
      var lines = TEXT.split('\n');
      for (var li = 0; li < lines.length; li++) {
        await tp.keyboard.type(lines[li], { delay: 8 });
        if (li < lines.length - 1) {
          await tp.keyboard.press('Enter');
          await sleep(150);
        }
        if (li % 5 === 0) await sleep(200);
      }
      console.log('   ✅ 텍스트 입력 완료 (' + lines.length + '줄)');
      await sleep(2000);

      // 4단계: 게시 버튼 찾아서 클릭
      console.log('4단계: 게시 버튼 찾기...');
      var postBtn = await tp.evaluate(function() {
        // role="button"인 '게시' div 찾기
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          var role = all[i].getAttribute('role');
          if (t === '게시' && role === 'button' && all[i].offsetParent !== null) {
            var rect = all[i].getBoundingClientRect();
            return { x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2), tag: all[i].tagName, role: role };
          }
        }
        // role 없는 '게시' div
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if (t === '게시' && all[i].offsetParent !== null && all[i].tagName === 'DIV') {
            var rect = all[i].getBoundingClientRect();
            if (rect.width > 30 && rect.height > 20) {
              return { x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2), tag: all[i].tagName };
            }
          }
        }
        return null;
      });

      if (postBtn) {
        console.log('   게시 버튼:', JSON.stringify(postBtn));
        await tp.mouse.click(postBtn.x, postBtn.y);
        console.log('   ✅ 게시 버튼 클릭');
        await sleep(5000);

        // 게시 확인
        var afterText = await tp.evaluate(function() {
          return (document.body.innerText || '').substring(1500, 3000);
        });
        
        if (afterText.indexOf('편집 때문에') >= 0 || afterText.indexOf('교육 콘텐츠') >= 0) {
          console.log('\n✅ Threads 게시 확인됨!');
        } else {
          console.log('\n⚠️ 게시 미확인, 10초 더 대기...');
          await sleep(10000);
          var finalText = await tp.evaluate(function() {
            return (document.body.innerText || '').substring(1500, 3500);
          });
          if (finalText.indexOf('편집 때문에') >= 0 || finalText.indexOf('교육 콘텐츠') >= 0) {
            console.log('✅ 지연 후 게시 확인됨!');
          } else {
            console.log('❌ 게시 실패. 페이지 상태:', tp.url().substring(0, 80));
          }
        }
      } else {
        console.log('❌ 게시 버튼 못 찾음');
      }
    }
  } else {
    console.log('❌ 에디터가 열리지 않음');
    console.log('   다른 방식 시도: + 버튼...');
    
    // + 버튼 찾아서 클릭
    var plusBtn = await tp.evaluate(function() {
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === '+' && all[i].offsetParent !== null) {
          var rect = all[i].getBoundingClientRect();
          if (rect.width > 20 && rect.height > 20) {
            return { x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2) };
          }
        }
      }
      return null;
    });
    
    if (plusBtn) {
      console.log('   + 버튼:', JSON.stringify(plusBtn));
      await tp.mouse.click(plusBtn.x, plusBtn.y);
      await sleep(3000);
      
      var retry = await tp.evaluate(function() {
        var editables = document.querySelectorAll('[contenteditable], textarea, [role="textbox"]');
        for (var i = 0; i < editables.length; i++) {
          if (editables[i].offsetParent !== null) return { found: true };
        }
        return { found: false };
      });
      console.log('   + 후 에디터:', JSON.stringify(retry));
    }
  }

  await b.close();
})();

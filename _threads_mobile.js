// Threads 모바일 뷰포트로 게시 시도
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

  // 모바일 뷰포트 새 탭 생성
  var tp = await ctx.newPage();
  await tp.setViewportSize({ width: 390, height: 844 }); // iPhone 14
  
  await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(function(){});
  await sleep(5000);

  console.log('모바일 뷰포트 로드됨');
  var url = tp.url();
  console.log('URL:', url.substring(0, 80));

  // 모바일 버전 분석
  var analysis = await tp.evaluate(function() {
    var r = {};
    r.contentEditable = document.querySelectorAll('[contenteditable]').length;
    r.textarea = document.querySelectorAll('textarea').length;
    r.textbox = document.querySelectorAll('[role="textbox"]').length;
    
    // + 버튼 또는 글쓰기 버튼 찾기
    r.buttons = [];
    document.querySelectorAll('a, button, div[role="button"]').forEach(function(el) {
      if (el.offsetParent !== null) {
        var t = (el.innerText || '').trim();
        if (t) r.buttons.push(t.substring(0, 30));
      }
    });
    
    // '게시' 텍스트
    r.hasPostText = (document.body.innerText || '').indexOf('게시') >= 0;
    
    // body text preview
    r.bodyPreview = (document.body.innerText || '').substring(0, 500);
    
    return r;
  });

  console.log('분석:', JSON.stringify(analysis, null, 2));

  // + 버튼 찾기
  console.log('\n+ 버튼 찾기...');
  var plusBtn = await tp.evaluate(function() {
    // SVG가 포함된 + 기호 찾기
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '+' && all[i].offsetParent !== null) {
        var rect = all[i].getBoundingClientRect();
        if (rect.width > 15 && rect.height > 15) {
          return { x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2), tag: all[i].tagName };
        }
      }
    }
    return null;
  });

  if (plusBtn) {
    console.log('+ 버튼:', JSON.stringify(plusBtn));
    await tp.mouse.click(plusBtn.x, plusBtn.y);
    await sleep(4000);

    // 에디터 확인
    var chk = await tp.evaluate(function() {
      var editables = document.querySelectorAll('[contenteditable], textarea, [role="textbox"]');
      for (var i = 0; i < editables.length; i++) {
        if (editables[i].offsetParent !== null) return { found: true, tag: editables[i].tagName };
      }
      return { found: false, count: editables.length };
    });
    console.log('에디터:', JSON.stringify(chk));

    if (chk.found) {
      var editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
      if (editor) {
        await editor.click({ force: true });
        await sleep(500);

        var lines = TEXT.split('\n');
        for (var li = 0; li < lines.length; li++) {
          await tp.keyboard.type(lines[li], { delay: 5 });
          if (li < lines.length - 1) {
            await tp.keyboard.press('Enter');
            await sleep(100);
          }
        }
        console.log('텍스트 입력 완료');
        await sleep(2000);

        // 게시 버튼
        var postBtn = await tp.evaluate(function() {
          var all = document.querySelectorAll('*');
          for (var i = 0; i < all.length; i++) {
            var t = (all[i].innerText || '').trim();
            if (t === '게시' && all[i].offsetParent !== null) {
              var rect = all[i].getBoundingClientRect();
              if (rect.width > 30) {
                return { x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2) };
              }
            }
          }
          return null;
        });

        if (postBtn) {
          console.log('게시 버튼:', JSON.stringify(postBtn));
          await tp.mouse.click(postBtn.x, postBtn.y);
          console.log('게시 버튼 클릭됨');
          await sleep(6000);

          var finalCheck = await tp.evaluate(function() {
            return (document.body.innerText || '').substring(500, 2000);
          });
          console.log('\n게시 후 텍스트:');
          console.log(finalCheck.substring(0, 300));

          if (finalCheck.indexOf('편집 때문에') >= 0 || finalCheck.indexOf('교육 콘텐츠') >= 0) {
            console.log('\n✅ Threads 게시 성공!');
          } else {
            console.log('\n⚠️ 게시 미확인');
          }
        }
      }
    } else {
      console.log('에디터가 열리지 않음');
    }
  } else {
    console.log('+ 버튼 없음');
  }

  await b.close();
})();

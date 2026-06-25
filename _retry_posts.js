// Threads 포스팅 + 인스타 캡션 확인 (1차: Threads, 2차: 인스타)
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// Threads 톤앤매너: 자유로운 대화체, 질문형 hook, 긴 호흡, 해시태그 적게
const THREADS_TEXT = `교육 콘텐츠 만드는 분들, 편집 때문에 밤새고 계신가요?

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

// 인스타 톤앤매너: 짧고 임팩트, hook→설명→CTA, 해시태그 10개
const INSTA_CAPTION = `강의 촬영하고 편집까지? 📚
교육 콘텐츠 크리에이터가
영상 편집 아웃소싱을 선택하는 이유

편집에 하루 종일 쏟는 강사님이라면,
지금 바꿔보세요.

에이컷이 해결합니다 ✨
자막 · BGM · 인트로 · 챕터 구분
릴스/쇼츠 숏폼까지 한 번에!

촬영 원본만 보내주시면 끝.
강의 준비와 콘텐츠에만 집중하세요 🙌

👉 aicut.co.kr

#온라인강의 #교육콘텐츠 #영상편집 #강의영상 #에이컷
#강사마케팅 #인프런 #클래스101 #영상아웃소싱 #숏폼편집`;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // ============================================================
  // 1. Threads 포스팅
  // ============================================================
  console.log('=== [1/2] Threads 포스팅 ===\n');

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

  // 1-1. 입력창 찾아서 클릭
  console.log('1. 입력창 클릭...');
  var inputClicked = await tp.evaluate(function() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '새로운 소식이 있나요?' && all[i].offsetParent !== null) {
        all[i].click();
        return true;
      }
    }
    return false;
  });
  console.log('   입력창:', inputClicked ? '✅' : '⚠️');
  await sleep(3000);

  // 1-2. 에디터 찾기
  var editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
  if (!editor) {
    console.log('   에디터 못 찾음, 다시 시도...');
    // '+' 버튼 클릭
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
    editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
  }

  if (editor) {
    console.log('   에디터 발견 ✅');
    await editor.click({ force: true });
    await sleep(500);

    // 1-3. 텍스트 입력
    console.log('2. 텍스트 입력...');
    var lines = THREADS_TEXT.split('\n');
    for (var li = 0; li < lines.length; li++) {
      await tp.keyboard.type(lines[li], { delay: 10 });
      if (li < lines.length - 1) {
        await tp.keyboard.press('Enter');
        await sleep(100);
      }
    }
    console.log('   ✅ ' + lines.length + '줄 입력 완료');
    await sleep(2000);

    // 1-4. 게시 버튼 찾기
    console.log('3. 게시 버튼 찾기...');
    var postClicked = await tp.evaluate(function() {
      // 모든 요소에서 '게시' 텍스트 찾기
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === '게시' && all[i].offsetParent !== null) {
          // 클릭 가능한 요소인지 확인
          var tag = all[i].tagName;
          all[i].click();
          return { tag: tag, text: t };
        }
      }
      // 'Post' 영어
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === 'Post' && all[i].offsetParent !== null) {
          all[i].click();
          return { tag: all[i].tagName, text: t };
        }
      }
      return false;
    });
    console.log('   게시:', JSON.stringify(postClicked));
    await sleep(5000);

    // 1-5. 게시 확인
    var afterText = await tp.evaluate(function() {
      return (document.body.innerText || '').substring(1500, 2500);
    });
    console.log('\n   게시 후 텍스트:');
    console.log(afterText.substring(0, 300));
    
    if (afterText.indexOf('편집 때문에') >= 0) {
      console.log('\n✅ Threads 게시 확인됨!');
    } else {
      console.log('\n⚠️ 게시글 미확인, 다시 시도 필요');
    }
  } else {
    console.log('❌ 에디터를 찾을 수 없습니다');
  }

  // ============================================================
  // 2. 인스타 캡션 확인 및 수정
  // ============================================================
  console.log('\n=== [2/2] 인스타 캡션 확인 ===\n');

  var ip = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { ip = pages[i]; break; }
  }
  if (!ip) { await b.close(); return; }

  await ip.bringToFront();
  // 최신 게시물 열기
  var postUrl = 'https://www.instagram.com/aicut.official/p/DZtXfPMGRlW/';
  await ip.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(4000);

  // 현재 캡션 확인
  var currentCaption = await ip.evaluate(function() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '');
      if (t.indexOf('온라인 강의') >= 0 || t.indexOf('강의 촬영') >= 0 || t.indexOf('교육 콘텐츠') >= 0) {
        return t.substring(0, 400);
      }
    }
    return '못 찾음';
  });
  console.log('현재 캡션:', currentCaption.substring(0, 300));

  if (currentCaption.indexOf('강의 촬영하고 편집까지') >= 0) {
    console.log('\n✅ 인스타 캡션 이미 수정됨');
  } else if (currentCaption.indexOf('온라인 강의') >= 0) {
    console.log('\n⚠️ 이전 버전 캡션, 수정 필요');
  } else {
    console.log('\n⚠️ 캡션 확인 불가');
  }

  await b.close();
})();

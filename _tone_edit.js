// 인스타 캡션 수정 + Threads 글 수정 (톤앤매너 적용)
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ===== Instagram용 캡션 (톤앤매너: 짧고 임팩트, hook→설명→CTA) =====
var INSTA_CAPTION = [
  '강의 촬영하고 편집까지? 📚',
  '교육 콘텐츠 크리에이터가',
  '영상 편집 아웃소싱을 선택하는 이유',
  '',
  '편집에 하루 종일 쏟는 강사님이라면,',
  '지금 바꿔보세요.',
  '',
  '에이컷이 해결합니다 ✨',
  '자막 · BGM · 인트로 · 챕터 구분',
  '릴스/쇼츠 숏폼까지 한 번에!',
  '',
  '촬영 원본만 보내주시면 끝.',
  '강의 준비와 콘텐츠에만 집중하세요 🙌',
  '',
  '👉 aicut.co.kr',
  '',
  '#온라인강의 #교육콘텐츠 #영상편집 #강의영상 #에이컷',
  '#강사마케팅 #인프런 #클래스101 #영상아웃소싱 #숏폼편집'
].join('\n');

// ===== Threads용 글 (톤앤매너: 질문형 hook, 자유로운 대화체, 긴 호흡) =====
var THREADS_TEXT = [
  '교육 콘텐츠 만드는 분들, 편집 때문에 밤새고 계신가요?',
  '',
  '저희한테 "영상 편집 좀 해주세요" 하고 오시는 강사님들 보면 공통점이 있어요.',
  '',
  '"강의는 자신 있는데 편집이 너무 오래 걸려요"',
  '"영상 퀄리티는 높이고 싶은데 편집을 배울 시간이 없어요"',
  '',
  '맞아요. 편집이 강의 시간의 3배는 더 걸리거든요.',
  '그런데 그걸 강사님이 직접 하실 필요가 있을까요?',
  '',
  '저희한테 촬영 원본만 보내주세요.',
  '자막, BGM, 챕터 구분, 릴스/쇼츠용 숏폼까지 다 만들어 드립니다.',
  '',
  '강사님은 강의에만 집중하세요.',
  '영상 편집은 저희가 다 합니다 ✨',
  '',
  'aicut.co.kr',
  '',
  '#교육콘텐츠 #영상편집외주 #에이컷'
].join('\n');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // ============================================================
  // 1. 인스타그램 캡션 수정
  // ============================================================
  console.log('=== [1/2] 인스타그램 캡션 수정 ===');

  var ip = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { ip = pages[i]; break; }
  }

  if (ip) {
    await ip.bringToFront();
    // 프로필로 이동
    await ip.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(3000);

    // 첫 번째 게시물 클릭
    console.log('첫 번째 게시물 찾기...');
    var postUrl = await ip.evaluate(function() {
      var links = document.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        var h = links[i].href || '';
        if (h.indexOf('/p/') >= 0) {
          return h;
        }
      }
      return null;
    });

    if (postUrl) {
      console.log('게시물 URL:', postUrl.substring(0, 60));
      await ip.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
      await sleep(3000);

      // ⋮ 버튼 클릭 (더보기)
      console.log('더보기 메뉴...');
      var menuClicked = await ip.evaluate(function() {
        // 점3개 버튼 찾기
        var btns = document.querySelectorAll('button, div[role="button"], span, svg');
        for (var i = 0; i < btns.length; i++) {
          var html = btns[i].innerHTML || '';
          // ⋮ SVG 가진 요소 찾기
          if (html.indexOf('M12') >= 0 || html.indexOf('more') >= 0 || html.indexOf('More') >= 0) {
            var p = btns[i].closest('button') || btns[i].closest('div[role="button"]') || btns[i];
            if (p && p.offsetParent !== null) {
              p.click();
              return true;
            }
          }
        }
        return false;
      });
      console.log('  메뉴 클릭:', menuClicked ? '✅' : '⚠️');
      await sleep(2000);

      // '수정' 옵션 선택
      var editClicked = await ip.evaluate(function() {
        var all = document.querySelectorAll('div, span, button, a');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if ((t === '수정' || t === 'Edit') && all[i].offsetParent !== null) {
            all[i].click();
            return true;
          }
        }
        return false;
      });
      console.log('  수정 선택:', editClicked ? '✅' : '⚠️');
      await sleep(3000);

      // 캡션 입력창 찾아서 수정
      var captionInput = await ip.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea, [contenteditable="true"][role="textbox"]');
      if (captionInput) {
        await captionInput.click({ force: true });
        await sleep(500);
        // 전체 선택 후 삭제
        await ip.keyboard.press('Control+a');
        await sleep(300);
        await ip.keyboard.press('Delete');
        await sleep(500);

        // 새 캡션 입력
        for (var c = 0; c < INSTA_CAPTION.length; c++) {
          await ip.keyboard.type(INSTA_CAPTION[c], { delay: 3 });
          if (c % 30 === 0) await sleep(30);
        }
        console.log('  ✅ 캡션 수정 완료');
        await sleep(1500);

        // 완료 버튼
        var doneClicked = await ip.evaluate(function() {
          var btns = document.querySelectorAll('button, div[role="button"]');
          for (var i = 0; i < btns.length; i++) {
            var t = (btns[i].innerText || '').trim();
            if ((t === '완료' || t === 'Done' || t === '저장' || t === 'Save') && !btns[i].disabled && btns[i].offsetParent !== null) {
              btns[i].click();
              return true;
            }
          }
          return false;
        });
        console.log('  완료:', doneClicked ? '✅' : '⚠️');
        await sleep(4000);
        console.log('✅ 인스타 캡션 수정 완료!\n');
      } else {
        console.log('  ❌ 캡션 입력창 못 찾음');
      }
    } else {
      console.log('  ❌ 게시물 못 찾음');
    }
  }

  // ============================================================
  // 2. Threads 글 수정
  // ============================================================
  console.log('=== [2/2] Threads 글 수정 ===');

  var tp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com') >= 0) { tp = pages[i]; break; }
  }

  if (tp) {
    await tp.bringToFront();
    await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(3000);

    // 가장 최근 게시물 찾기 (교육 콘텐츠 관련)
    console.log('최근 게시물 찾기...');
    var threadFound = await tp.evaluate(function() {
      // '온라인 강의' 또는 '교육 콘텐츠' 포함된 게시물 찾기
      var articles = document.querySelectorAll('article, [data-testid], div[role="article"]');
      // 혹은 텍스트로 검색
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '');
        if ((t.indexOf('온라인 강의') >= 0 || t.indexOf('교육 콘텐츠') >= 0) && t.length < 300 && all[i].offsetParent !== null) {
          return { found: true, text: t.substring(0, 100), tag: all[i].tagName };
        }
      }
      // '편집 때문에 밤새' 로 검색 (새 글)
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '');
        if (t.indexOf('편집 때문에') >= 0 && t.length < 200 && all[i].offsetParent !== null) {
          return { found: true, text: t.substring(0, 100), tag: all[i].tagName };
        }
      }
      return { found: false };
    });
    console.log('게시물 찾기:', JSON.stringify(threadFound));

    if (threadFound.found) {
      // 게시물의 ⋮ 메뉴 찾기 (해당 게시물 영역에서)
      console.log('더보기 메뉴...');
      var menuClicked = await tp.evaluate(function() {
        // 모든 ⋮ 또는 더보기 버튼 찾기
        var btns = document.querySelectorAll('button, div[role="button"]');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          var html = btns[i].innerHTML || '';
          if (t === '더 보기' || html.indexOf('more') >= 0 || html.indexOf('More') >= 0) {
            if (btns[i].offsetParent !== null) {
              btns[i].click();
              return true;
            }
          }
        }
        // '...' SVG 검색
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var html = all[i].innerHTML || '';
          if ((html.indexOf('M12') >= 0 || html.indexOf('M16') >= 0) && html.indexOf('svg') >= 0) {
            var btn = all[i].closest('button') || all[i].parentElement;
            if (btn && btn.offsetParent !== null) {
              btn.click();
              return { by: 'svg', tag: btn.tagName };
            }
          }
        }
        return false;
      });
      console.log('  메뉴:', JSON.stringify(menuClicked));
      await sleep(2000);

      // '수정' 또는 'Edit' 선택
      var editClicked = await tp.evaluate(function() {
        var all = document.querySelectorAll('div, span, button, a');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if ((t === '수정' || t === 'Edit' || t.indexOf('수정') >= 0) && all[i].offsetParent !== null) {
            all[i].click();
            return true;
          }
        }
        return false;
      });
      console.log('  수정:', editClicked ? '✅' : '⚠️');
      await sleep(3000);

      // 에디터 찾기
      var editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
      if (editor) {
        await editor.click({ force: true });
        await sleep(500);
        // 전체 선택 후 삭제
        await tp.keyboard.press('Control+a');
        await sleep(300);
        await tp.keyboard.press('Delete');
        await sleep(500);

        // 새 글 입력
        for (var c = 0; c < THREADS_TEXT.length; c++) {
          await tp.keyboard.type(THREADS_TEXT[c], { delay: 3 });
          if (c % 30 === 0) await sleep(30);
        }
        console.log('  ✅ 글 수정 완료');
        await sleep(1500);

        // 저장/완료 버튼
        var doneClicked = await tp.evaluate(function() {
          var all = document.querySelectorAll('*');
          for (var i = 0; i < all.length; i++) {
            var t = (all[i].innerText || '').trim();
            if ((t === '저장' || t === 'Save' || t === '완료' || t === 'Done' || t === '수정 완료') && all[i].offsetParent !== null) {
              all[i].click();
              return { text: t, tag: all[i].tagName };
            }
          }
          return false;
        });
        console.log('  저장:', JSON.stringify(doneClicked));
        await sleep(4000);
        console.log('✅ Threads 글 수정 완료!\n');
      } else {
        console.log('  ❌ 에디터 못 찾음');
      }
    } else {
      console.log('  ⚠️ 게시물을 못 찾았습니다. 새로 작성합니다.');
      
      // 새 글 작성
      var writeBtn = await tp.evaluate(function() {
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if ((t === '새로운 소식이 있나요?' || t.indexOf('새로운 소식') >= 0) && all[i].offsetParent !== null) {
            all[i].click();
            return true;
          }
        }
        return false;
      });
      await sleep(3000);

      var editor = await tp.$('[contenteditable], textarea, [role="textbox"]');
      if (editor) {
        await editor.click({ force: true });
        await sleep(500);
        for (var c = 0; c < THREADS_TEXT.length; c++) {
          await tp.keyboard.type(THREADS_TEXT[c], { delay: 3 });
          if (c % 30 === 0) await sleep(30);
        }
        console.log('  ✅ 새 글 작성 완료');
        await sleep(1500);

        var postClicked = await tp.evaluate(function() {
          var all = document.querySelectorAll('*');
          for (var i = 0; i < all.length; i++) {
            var t = (all[i].innerText || '').trim();
            if (t === '게시' && all[i].offsetParent !== null) {
              all[i].click();
              return true;
            }
          }
          return false;
        });
        console.log('  게시:', postClicked ? '✅' : '⚠️');
        await sleep(5000);
        console.log('✅ Threads 새 글 게시 완료!');
      }
    }
  }

  console.log('\n🎉 모든 작업 완료!');
  await b.close();
})();

const { chromium } = require('playwright');
const path = require('path');

const CDP_PORT = 9224;
const IMG_PATH = path.join(__dirname, 'insta_card_h2_01.png');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const CAPTION = '📅 하반기 마케팅, 지금 준비하세요\n\n' +
'"릴스 조회수는 괜찮은데 문의가 안 늘어요"\n' +
'"AI 영상 툴 써봤는데 오히려 시간만 더 갔어요"\n' +
'"하반기 예산 짜야 하는데 영상은 어떻게 할지..."\n\n' +
'6월, 상반기가 끝나가고 있어요.\n' +
'지금이 영상 편집 외주사를 정할 가장 완벽한 타이밍입니다 🎯\n\n' +
'✅ 하반기 물량 선점 — 7~8월 성수기 대비\n' +
'✅ 꾸준함이 경쟁력 — 릴스 알고리즘은 꾸준함에 가중치\n' +
'✅ 시행착오 줄일 시간 — 7월 전에 워크플로우 안정화\n\n' +
'👉 블로그에서 자세한 내용 확인하세요 (프로필 링크)\n\n' +
'#하반기마케팅 #영상편집외주 #숏폼마케팅 #릴스알고리즘\n' +
'#AI영상편집 #영상마케팅 #에이컷 #AICUT #콘텐츠마케팅\n' +
'#인스타마케팅 #SNS마케팅 #마케팅전략 #하반기준비';

(async () => {
  console.log('=== 1단계: 기존 게시물 삭제 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  var page = null;
  for (var i = 0; i < ctx.pages().length; i++) {
    var p = ctx.pages()[i];
    if (p.url().includes('instagram.com') && !p.url().includes('accounts')) {
      page = p; break;
    }
  }
  if (!page) { page = await ctx.newPage(); }

  await page.bringToFront();

  // 게시물 페이지 로드
  console.log('1. 게시물 페이지 이동...');
  await page.goto('https://www.instagram.com/p/DZ6GVaxmT_u/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  // 옵션 더 보기 클릭
  console.log('2. 옵션 더 보기...');
  var optClicked = await page.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var label = svgs[i].getAttribute('aria-label') || '';
      var title = svgs[i].querySelector('title');
      var titleText = title ? title.textContent : '';
      if (label === '옵션 더 보기' || titleText === '옵션 더 보기') {
        var el = svgs[i];
        for (var j = 0; j < 3; j++) {
          if (el.parentElement) el = el.parentElement;
          if (el.getAttribute('role') === 'button' || el.tagName === 'BUTTON' || el.tagName === 'A') {
            el.click();
            return 'clicked parent';
          }
        }
        svgs[i].click();
        return 'clicked svg';
      }
    }
    return 'not found';
  });
  console.log('   결과:', optClicked);
  await sleep(2000);

  // 삭제 메뉴 찾기
  console.log('3. 삭제 메뉴 선택...');
  var delClicked = await page.evaluate(function() {
    var items = Array.from(document.querySelectorAll('[role="menuitem"], [role="button"], button, a, span, div'));
    for (var i = 0; i < items.length; i++) {
      var t = (items[i].innerText || '').trim();
      if (t === '삭제' || t === 'Delete') {
        if (items[i].offsetParent !== null) {
          items[i].click();
          return 'clicked: ' + t;
        }
      }
    }
    // 텍스트 일부만 매칭
    for (var j = 0; j < items.length; j++) {
      var txt = (items[j].innerText || '').trim();
      if (txt.includes('삭제') && items[j].offsetParent !== null) {
        items[j].click();
        return 'clicked partial: ' + txt.substring(0, 20);
      }
    }
    return 'not found';
  });
  console.log('   결과:', delClicked);
  await sleep(2000);

  // 삭제 확인 팝업
  console.log('4. 삭제 확인...');
  var confirmClicked = await page.evaluate(function() {
    var btns = Array.from(document.querySelectorAll('button, [role="button"], div[role="menuitem"]'));
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if ((t === '삭제' || t === 'Delete' || t === '확인') && btns[i].offsetParent !== null && !btns[i].disabled) {
        // 첫 번째는 메뉴, 두 번째는 확인 팝업 - 텍스트만 같은 다른 버튼
        // 팝업 내 버튼 중 색상이 다른 버튼 (위험/확인 강조)
        if (btns[i].className && btns[i].className.includes('danger')) {
          btns[i].click(); return true;
        }
      }
    }
    // span 또는 div 내 텍스트로 찾기
    var allEls = Array.from(document.querySelectorAll('span, div, button'));
    var delBtns = allEls.filter(function(el) {
      var t = (el.innerText || '').trim();
      return (t === '삭제' || t === 'Delete') && el.offsetParent !== null && !el.disabled;
    });
    if (delBtns.length > 1) {
      // 두 번째 삭제 버튼 = 확인 팝업의 삭제
      delBtns[delBtns.length - 1].click();
      return 'clicked last delete';
    }
    if (delBtns.length === 1) {
      delBtns[0].click();
      return 'clicked only delete';
    }
    return 'no confirm button';
  });
  console.log('   결과:', confirmClicked);
  await sleep(3000);

  // === 2단계: 새 이미지 업로드 ===
  console.log('\n=== 2단계: 새 이미지 업로드 ===\n');

  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  // 새 게시물 만들기
  console.log('1. 새 게시물 만들기...');
  var createClicked = await page.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var t = svgs[i].querySelector('title');
      if (t && (t.textContent === '새로운 게시물' || t.textContent === 'New post')) {
        var btn = svgs[i].closest('[role="button"]') || svgs[i].closest('button') || svgs[i].closest('a');
        if (btn) { btn.click(); return true; }
        svgs[i].click(); return true;
      }
    }
    return false;
  });
  console.log('   결과:', createClicked ? '✅' : '❌');
  await sleep(2000);

  // 게시물 옵션
  console.log('2. 게시물 옵션...');
  await page.evaluate(function() {
    var items = Array.from(document.querySelectorAll('button, [role="button"], span, div'));
    var item = items.find(function(el) {
      return (el.innerText || '').trim() === '게시물' || (el.innerText || '').trim() === 'Post';
    });
    if (item) item.click();
  });
  await sleep(2000);

  // 이미지 업로드
  console.log('3. 이미지 업로드...');
  var fi = await page.$('input[type="file"]');
  if (fi) {
    await fi.setInputFiles(IMG_PATH);
    console.log('   ✅ 업로드 완료');
  } else {
    console.log('   ❌ file input 없음');
    await b.close();
    return;
  }
  await sleep(3000);

  // 다음 버튼
  console.log('4. 다음 단계...');
  for (var s = 0; s < 2; s++) {
    var nextDone = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      var btn = btns.find(function(b) {
        return ((b.innerText || '').trim() === '다음' || (b.innerText || '').trim() === 'Next') && !b.disabled;
      });
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (nextDone) { console.log('   다음', s+1, '✅'); await sleep(2500); }
    else { console.log('   다음', s+1, '❌'); break; }
  }

  // 캡션 입력
  console.log('5. 캡션 입력...');
  var editors = await page.$$('[contenteditable="true"][role="textbox"]');
  if (editors.length > 0) {
    await editors[0].click({ force: true });
    await sleep(500);
    await page.keyboard.type(CAPTION, { delay: 8 });
    console.log('   ✅ 캡션 입력 완료');
  } else {
    // textarea 찾기
    var textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      await textareas[0].click({ force: true });
      await sleep(500);
      await page.keyboard.type(CAPTION, { delay: 8 });
      console.log('   ✅ textarea 입력 완료');
    } else {
      console.log('   ❌ 입력창 없음');
    }
  }
  await sleep(2000);

  // 위치 선택 (서울)
  console.log('6. 위치 선택...');
  var locBtn = await page.evaluate(function() {
    var btns = Array.from(document.querySelectorAll('button, [role="button"], div[role="combobox"]'));
    var btn = btns.find(function(b) {
      var t = b.innerText || '';
      return t.includes('위치') || t.includes('Location');
    });
    if (btn) { btn.click(); return true; }
    var input = document.querySelector('[placeholder*="위치"], [placeholder*="location"]');
    if (input) { input.click(); return 'input_exists'; }
    return false;
  });
  console.log('   위치:', locBtn);
  await sleep(1500);

  if (locBtn) {
    var locInput = await page.$('[placeholder*="위치"], [placeholder*="location"]');
    if (locInput) {
      await locInput.click({ force: true });
      await sleep(500);
      await page.keyboard.type('서울', { delay: 50 });
      await sleep(2000);
      var seoulSelected = await page.evaluate(function() {
        var items = Array.from(document.querySelectorAll('button, div[role="option"], span'));
        var item = items.find(function(el) { return (el.innerText || '').trim() === '서울'; });
        if (item) { item.click(); return true; }
        return false;
      });
      console.log('   서울 선택:', seoulSelected ? '✅' : '❌');
      await sleep(1500);
    }
  }

  // 공유하기
  console.log('7. 공유하기...');
  var shared = false;
  for (var a = 0; a < 3; a++) {
    shared = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      var btn = btns.find(function(b) {
        return ((b.innerText || '').trim() === '공유하기' || (b.innerText || '').trim() === 'Share') && !b.disabled;
      });
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (shared) break;
    await sleep(1000);
  }
  console.log('   공유하기:', shared ? '✅' : '❌');
  await sleep(6000);

  // 8. 결과 확인
  console.log('\n=== 3단계: 결과 확인 ===');
  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  var links = await page.evaluate(function() {
    var allLinks = Array.from(document.querySelectorAll('a'));
    var postLinks = allLinks.filter(function(l) { return l.href && l.href.includes('/p/'); });
    return postLinks.slice(0, 3).map(function(l) { return l.href.substring(0, 80); });
  });
  console.log('최근 게시물:', links);

  await b.close();
  console.log('\n✅ 전체 프로세스 완료!');
})();

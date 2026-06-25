const { chromium } = require('playwright');
const path = require('path');

const CDP_PORT = 9224;
const IMG_PATH = path.join(__dirname, 'insta_card_h2_700.png');

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

  // 삭제
  await page.goto('https://www.instagram.com/p/DZ6HbJ-mZJV/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  await page.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var label = svgs[i].getAttribute('aria-label') || '';
      var t = svgs[i].querySelector('title');
      if (label === '옵션 더 보기' || (t && t.textContent === '옵션 더 보기')) {
        var el = svgs[i];
        for (var j = 0; j < 3; j++) { if (el.parentElement) el = el.parentElement; }
        el.click();
        return;
      }
    }
  });
  await sleep(2000);

  await page.evaluate(function() {
    var items = Array.from(document.querySelectorAll('[role="menuitem"], button, span, div'));
    for (var i = 0; i < items.length; i++) {
      if ((items[i].innerText || '').trim() === '삭제') {
        items[i].click(); return;
      }
    }
  });
  await sleep(1500);

  // 확인 누르기 - span/div 중 "삭제" 텍스트인 것 중 마지막
  await page.evaluate(function() {
    var els = Array.from(document.querySelectorAll('span, div, button'));
    var delBtns = els.filter(function(el) {
      return (el.innerText || '').trim() === '삭제' && el.offsetParent !== null;
    });
    if (delBtns.length > 0) delBtns[delBtns.length - 1].click();
  });
  await sleep(3000);

  // === 업로드 ===
  console.log('=== 2단계: 새 이미지 업로드 (700x700) ===\n');

  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  // 새 게시물
  await page.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var t = svgs[i].querySelector('title');
      if (t && (t.textContent === '새로운 게시물' || t.textContent === 'New post')) {
        var btn = svgs[i].closest('[role="button"]') || svgs[i].closest('button') || svgs[i].closest('a');
        if (btn) btn.click();
        else svgs[i].click();
        return;
      }
    }
  });
  await sleep(2000);

  // 게시물 옵션
  await page.evaluate(function() {
    var items = Array.from(document.querySelectorAll('button, span, div'));
    var item = items.find(function(el) { return (el.innerText || '').trim() === '게시물'; });
    if (item) item.click();
  });
  await sleep(2000);

  // 이미지 업로드
  var fi = await page.$('input[type="file"]');
  if (fi) {
    await fi.setInputFiles(IMG_PATH);
    console.log('✅ 이미지 업로드 완료');
  } else {
    console.log('❌ file input 없음');
    await b.close(); return;
  }
  await sleep(3000);

  // 다음 2번
  for (var s = 0; s < 2; s++) {
    await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button'));
      var btn = btns.find(function(b) { return (b.innerText || '').trim() === '다음' && !b.disabled; });
      if (btn) btn.click();
    });
    await sleep(2500);
  }

  // ★ 캡션 입력 - evaluate로 직접 innerText + input 이벤트
  console.log('캡션 입력 (evaluate 방식)...');
  var captionSet = await page.evaluate(function(caption) {
    var editors = document.querySelectorAll('[contenteditable="true"][role="textbox"]');
    if (editors.length === 0) return 'no editor';
    var ed = editors[0];
    ed.focus();
    ed.innerText = caption;
    // input 이벤트 강제 트리거
    ed.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    ed.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok set ' + ed.innerText.substring(0, 30) + '...';
  }, CAPTION);
  console.log('   결과:', captionSet);
  await sleep(3000);

  // 위치
  console.log('위치 선택...');
  await page.evaluate(function() {
    var btns = Array.from(document.querySelectorAll('button, div'));
    var btn = btns.find(function(b) {
      var t = b.innerText || '';
      return t.includes('위치') || t.includes('Location');
    });
    if (btn) { btn.click(); return; }
    var input = document.querySelector('[placeholder*="위치"]');
    if (input) input.click();
  });
  await sleep(2000);

  // 서울 입력
  var locInput = await page.$('[placeholder*="위치"], [placeholder*="location"]');
  if (locInput) {
    await locInput.click({ force: true });
    await sleep(500);
    await locInput.evaluate(function(el) { el.value = '서울'; el.dispatchEvent(new Event('input', {bubbles:true})); });
    await sleep(2000);
    await page.evaluate(function() {
      var items = Array.from(document.querySelectorAll('button, div[role="option"], span'));
      var item = items.find(function(el) { return (el.innerText || '').trim() === '서울'; });
      if (item) item.click();
    });
    console.log('   서울 ✅');
    await sleep(1500);
  }

  // 공유하기
  console.log('공유하기...');
  var shared = false;
  for (var a = 0; a < 5; a++) {
    shared = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button'));
      var btn = btns.find(function(b) { return (b.innerText || '').trim() === '공유하기' && !b.disabled; });
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (shared) { console.log('   ✅'); break; }
    await sleep(1500);
  }
  if (!shared) console.log('   ❌');

  await sleep(6000);

  // 최종 확인
  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  var links = await page.evaluate(function() {
    var postLinks = Array.from(document.querySelectorAll('a')).filter(function(l) { return l.href && l.href.includes('/p/'); });
    return postLinks.slice(0, 3).map(function(l) { return l.href; });
  });
  console.log('\n최근 게시물:', links);

  await b.close();
  console.log('\n✅ 완료');
})();

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
  console.log('=== 인스타 새 게시물 업로드 ===\n');
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

  // 홈
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  // 새 게시물 클릭
  await page.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var t = svgs[i].querySelector('title');
      if (t && (t.textContent === '새로운 게시물' || t.textContent === 'New post')) {
        var btn = svgs[i].closest('[role="button"]') || svgs[i].closest('button') || svgs[i].closest('a');
        if (btn) { btn.click(); return; }
        svgs[i].click(); return;
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

  // 업로드
  var fi = await page.$('input[type="file"]');
  if (fi) { await fi.setInputFiles(IMG_PATH); console.log('✅ 이미지 업로드'); }
  else { console.log('❌ file input'); await b.close(); return; }
  await sleep(3000);

  // 다음 버튼 반복 - 캡션 입력창 나타날 때까지
  console.log('다음 단계 진행...');
  var step = 0;
  while (step < 5) {
    // 다음 버튼 찾기
    var nextDone = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button'));
      var btn = btns.find(function(b) { return (b.innerText || '').trim() === '다음' && !b.disabled; });
      if (btn) { btn.click(); return true; }
      return false;
    });
    
    if (nextDone) {
      step++;
      console.log('   다음', step, '✅');
      await sleep(2500);
    } else {
      console.log('   다음', step+1, '❌ (더 이상 다음 없음)');
      break;
    }
    
    // 캡션 입력창 나타났는지 확인
    var hasEditor = await page.evaluate(function() {
      return document.querySelectorAll('[contenteditable="true"][role="textbox"]').length > 0;
    });
    if (hasEditor) {
      console.log('   📝 캡션 입력창 발견!');
      break;
    }
  }

  // 캡션 입력
  var editors = await page.$$('[contenteditable="true"][role="textbox"]');
  if (editors.length > 0) {
    console.log('캡션 입력 중...');
    
    // focus
    await editors[0].evaluate(function(el) {
      el.focus();
      // React 상태 업데이트를 위해 input 이벤트 리스너 거치도록 innerText 설정
      var sel = window.getSelection();
      sel.removeAllRanges();
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.addRange(range);
    });
    await sleep(500);
    
    // keyboard.type() 사용 (React 이벤트 핸들링에 더 안정적)
    await page.keyboard.type(CAPTION, { delay: 5 });
    await sleep(2000);
    
    console.log('   ✅ 캡션 입력 완료');
  } else {
    console.log('   ❌ 캡션 입력창 없음');
  }

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

  var locInput = await page.$('[placeholder*="위치"], [placeholder*="location"]');
  if (locInput) {
    await locInput.click({ force: true });
    await sleep(500);
    await locInput.type('서울', { delay: 50 });
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
  for (var a = 0; a < 10; a++) {
    shared = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button'));
      var btn = btns.find(function(b) { return (b.innerText || '').trim() === '공유하기' && !b.disabled; });
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (shared) { console.log('   ✅'); break; }
    await sleep(1000);
  }
  if (!shared) console.log('   ❌');

  await sleep(6000);

  // 확인
  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  var links = await page.evaluate(function() {
    return Array.from(document.querySelectorAll('a')).filter(function(l) { return l.href && l.href.includes('/p/'); }).slice(0, 3).map(function(l) { return l.href; });
  });
  console.log('\n게시물:', links);

  await b.close();
  console.log('\n✅ 완료');
})();

const { chromium } = require('playwright');
const CDP_PORT = 9224;
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
  console.log('=== 인스타 게시물 수정 v2 ===\n');
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
  
  // 1. 게시물 페이지 로드
  console.log('1. 게시물 페이지 로드...');
  await page.goto('https://www.instagram.com/p/DZ6GVaxmT_u/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  
  // 2. "옵션 더 보기" 버튼 찾기
  console.log('2. 옵션 더 보기 버튼 찾기...');
  
  // aria-label이 "옵션 더 보기"인 svg의 부모 찾기
  var optionFound = await page.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var label = svgs[i].getAttribute('aria-label') || '';
      var title = svgs[i].querySelector('title');
      var titleText = title ? title.textContent : '';
      if (label === '옵션 더 보기' || titleText === '옵션 더 보기') {
        // 부모 요소 중 클릭 가능한 요소 찾기
        var el = svgs[i];
        for (var j = 0; j < 3; j++) {
          if (el.parentElement) el = el.parentElement;
          if (el.getAttribute('role') === 'button' || el.tagName === 'BUTTON' || el.tagName === 'A') {
            el.click();
            return 'clicked parent: ' + el.tagName + ' role=' + (el.getAttribute('role') || 'none');
          }
        }
        // 직접 클릭
        svgs[i].click();
        return 'clicked svg direct';
      }
    }
    return 'not found. labels: ' + Array.from(svgs).slice(10, 14).map(function(s) { return s.getAttribute('aria-label') || s.querySelector('title')?.textContent || ''; }).join(', ');
  });
  console.log('   결과:', optionFound);
  await sleep(2000);
  
  // 3. 메뉴에서 "수정" 찾기
  if (optionFound !== 'not found') {
    console.log('3. 수정 메뉴 찾기...');
    var editFound = await page.evaluate(function() {
      // role=menuitem, role=button, 또는 일반 버튼
      var items = Array.from(document.querySelectorAll('[role="menuitem"], [role="button"], button, a'));
      for (var i = 0; i < items.length; i++) {
        var t = (items[i].innerText || '').trim();
        if (t === '수정' || t === 'Edit') {
          if (items[i].offsetParent !== null) {
            items[i].click();
            return 'clicked: ' + t;
          }
        }
      }
      // 모든 보이는 menuitem 텍스트 출력
      var visibleItems = items.filter(function(x) { return x.offsetParent !== null; });
      return 'not found among ' + visibleItems.length + ' visible items. texts: ' + visibleItems.slice(0, 20).map(function(x) { return (x.innerText || '').trim().substring(0, 30); }).filter(function(x) { return x; }).join(', ');
    });
    console.log('   결과:', editFound);
    await sleep(2000);
  }
  
  // 4. 캡션 입력
  console.log('4. 캡션 입력...');
  var editors = await page.$$('[contenteditable="true"][role="textbox"]');
  console.log('   에디터 발견:', editors.length);
  
  if (editors.length > 0) {
    await editors[0].click({ force: true });
    await sleep(500);
    // 기존 내용 지우기
    await editors[0].evaluate(function(el) { el.innerText = ''; });
    await sleep(500);
    await page.keyboard.type(CAPTION, { delay: 8 });
    await sleep(1000);
    console.log('   ✅ 캡션 입력 완료');
  } else {
    // 다른 캡션 입력 방식 찾기
    var inputs = await page.$$('textarea, input[type="text"]');
    console.log('   다른 입력 필드:', inputs.length);
    if (inputs.length > 0) {
      await inputs[0].click({ force: true });
      await sleep(500);
      await inputs[0].evaluate(function(el) { el.value = ''; });
      await sleep(500);
      await page.keyboard.type(CAPTION, { delay: 8 });
      await sleep(1000);
      console.log('   ✅ textarea 입력 완료');
    }
  }
  
  // 5. "완료" 또는 "수정" 버튼
  console.log('5. 완료 버튼 클릭...');
  var done = false;
  for (var a = 0; a < 5; a++) {
    done = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '완료' || t === '수정' || t === 'Done') && btns[i].offsetParent !== null && !btns[i].disabled) {
          btns[i].click();
          return true;
        }
      }
      return false;
    });
    if (done) { console.log('   ✅ 완료 클릭'); break; }
    await sleep(1000);
  }
  if (!done) console.log('   ❌ 완료 버튼 없음');
  
  await sleep(5000);
  
  // 6. 결과 확인 - 페이지 다시 로드
  console.log('\n6. 결과 확인...');
  await page.goto('https://www.instagram.com/p/DZ6GVaxmT_u/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  
  var check = await page.evaluate(function() {
    var text = document.body.innerText || '';
    var idx = text.indexOf('하반기 마케팅');
    return {
      captionFound: idx >= 0,
      preview: idx >= 0 ? text.substring(idx, idx + 80) : 'N/A'
    };
  });
  console.log(JSON.stringify(check, null, 2));
  
  if (check.captionFound) {
    console.log('\n✅ 캡션 정상 등록 확인!');
  } else {
    console.log('\n⚠️ 아직 반영 안 됨. 인스타그램 캐시 문제일 수 있음');
  }
  
  await b.close();
})();

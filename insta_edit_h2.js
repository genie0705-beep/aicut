const { chromium } = require('playwright');
const path = require('path');

const CDP_PORT = 9224;

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const CAPTION = `📅 하반기 마케팅, 지금 준비하세요

"릴스 조회수는 괜찮은데 문의가 안 늘어요"
"AI 영상 툴 써봤는데 오히려 시간만 더 갔어요"
"하반기 예산 짜야 하는데 영상은 어떻게 할지..."

6월, 상반기가 끝나가고 있어요.
지금이 영상 편집 외주사를 정할 가장 완벽한 타이밍입니다 🎯

✅ 하반기 물량 선점 — 7~8월 성수기 대비
✅ 꾸준함이 경쟁력 — 릴스 알고리즘은 꾸준함에 가중치
✅ 시행착오 줄일 시간 — 7월 전에 워크플로우 안정화

👉 블로그에서 자세한 내용 확인하세요 (프로필 링크)

#하반기마케팅 #영상편집외주 #숏폼마케팅 #릴스알고리즘
#AI영상편집 #영상마케팅 #에이컷 #AICUT #콘텐츠마케팅
#인스타마케팅 #SNS마케팅 #마케팅전략 #하반기준비`;

(async () => {
  console.log('=== 인스타 게시물 수정 시작 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 기존 인스타 페이지 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com') && !p.url().includes('accounts')) {
      page = p;
      break;
    }
  }

  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);
  }

  await page.bringToFront();
  await sleep(1000);

  // 게시물 페이지로 이동
  console.log('1. 게시물 페이지로 이동...');
  await page.goto('https://www.instagram.com/p/DZ6GVaxmT_u/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  console.log('   현재 URL:', page.url().substring(0, 80));

  // 2. ⋮ (더보기) 버튼 찾기
  console.log('2. 더보기 버튼 찾기...');
  const moreBtn = await page.evaluate(function() {
    // 방법1: aria-label이 "더 보기" 또는 "More"인 svg
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var ariaLabel = svgs[i].getAttribute('aria-label') || '';
      if (ariaLabel === '더 보기' || ariaLabel === 'More') {
        var parent = svgs[i].closest('[role="button"]') || svgs[i].closest('button') || svgs[i].closest('a') || svgs[i].parentElement;
        if (parent) {
          parent.click();
          return 'clicked via aria-label: ' + ariaLabel;
        }
      }
    }

    // 방법2: 점3개 아이콘 찾기 (모든 버튼 중 점3개만 있는 버튼)
    var btns = document.querySelectorAll('button, [role="button"]');
    for (var j = 0; j < btns.length; j++) {
      var innerBtn = btns[j];
      var innerSvgs = innerBtn.querySelectorAll('svg');
      for (var k = 0; k < innerSvgs.length; k++) {
        var title = innerSvgs[k].querySelector('title');
        if (title && (title.textContent === '더 보기' || title.textContent === 'More')) {
          innerBtn.click();
          return 'clicked via title';
        }
      }
    }

    return 'not found';
  });
  console.log('   결과:', moreBtn);
  await sleep(2000);

  // 3. "수정" 메뉴 선택
  console.log('3. 수정 메뉴 선택...');
  const editResult = await page.evaluate(function() {
    // 메뉴 항목들 중 "수정" 또는 "Edit" 찾기
    var items = document.querySelectorAll('[role="menuitem"], button, div[role="button"], span');
    for (var i = 0; i < items.length; i++) {
      var text = (items[i].innerText || '').trim();
      var ariaLabel = items[i].getAttribute('aria-label') || '';
      if (text === '수정' || text === 'Edit' || ariaLabel === '수정' || ariaLabel === 'Edit') {
        items[i].click();
        return 'clicked';
      }
    }
    // 모든 보이는 버튼 텍스트 확인
    var visibleBtns = Array.from(document.querySelectorAll('button, [role="button"]'))
      .filter(function(b) { return b.offsetParent !== null; })
      .map(function(b) {
        var spans = b.querySelectorAll('span');
        var spanText = '';
        for (var s = 0; s < spans.length; s++) {
          spanText += (spans[s].innerText || '').trim() + ' ';
        }
        return (b.innerText || '').trim() + ' | spans: ' + spanText;
      });
    return 'not found. visible buttons: ' + JSON.stringify(visibleBtns.slice(0, 10));
  });
  console.log('   결과:', editResult);
  await sleep(2000);

  // 4. 캡션 입력
  console.log('4. 캡션 입력...');
  var captionDone = false;

  // contenteditable 캡션 입력창 찾기
  var editors = await page.$$('[contenteditable="true"][role="textbox"]');
  if (editors.length > 0) {
    // 이미 내용이 있는지 확인
    var currentText = await editors[0].evaluate(function(el) { return el.innerText; });
    console.log('   현재 캡션:', currentText.substring(0, 50));

    if (currentText.trim().length === 0) {
      // 비어 있으면 입력
      await editors[0].click({ force: true });
      await sleep(500);
      await page.keyboard.type(CAPTION, { delay: 10 });
      captionDone = true;
      console.log('   ✅ 캡션 입력 완료');
    } else {
      // 내용이 있으면 덮어쓰기
      await editors[0].evaluate(function(el) { el.innerText = ''; });
      await sleep(500);
      await editors[0].click({ force: true });
      await sleep(500);
      await page.keyboard.type(CAPTION, { delay: 10 });
      captionDone = true;
      console.log('   ✅ 캡션 덮어쓰기 완료');
    }
  } else {
    console.log('   ❌ 에디터 찾을 수 없음');
  }
  await sleep(2000);

  // 5. "완료" 또는 "수정" 버튼
  console.log('5. 완료 버튼 클릭...');
  var doneResult = await page.evaluate(function() {
    var btns = document.querySelectorAll('button, [role="button"]');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if ((t === '완료' || t === '수정' || t === 'Done') && btns[i].offsetParent !== null && !btns[i].disabled) {
        btns[i].click();
        return 'clicked: ' + t;
      }
    }
    return 'not found';
  });
  console.log('   결과:', doneResult);
  await sleep(5000);

  // 6. 결과 확인
  console.log('\n6. 수정 결과 확인...');
  var check = await page.evaluate(function() {
    var allText = document.body.innerText || '';
    var hasCaption = allText.indexOf('하반기 마케팅') >= 0;
    return {
      url: window.location.href.substring(0, 80),
      captionFound: hasCaption,
      captionPreview: hasCaption ? allText.substring(allText.indexOf('하반기 마케팅'), allText.indexOf('하반기 마케팅') + 60) : 'N/A'
    };
  });
  console.log(JSON.stringify(check, null, 2));

  if (check.captionFound) {
    console.log('\n✅ 캡션 수정 완료!');
  } else {
    console.log('\n⚠️ 캡션이 아직 안 보일 수 있습니다. 페이지 새로고침 후 확인 필요');
  }

  await b.close();
})();

// 네이버 블로그 글쓰기 — 키보드 입력 방식 (React 이벤트 직접 트리거)
const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';
const TAGS = '온라인강의,영상편집외주,온라인교육,클래스101,탈잉,인프런,유튜브강의,숏폼마케팅,강의영상,교육콘텐츠,에이컷,릴스마케팅,쇼츠마케팅,온라인강사,크리에이터,영상편집업체,강의편집,영상마케팅,콘텐츠마케팅,인스타그램릴스,유튜브쇼츠,교육스타트업,강의촬영,자막편집,브랜드영상,강사마케팅,숏폼강의,에듀테크';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  // 1. 블로그 글쓰기 페이지 열기
  console.log('1. 블로그 글쓰기 페이지 로딩...');
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('blog.naver.com') && pg.url().includes('aicut')) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('블로그 페이지 없음'); await b.close(); return; }
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(5000);

  // 2. 에디터가 로드될 때까지 충분히 대기
  console.log('2. 에디터 로딩 대기...');
  
  // mainFrame 찾기
  let mainFrame = null;
  let editorFrame = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mainFrame = f; }
    try {
      var url = f.url() || '';
      if (url.indexOf('PostWriteForm') >= 0 && url.indexOf('wtm') < 0) { editorFrame = f; }
    } catch(e) {}
  }

  if (!editorFrame) {
    console.log('에디터 프레임 없음 - 다시 로딩 대기');
    await sleep(3000);
    for (const f of page.frames()) {
      try {
        var url = f.url() || '';
        if (url.indexOf('PostWriteForm') >= 0 && url.indexOf('wtm') < 0) { editorFrame = f; }
      } catch(e) {}
    }
  }
  
  if (!editorFrame) { console.log('에디터 프레임 없음'); await b.close(); return; }
  console.log('  에디터 프레임 로딩 완료');
  
  await sleep(2000);

  // 3. 제목 입력 — contenteditable div 찾기
  console.log('3. 제목 입력...');
  
  var titleInfo = await editorFrame.evaluate(function(title) {
    // 1차: input 요소 찾기
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var ph = (input.placeholder || '');
      // '글감 검색' 제외한 첫 번째 가시적 input
      if (input.offsetParent !== null && ph.indexOf('글감') < 0) {
        input.focus();
        // React의 onChange를 트리거하기 위해 Native value setter 사용
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(input, title);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return 'input_filled';
      }
    }
    
    // 2차: contenteditable 찾기
    var ceElements = document.querySelectorAll('[contenteditable]');
    for (var j = 0; j < ceElements.length; j++) {
      var ce = ceElements[j];
      var r = ce.getBoundingClientRect();
      // 화면 내에 보이는 contenteditable (title 영역)
      if (r.y >= 0 && r.y < 200 && r.width > 100) {
        ce.focus();
        ce.innerText = title;
        ce.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ce_filled_at_y' + Math.round(r.y);
      }
    }
    
    // 3차: 모든 contenteditable 정보 반환
    var allCE = [];
    ceElements.forEach(function(el) {
      var rr = el.getBoundingClientRect();
      allCE.push({ tag: el.tagName, id: el.id, text: (el.innerText || '').substring(0, 15), rect: Math.round(rr.x) + ',' + Math.round(rr.y) + ' ' + Math.round(rr.width) + 'x' + Math.round(rr.height) });
    });
    return { no_title: 'CE not found', allCE: allCE };
  }, TITLE);
  
  console.log('  결과:', JSON.stringify(titleInfo).substring(0, 300));

  await sleep(2000);

  // 4. inputBuffer 프레임 찾기 (본문 contenteditable)
  console.log('4. 본문 입력...');
  
  var inputBuffer = null;
  for (const f of editorFrame.childFrames()) {
    try {
      var isCE = await f.evaluate(function() {
        try { return document.body && document.body.getAttribute('contenteditable') === 'true'; }
        catch(e) { return false; }
      });
      if (isCE) { inputBuffer = f; break; }
    } catch(e) {}
  }

  if (inputBuffer) {
    var bodyHTML = '<p>온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 <strong>퀄리티</strong>가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, <strong>편집의 완성도</strong>가 시청자의 몰입과 만족도를 결정합니다.</p><p><br></p><p>"강의 준비하고 촬영하고 나면 편집할 시간이 없다."<br>"숏폼 홍보 영상은 누가 만들어주지?"</p><p><br></p><p>정답은 <strong>영상 편집 아웃소싱</strong>입니다.</p><p><br></p><h2>1. 강의 퀄리티가 비약적으로 상승한다</h2><p><strong>자막의 가독성</strong>, <strong>호흡 조절</strong>, <strong>브랜드 통일감</strong> — 전문 편집자는 모든 요소를 한 번에 처리합니다.</p><p><br></p><h2>2. 제작 시간이 70% 단축된다</h2><p>1시간 강의 편집에 <strong>3~4시간</strong> 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.</p><p><br></p><h2>3. 숏폼 채널을 자동으로 성장시킨다</h2><p>릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.</p><p><br></p><h2>4. 편집 파트너 고를 때 체크할 3가지</h2><p>① 강의 콘텐츠를 이해하는가<br>② 정기 납품이 가능한가<br>③ 빠른 수정 대응이 가능한가</p><p><br></p><h2>5. 지금 시작해야 하는 이유</h2><p>네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다. 지금 시작하는 사람과 1년 후 시작하는 사람의 차이는 <strong>콘텐츠 누적량</strong>에서 발생합니다.</p><p><br></p><p>📞 지금 무료 상담 받기</p><p>📩 카카오톡 채널: 에이컷<br>📧 이메일: contact@aicut.co.kr<br>🌐 홈페이지: aicut.co.kr</p>';
    
    var bodyResult = await inputBuffer.evaluate(function(html) {
      try {
        document.body.innerHTML = html;
        document.body.dispatchEvent(new Event('input', { bubbles: true }));
        return 'body_set_' + html.length + 'chars';
      } catch(e) { return 'error: ' + e.message.substring(0, 50); }
    }, bodyHTML);
    console.log('  ' + bodyResult);
  } else {
    console.log('  inputBuffer 없음 → editorFrame 직접 시도');
    var bodyResult = await editorFrame.evaluate(function(html) {
      try {
        var ce = document.querySelector('[contenteditable]');
        if (ce) {
          // Find the one that's visible and in content area (y > 100)
          var allCE = document.querySelectorAll('[contenteditable]');
          for (var i = 0; i < allCE.length; i++) {
            var r = allCE[i].getBoundingClientRect();
            if (r.y > 100 && r.width > 200) {
              allCE[i].focus();
              allCE[i].innerHTML = html;
              allCE[i].dispatchEvent(new Event('input', { bubbles: true }));
              return 'ce_' + i + '_set_y' + Math.round(r.y);
            }
          }
          return 'no_visible_ce';
        }
        return 'no_ce';
      } catch(e) { return 'error: ' + e.message.substring(0, 50); }
    }, bodyHTML);
    console.log('  ' + bodyResult);
  }

  await sleep(2000);

  // 5. 저장
  console.log('5. 저장...');
  if (mainFrame) {
    var saveResult = await mainFrame.evaluate(function() {
      // Method 1: direct button click
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click();
          return '저장_직접클릭';
        }
      }
      // Method 2: keyboard shortcut (Ctrl+S)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
      return 'Ctrl+S_시도';
    });
    console.log('  ' + saveResult);
  }

  await sleep(3000);

  console.log('\n✅ 작업 완료! 블로그 탭 확인해주세요.');
  
  await b.close();
})();

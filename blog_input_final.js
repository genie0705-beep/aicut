const { chromium } = require('playwright');

const POST = {
  title: '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점',
  tags: '온라인강의,영상편집외주,온라인교육,클래스101,탈잉,인프런,유튜브강의,숏폼마케팅,강의영상,교육콘텐츠,에이컷,릴스마케팅,쇼츠마케팅,온라인강사,크리에이터,영상편집업체,강의편집,영상마케팅,콘텐츠마케팅,인스타그램릴스,유튜브쇼츠,교육스타트업,강의촬영,자막편집,브랜드영상,강사마케팅,숏폼강의,에듀테크',
  body: '온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 <strong>퀄리티</strong>가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, <strong>편집의 완성도</strong>가 시청자의 몰입과 만족도를 결정합니다.<br><br>하지만 대부분의 강사분들은 이런 고민을 합니다.<br><br>"강의 준비하고 촬영하고 나면 편집할 시간이 없다."<br>"숏폼 홍보 영상은 누가 만들어주지?"<br>"혼자서 유튜브 채널 운영하는 게 너무 버겁다."<br><br>정답은 <strong>영상 편집 아웃소싱</strong>입니다. 이번 글에서는 온라인 강사가 영상 편집을 외주 맡겼을 때 얻을 수 있는 <strong>5가지 실질적인 장점</strong>을 소개합니다.<br><br><h2>1. 강의 퀄리티가 비약적으로 상승한다</h2><br>가장 큰 변화는 <strong>편집의 전문성</strong>입니다. 혼자서 직접 편집할 때는 어쩔 수 없이 놓치는 부분이 생깁니다.<br><br><strong>자막의 가독성</strong> — 폰트·크기·위치의 일관성 부족<br><strong>호흡 조절</strong> — 군더더기 장면, 침묵 구간 정리 미흡<br><strong>브랜드 통일감</strong> — 매 영상마다 다른 인트로/아웃트로<br><br>전문 편집자는 이런 요소를 한 번에 처리합니다. <strong>강사는 내용에 집중</strong>하고, 편집은 전문가에게 맡기는 구조가 가장 효율적입니다.<br><br><h2>2. 제작 시간이 70% 단축된다</h2><br>1시간 강의를 촬영한 후 직접 편집하면 보통 <strong>3~4시간</strong>이 소요됩니다. 여기에 자막 작업, 썸네일 제작, 숏폼 변환까지 하루가 다 갑니다.<br><br>즉, <strong>강의 콘텐츠 기획과 촬영에 집중</strong>할 수 있다는 것이 가장 큰 장점입니다.<br><br><h2>3. 숏폼 채널을 자동으로 성장시킨다</h2><br>온라인 강사에게 <strong>숏폼</strong>은 더 이상 선택이 아닙니다. 인스타그램 릴스, 유튜브 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.<br><br>에이컷에 맡기면 <strong>강의 원본만 보내면</strong> 자막, BGM, 브랜드 로고가 적용된 릴스/쇼츠로 제작해 드립니다.<br><br>"쇼츠 숏폼 매주 2편 올린 후 구독자 3개월 만에 2배 증가했습니다." — 프로그래밍 강사 J님<br><br><h2>4. 편집 파트너 고를 때 체크할 3가지</h2><br>처음 아웃소싱을 고려한다면 아래 3가지를 꼭 확인하세요.<br><br>1. <strong>강의 콘텐츠를 이해하는가</strong> — 단순 편집이 아니라 교육적 맥락을 이해하는 파트너<br>2. <strong>정기 납품이 가능한가</strong> — 주 1~2편, 월 8~10편 등 꾸준한 일정 유지<br>3. <strong>빠른 수정 대응이 가능한가</strong> — 시급한 수정 요청에 24시간 내 대응<br><br>이 조건을 충족하는 파트너를 고르면 <strong>오래 지속되는 협업 관계</strong>를 유지할 수 있습니다.<br><br><h2>5. 지금 시작해야 하는 이유</h2><br>온라인 교육 시장에서 <strong>영상 콘텐츠의 중요성</strong>은 점점 커지고 있습니다. 네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.<br><br>지금 시작하는 사람과 1년 후 시작하는 사람의 차이는 <strong>채널 규모가 아니라 콘텐츠 누적량</strong>에서 발생합니다.<br><br>결론: 편집은 아웃소싱하고, 강의 기획과 촬영에 집중하세요. 그게 가장 빠르게 채널을 성장시키는 방법입니다.<br><br>📞 지금 무료 상담 받기<br><br>영상 편집 아웃소싱이 처음이시라면 부담 없이 문의 주세요. 강의 유형에 맞춘 맞춤 견적과 샘플 편집본을 먼저 보내드립니다.<br><br>📩 카카오톡 채널: 에이컷<br>📧 이메일: contact@aicut.co.kr<br>🌐 홈페이지: aicut.co.kr'
};

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  // Find the write page
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('Redirect=Write')) { page = pg; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(3000);

  // Frame 1 = PostWriteForm (contains editor)
  let editorFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes('PostWriteForm')) {
      editorFrame = f;
      break;
    }
  }
  if (!editorFrame) { console.log('no editor frame'); await b.close(); return; }

  // Step 1: 제목 입력 — first input in the frame
  console.log('1. 제목 입력...');
  const titleDone = await editorFrame.evaluate(function(title) {
    // Find title input - it's usually hidden or in a complex structure
    // Try finding by placeholder or data attribute
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var ph = (el.placeholder || '');
      var type = (el.type || '');
      if (ph.indexOf('글감') < 0 && (type === 'text' || type === 'search') && el.offsetParent !== null) {
        el.focus();
        el.value = title;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return 'input_' + i + '_set';
      }
    }
    // Try contenteditable title
    var ceElements = document.querySelectorAll('[contenteditable]');
    for (var j = 0; j < ceElements.length; j++) {
      var ce = ceElements[j];
      var r = ce.getBoundingClientRect();
      if (r.x > -1000 && r.width > 50 && ce.innerHTML.length < 10) {
        ce.focus();
        ce.innerHTML = title;
        ce.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ce_title_set';
      }
    }
    return 'no_title_field';
  }, POST.title);
  console.log('  결과:', titleDone);

  await sleep(1000);

  // Step 2: 본문 입력 — contenteditable body
  console.log('2. 본문 입력...');
  const bodyDone = await editorFrame.evaluate(function(bodyHTML) {
    // Find the main contenteditable
    var ceElements = document.querySelectorAll('[contenteditable]');
    var targetCE = null;
    for (var i = 0; i < ceElements.length; i++) {
      var ce = ceElements[i];
      var r = ce.getBoundingClientRect();
      // Find the visible contenteditable that's not the title
      if (r.width > 100 && r.y > 50) {
        targetCE = ce;
        break;
      }
    }
    if (!targetCE) {
      // Try: use the body (it's contenteditable in the editor iframe)
      targetCE = document.body;
    }
    
    targetCE.focus();
    targetCE.innerHTML = bodyHTML;
    targetCE.dispatchEvent(new Event('input', { bubbles: true }));
    return 'inserted_' + bodyHTML.length + 'chars';
  }, POST.body);
  console.log('  결과:', bodyDone);
  
  await sleep(1000);

  // Step 3: 저장 버튼 찾기
  console.log('3. 저장 버튼 찾기...');
  const saveDone = await editorFrame.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '저장' && btns[i].offsetParent !== null) {
        btns[i].click();
        return '저장_클릭';
      }
    }
    return '저장_없음';
  });
  console.log('  결과:', saveDone);
  
  await sleep(3000);
  
  // Step 4: 확인 다이얼로그 처리
  console.log('4. 확인 처리...');
  try {
    await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '확인' || t === '예') && btns[i].offsetParent !== null) {
          btns[i].click();
          return;
        }
      }
    });
  } catch(e) {}
  
  await sleep(2000);
  
  console.log('\n✅ 블로그 초안 입력 완료!');
  console.log('📋 정이사님, 검토 후 발행 부탁드립니다.');
  
  await b.close();
})();

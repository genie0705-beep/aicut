const { chromium } = require('playwright');

const TITLE = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';
const BODY_HTML = '온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 <strong>퀄리티</strong>가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, <strong>편집의 완성도</strong>가 시청자의 몰입과 만족도를 결정합니다.<br><br>하지만 대부분의 강사분들은 이런 고민을 합니다.<br><br>"강의 준비하고 촬영하고 나면 편집할 시간이 없다."<br>"숏폼 홍보 영상은 누가 만들어주지?"<br>"혼자서 유튜브 채널 운영하는 게 너무 버겁다."<br><br>정답은 <strong>영상 편집 아웃소싱</strong>입니다.<br><br><h2>1. 강의 퀄리티가 비약적으로 상승한다</h2><br>가장 큰 변화는 <strong>편집의 전문성</strong>입니다. <strong>자막의 가독성</strong>, <strong>호흡 조절</strong>, <strong>브랜드 통일감</strong> — 전문 편집자는 이 모든 요소를 한 번에 처리합니다.<br><br><h2>2. 제작 시간이 70% 단축된다</h2><br>1시간 강의 편집에 보통 <strong>3~4시간</strong> 필요하지만, 아웃소싱하면 제작 시간이 대폭 줄어듭니다. 강의 기획과 촬영에 집중할 수 있습니다.<br><br><h2>3. 숏폼 채널을 자동으로 성장시킨다</h2><br>릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다. 강의 원본만 보내면 자막, BGM이 적용된 숏폼으로 제작해 드립니다.<br><br><h2>4. 편집 파트너 고를 때 체크할 3가지</h2><br>① 강의 콘텐츠를 이해하는가<br>② 정기 납품이 가능한가<br>③ 빠른 수정 대응이 가능한가<br><br><h2>5. 지금 시작해야 하는 이유</h2><br>네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다. 지금 시작하는 사람과 1년 후 시작하는 사람의 차이는 <strong>콘텐츠 누적량</strong>에서 발생합니다.<br><br>📞 지금 무료 상담 받기<br><br>영상 편집 아웃소싱이 처음이시라면 부담 없이 문의 주세요.<br>📩 카카오톡 채널: 에이컷<br>📧 이메일: contact@aicut.co.kr<br>🌐 홈페이지: aicut.co.kr';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  // Go to write page fresh
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('blog.naver.com') && pg.url().includes('aicut')) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(4000);

  // Find frames
  var mainFrame = null;
  var editorFrame = null;
  var inputBuffer = null;
  
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mainFrame = f; }
    try {
      var url = f.url();
      if (url.indexOf('PostWriteForm') >= 0 && url.indexOf('wtm') < 0) { editorFrame = f; }
      var ce = await f.evaluate(function() {
        try { return document.body && document.body.getAttribute('contenteditable') === 'true'; }
        catch(e) { return false; }
      });
      if (ce) { inputBuffer = f; }
    } catch(e) {}
  }

  if (!mainFrame || !editorFrame) { console.log('frames missing'); await b.close(); return; }

  // Step 1: SmartEditor API로 제목 설정
  console.log('1/4 제목 입력...');
  var titleResult = await editorFrame.evaluate(function(title) {
    try {
      // SmartEditor API in PostWriteForm iframe
      var editor = SmartEditor._editors['blogpc001'];
      if (!editor) return 'no_editor';
      
      // Try setDocumentData
      if (editor.setDocumentData) {
        editor.setDocumentData({ title: title });
        return 'setDocumentData';
      }
      
      // Try getDocumentData / setDocumentData
      var data = editor.getDocumentData ? editor.getDocumentData() : {};
      data.title = title;
      if (editor.setDocumentData) {
        editor.setDocumentData(data);
        return 'setDocumentData2';
      }
      
      // Fallback: find title element in the frame
      var inputs = document.querySelectorAll('input');
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].offsetParent !== null && (inputs[i].placeholder || '').indexOf('글감') < 0) {
          inputs[i].focus();
          inputs[i].value = title;
          inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
          return 'input_' + i + '_set';
        }
      }
      return 'no_method';
    } catch(e) { return 'error: ' + e.message.substring(0, 50); }
  }, TITLE);
  console.log('  ' + titleResult);

  await sleep(1000);

  // Step 2: 본문 입력 via inputBuffer
  console.log('2/4 본문 입력...');
  if (inputBuffer) {
    var bodyResult = await inputBuffer.evaluate(function(html) {
      try {
        document.body.innerHTML = html;
        document.body.dispatchEvent(new Event('input', { bubbles: true }));
        return 'body_set_' + html.length + 'chars';
      } catch(e) { return 'error: ' + e.message.substring(0, 50); }
    }, BODY_HTML);
    console.log('  ' + bodyResult);
  } else {
    console.log('  inputBuffer 없음');
  }

  await sleep(2000);

  // Step 3: 저장 버튼 클릭 (mainFrame)
  console.log('3/4 저장 중...');
  var saveResult = await mainFrame.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        btns[i].click();
        return '저장_클릭';
      }
    }
    return '저장_없음';
  });
  console.log('  ' + saveResult);

  await sleep(3000);

  // Step 4: 확인 - 저장 후 상태 체크
  console.log('4/4 확인...');
  try {
    var confirmResult = await mainFrame.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '확인' || t === '예') && btns[i].offsetParent !== null) {
          btns[i].click();
          return '확인_클릭';
        }
      }
      return '확인_버튼_없음';
    });
    console.log('  ' + confirmResult);
  } catch(e) {}

  await sleep(2000);
  
  console.log('\n✅ 블로그 입력 완료!');
  console.log('📋 정이사님, 현재 블로그 탭에서 내용 확인 후 발행해주세요.');
  
  await b.close();
})();

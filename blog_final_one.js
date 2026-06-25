const { chromium } = require('playwright');
const TITLE = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  // 1. 블로그 페이지 열기
  console.log('1. 페이지 로딩...');
  let page = null;
  for (const pg of ctx.pages()) {
    var u = pg.url();
    if (u.indexOf('blog.naver.com') >= 0 && u.indexOf('aicut') >= 0) { page = pg; break; }
  }
  if (!page) { console.log('블로그 페이지 없음'); await b.close(); return; }
  
  try {
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) {
    console.log('  (네비게이션 경고 무시 - 페이지 로딩 계속)');
  }
  await sleep(5000);

  // 2. 프레임 식별
  console.log('2. 프레임 식별...');
  var editorFrame = null;  // PostWriteForm (SmartEditor)
  var inputBuf = null;     // contenteditable body
  
  for (const f of page.frames()) {
    try {
      var u = f.url() || '';
      if (u.indexOf('PostWriteForm') >= 0 && u.indexOf('wtm') < 0) {
        if (f.name() && f.name().indexOf('input_buffer') >= 0) {
          inputBuf = f;
        } else {
          editorFrame = f;
        }
      }
    } catch(e) {}
  }

  if (!editorFrame) { console.log('editorFrame 없음'); await b.close(); return; }
  console.log('  editorFrame:', editorFrame ? '✅' : '❌');
  console.log('  inputBuffer:', inputBuf ? '✅' : '❌');

  // 3. SmartEditor API로 제목 설정
  console.log('3. 제목 설정...');
  var titleResult = await editorFrame.evaluate(function(title) {
    try {
      var editor = SmartEditor._editors['blogpc001'];
      if (!editor) return 'no_editor';
      
      // 방법1: setDocumentTitle (직접 API)
      if (typeof editor.setDocumentTitle === 'function') {
        editor.setDocumentTitle(title);
        var check = editor.getDocumentTitle ? editor.getDocumentTitle() : '';
        return 'setDocumentTitle: ' + (check ? '✅' : '❌');
      }
      
      // 방법2: setDocumentData
      if (typeof editor.setDocumentData === 'function') {
        var data = { title: title };
        editor.setDocumentData(data);
        return 'setDocumentData';
      }
      
      // 방법3: focusTitle 후 키보드 입력 트리거
      if (typeof editor.focusTitle === 'function') {
        editor.focusTitle();
        // React가 re-render하게 dispatch
        document.body.dispatchEvent(new Event('click', { bubbles: true }));
        return 'focusTitle';
      }
      
      return 'no_method_available';
    } catch(e) { return 'error: ' + e.message.substring(0, 50); }
  }, TITLE);
  console.log('  ' + titleResult);

  await sleep(2000);

  // 4. inputBuf에 본문 입력
  console.log('4. 본문 입력...');
  if (inputBuf) {
    var bodyHTML = '<p>온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 <strong>퀄리티</strong>가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, <strong>편집의 완성도</strong>가 시청자의 몰입과 만족도를 결정합니다.</p><p><br></p><h2>1. 강의 퀄리티가 비약적으로 상승한다</h2><p><strong>자막의 가독성</strong>, <strong>호흡 조절</strong>, <strong>브랜드 통일감</strong> — 전문 편집자는 모든 요소를 한 번에 처리합니다.</p><p><br></p><h2>2. 제작 시간이 70% 단축된다</h2><p>1시간 강의 편집에 <strong>3~4시간</strong> 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.</p><p><br></p><h2>3. 숏폼 채널을 자동으로 성장시킨다</h2><p>릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.</p><p><br></p><h2>4. 편집 파트너 고를 때 체크할 3가지</h2><p>① 강의 콘텐츠를 이해하는가 ② 정기 납품이 가능한가 ③ 빠른 수정 대응이 가능한가</p><p><br></p><h2>5. 지금 시작해야 하는 이유</h2><p>네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다. 지금 시작하는 사람과 1년 후 시작하는 사람의 차이는 <strong>콘텐츠 누적량</strong>에서 발생합니다.</p><p><br></p><p>📞 지금 무료 상담 받기</p><p>📩 카카오톡 채널: 에이컷<br>📧 이메일: contact@aicut.co.kr<br>🌐 홈페이지: aicut.co.kr</p>';
    
    var bodyResult = await inputBuf.evaluate(function(html) {
      try {
        document.body.innerHTML = html;
        document.body.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ok_' + html.length + 'chars';
      } catch(e) { return 'err_' + e.message.substring(0, 20); }
    }, bodyHTML);
    console.log('  ' + bodyResult);
  } else {
    console.log('  inputBuffer 없음');
  }

  await sleep(2000);

  // 5. 저장
  console.log('5. 저장...');
  var mainFrame = editorFrame;  // PostWriteForm = mainFrame
  var saveResult = await mainFrame.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        btns[i].click();
        return '저장됨';
      }
    }
    return '저장버튼없음';
  });
  console.log('  ' + saveResult);

  await sleep(3000);

  // 6. 제목 확인
  console.log('6. 확인...');
  var finalCheck = await editorFrame.evaluate(function() {
    try {
      var editor = SmartEditor._editors['blogpc001'];
      if (!editor) return 'no_editor';
      var title = editor.getDocumentTitle ? editor.getDocumentTitle() : 'N/A';
      return '제목: "' + (title || '') + '"';
    } catch(e) {
      return 'error: ' + e.message.substring(0, 50);
    }
  });
  console.log('  ' + finalCheck);

  console.log('\n✅ 완료! 블로그 탭 확인해주세요.');
  await b.close();
})();

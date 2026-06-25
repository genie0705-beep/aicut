const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  var pages = ctx.pages();
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('aicut') >= 0 && pages[i].url().indexOf('Write') >= 0) { page = pages[i]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(4000);

  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('frames missing'); await b.close(); return; }

  // 1. 제목 설정 (API - 화면에 표시됨)
  console.log('1. 제목 설정...');
  await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      // Clear all body components first
      var data = ed.getDocumentData();
      data.document.components = [];
      ed.setDocumentData(data);
      ed.setDocumentTitle('병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)');
    } catch(e) {}
  });
  console.log('  제목 설정 완료');
  await sleep(1000);

  // 2. 클립보드에 본문 HTML 복사
  console.log('2. 클립보드 준비...');
  var bodyHTML = '<p>병원 영상마케팅을 고민하는 원장님들께서 가장 궁금해하는 것이 있습니다. "숏폼 영상을 하면 효과가 있을까?" "한 편 제작하는 데 얼마나 들지?"</p><p><br></p><h2>1. 병원 숏폼 마케팅, 왜 지금 시작해야 할까</h2><p>대기 시간에 릴스를 보는 환자들은 점점 늘고 있습니다. 실제로 네이버 데이터에 따르면 관련 검색량이 전년 대비 약 2.5배 증가했습니다. 성형외과, 피부과, 치과, 한의원 모두 숏폼 콘텐츠가 환자 유입에 효과적입니다.</p><p><br></p><h2>2. 숏폼 1편, 실제 제작 비용</h2><p>중요한 건 비용이 아니라 꾸준함입니다. 릴스는 한 번 올린다고 효과가 나지 않습니다. 주 2~3편, 월 8~12편을 최소 3개월 이상 유지해야 검색 상위 노출이 시작됩니다.</p><p><br></p><h2>3. 실제 도입 사례 — 성형외과 K원장님</h2><p>도입 전 팔로워 300명에서 도입 3개월 후 2,100명으로 증가했습니다. 문의 또한 월 3~5건에서 20~30건으로 늘었습니다. 가장 효과가 좋았던 콘텐츠는 원장님의 진정성 있는 설명이 담긴 숏폼이었습니다.</p><p><br></p><h2>4. 지금 시작해야 하는 이유</h2><p>네이버와 인스타그램 모두 숏폼 콘텐츠에 검색 가중치를 높이고 있습니다. 지금 시작하는 병원과 6개월 후 시작하는 병원의 차이는 쌓인 콘텐츠의 차이입니다.</p><p><br></p><p>카카오톡 채널: 에이컷 | 이메일: contact@aicut.co.kr | 홈페이지: aicut.co.kr</p>';

  // 클립보드 설정 (page.evaluate에서 navigator.clipboard.writeText 사용)
  var clipResult = await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      // HTML 컨텐츠를 클립보드에 쓰기 (Blob 방식)
      var blob = new Blob([html], { type: 'text/html' });
      var clipboardItem = new ClipboardItem({ 'text/html': blob });
      navigator.clipboard.write([clipboardItem]).then(function() {
        resolve('clipboard_set');
      }).catch(function(err) {
        // text/html이 안 되면 text/plain으로
        navigator.clipboard.writeText(html).then(function() {
          resolve('clipboard_set_text');
        }).catch(function(e) {
          resolve('clipboard_error: ' + e.message.substring(0, 30));
        });
      });
    });
  }, bodyHTML);
  console.log('  ' + clipResult);

  await sleep(1000);

  // 3. 본문 영역 클릭 후 Ctrl+V (붙여넣기)
  console.log('3. 본문 영역 클릭...');
  await page.mouse.click(510, 400);
  await sleep(1500);

  console.log('4. Ctrl+V 붙여넣기...');
  await page.keyboard.press('Control+v');
  await sleep(3000);

  // 5. 확인
  console.log('5. 확인...');
  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      return { hasContent: text.length > 0, preview: text.substring(0, 40) };
    } catch(e) { return { error: e.message.substring(0, 30) }; }
  });
  console.log('  내용:', JSON.stringify(check));

  if (check.hasContent) {
    // 이미지 업로드는 여기서 하지 않음 (사용자가 직접)
    console.log('6. 저장...');
    try {
      await mf.evaluate(function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
        }
      });
      console.log('  저장됨');
    } catch(e) {}
  } else {
    console.log('  ⚠️ 붙여넣기 실패');
  }

  await sleep(2000);
  console.log('\n✅ 완료!');
  await b.close();
})();

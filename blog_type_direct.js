// React가 관리하는 contenteditable에 직접 키보드 입력
const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().indexOf('aicut') >= 0 && pg.url().indexOf('Write') >= 0) { page = pg; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(4000);

  // Find mainFrame (PostWriteForm) - this is the React editor
  let mf = null;
  for (const f of page.frames()) { if (f.name() === 'mainFrame') { mf = f; break; } }
  if (!mf) { console.log('no mainFrame'); await b.close(); return; }

  // Step 1: Find the actual React-rendered contenteditable element in mainFrame
  console.log('1. React editor 요소 찾기...');
  var editorInfo = await mf.evaluate(function() {
    // Find ALL contenteditable elements
    var allCE = document.querySelectorAll('[contenteditable]');
    var results = [];
    allCE.forEach(function(el, i) {
      var r = el.getBoundingClientRect();
      results.push({
        idx: i,
        tag: el.tagName,
        id: el.id,
        text: (el.innerText || '').trim().substring(0, 20),
        rect: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height),
        visible: r.width > 0 && r.height > 0
      });
    });
    
    // Also find any textarea or input that could be the editor
    var inputs = document.querySelectorAll('textarea, input');
    inputs.forEach(function(el) {
      var r = el.getBoundingClientRect();
      if (r.width > 50) {
        results.push({
          tag: el.tagName,
          id: el.id,
          ph: (el.placeholder || ''),
          rect: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height),
          visible: true
        });
      }
    });
    
    return results;
  });

  console.log('  찾은 요소:');
  editorInfo.forEach(function(el) {
    console.log('    [' + el.idx + '] ' + (el.id || el.tag) + ' text="' + (el.text || el.ph || '') + '" ' + el.rect + (el.visible ? '' : ' (hidden)'));
  });

  // Step 2: Find the visible contenteditable in the editor area (y > 50)
  var editorCE = null;
  for (var i = 0; i < editorInfo.length; i++) {
    var e = editorInfo[i];
    if (e.visible && e.rect && e.rect.indexOf('0,') !== 0) {
      var parts = e.rect.split(' ');
      if (parts.length >= 2) {
        var coords = parts[0].split(',');
        var y = parseInt(coords[1]);
        if (y > 30 && y < 500) {
          editorCE = e;
          break;
        }
      }
    }
  }

  if (!editorCE) {
    console.log('  에디터 요소 못 찾음, 기본 위치 사용');
    // Use default position: after toolbar (y=50)
    editorCE = { rect: '100,80 800x400' };
  }

  console.log('  대상:', JSON.stringify(editorCE));

  // Step 3: Click the editor area and type
  var parts = editorCE.rect.split(' ');
  var coords = parts[0].split(',');
  var clickX = parseInt(coords[0]) + 20;
  var clickY = parseInt(coords[1]) + 10;

  console.log('2. 에디터 클릭 및 본문 입력...');
  await page.mouse.click(clickX, clickY);
  await sleep(1000);

  var bodyText = '온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 퀄리티가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, 편집의 완성도가 시청자의 몰입과 만족도를 결정합니다.\n\n1. 강의 퀄리티가 비약적으로 상승한다\n자막의 가독성, 호흡 조절, 브랜드 통일감 — 전문 편집자는 모든 요소를 한 번에 처리합니다.\n\n2. 제작 시간이 70% 단축된다\n1시간 강의 편집에 3~4시간 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.\n\n3. 숏폼 채널을 자동으로 성장시킨다\n릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.\n\n4. 편집 파트너 고를 때 체크할 3가지\n① 강의 콘텐츠를 이해하는가 ② 정기 납품이 가능한가 ③ 빠른 수정 대응이 가능한가\n\n5. 지금 시작해야 하는 이유\n네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.\n\n지금 무료 상담 받기\n카카오톡 채널: 에이컷\n이메일: contact@aicut.co.kr\n홈페이지: aicut.co.kr';

  await page.keyboard.type(bodyText, { delay: 6 });
  console.log('  본문 타자 입력 완료');

  await sleep(2000);

  // Step 4: 저장
  console.log('3. 저장...');
  var savePos = await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        var r = btns[i].getBoundingClientRect();
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    return null;
  });

  if (savePos) {
    await page.mouse.click(savePos.x, savePos.y);
    console.log('  저장됨');
  }

  await sleep(3000);

  // Step 5: 확인
  var checkText = await mf.evaluate(function() {
    // Check for our content in any contenteditable or in the page text
    var allText = document.body.innerText || '';
    return {
      hasContent: allText.indexOf('온라인 강의 시장이') >= 0,
      preview: allText.substring(0, 100).replace(/\\n/g, ' ')
    };
  });
  
  console.log('4. 확인:', JSON.stringify(checkText));

  console.log('\n✅ 완료! 블로그 탭 확인해주세요.');
  await b.close();
})();

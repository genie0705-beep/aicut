const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().indexOf('aicut') >= 0) { page = pg; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(3000);

  // 현재 페이지에서 iframe/요소 위치 정밀 분석
  console.log('=== 페이지 구조 분석 ===');

  // 1. mainFrame 찾기
  var mf = null;
  for (const f of page.frames()) { if (f.name() === 'mainFrame') { mf = f; break; } }
  if (!mf) { console.log('no mainFrame'); await b.close(); return; }

  // 2. mainFrame 크기와 iframe 위치
  var frameRects = await page.evaluate(function() {
    var iframes = document.querySelectorAll('iframe');
    return Array.from(iframes).map(function(f) {
      var r = f.getBoundingClientRect();
      return { name: f.name, id: f.id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  console.log('\n페이지 내 iframe:');
  frameRects.forEach(function(f, i) { console.log('  [' + i + '] ' + f.name + ' — ' + f.x + ',' + f.y + ' ' + f.w + 'x' + f.h); });

  // 3. mainFrame 내부의 버튼 위치
  var btnInfo = await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    var result = [];
    btns.forEach(function(b) {
      var t = (b.innerText || '').trim();
      if (t) {
        var r = b.getBoundingClientRect();
        // mainFrame 내부 좌표 = 페이지 좌표와 동일 (mainFrame이 전체를 채움)
        result.push({ text: t.substring(0, 10), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 });
      }
    });
    return result;
  });

  console.log('\nmainFrame 버튼:');
  btnInfo.forEach(function(b) {
    if (b.y < 100) console.log('  ' + b.text + ' → (' + b.x + ',' + b.y + ') ' + b.w + 'x' + b.h);
  });

  // 4. 저장 버튼 위치 찾기
  var saveBtn = btnInfo.find(function(b) { return b.text === '저장' && b.visible; });
  if (saveBtn) {
    console.log('\n✅ 저장 버튼 위치: (' + (saveBtn.x + saveBtn.w/2) + ',' + (saveBtn.y + saveBtn.h/2) + ')');
    console.log('✅ 툴바 영역: y=' + saveBtn.y + ' ~ ' + (saveBtn.y + saveBtn.h));
  }

  // 5. mainFrame 내부에서 contenteditable 요소 스캔
  var ceInfo = await mf.evaluate(function() {
    var allCE = document.querySelectorAll('[contenteditable]');
    var result = [];
    allCE.forEach(function(el, i) {
      var r = el.getBoundingClientRect();
      result.push({
        idx: i,
        tag: el.tagName,
        id: el.id,
        text: (el.innerText || '').trim().substring(0, 15),
        rect: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height),
        visible: r.width > 5 && r.height > 5
      });
    });
    return result;
  });

  console.log('\nmainFrame contenteditable:');
  ceInfo.forEach(function(c) {
    console.log('  [' + c.idx + '] ' + c.tag + ' id=' + c.id + ' text="' + c.text + '" ' + c.rect + (c.visible ? '' : ' (HIDDEN)'));
  });

  // 6. mainFrame 하단의 일반 요소 탐색 (title 에디터는 일반 div일 가능성)
  var topEls = await mf.evaluate(function() {
    var all = document.querySelectorAll('div, span, input, textarea');
    var result = [];
    all.forEach(function(el, i) {
      if (i > 100) return;
      var r = el.getBoundingClientRect();
      if (r.width > 100 && r.y > 0 && r.y < 300 && el.offsetParent !== null) {
        result.push({
          idx: i,
          tag: el.tagName,
          id: el.id || '',
          cls: (el.className || '').substring(0, 25),
          text: (el.innerText || el.value || '').trim().substring(0, 15),
          rect: Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.w) + 'x' + Math.round(r.h)
        });
      }
    });
    return result;
  });

  console.log('\nmainFrame 상단 요소 (y:0~300):');
  topEls.slice(0, 15).forEach(function(e) {
    console.log('  [' + e.idx + '] <' + e.tag + '> cls=' + e.cls + ' text="' + e.text + '" ' + e.rect);
  });

  await b.close();
})();

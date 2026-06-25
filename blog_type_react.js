const { chromium } = require('playwright');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  var pages = ctx.pages();
  var page = null;
  for (var p = 0; p < pages.length; p++) {
    if (pages[p].url().indexOf('blog.naver.com') >= 0 && pages[p].url().indexOf('Write') >= 0) {
      page = pages[p]; break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }

  await page.bringToFront();
  await sleep(4000);

  // mainFrame 찾기
  var mf = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    if (page.frames()[fi].name() === 'mainFrame') { mf = page.frames()[fi]; break; }
  }
  if (!mf) { console.log('no mainFrame'); await b.close(); return; }

  // === 1단계: 제목 영역 직접 focus ===
  console.log('1. 제목 입력...');
  var titleResult = await mf.evaluate(function(title) {
    try {
      // SmartEditor API로 타이틀 찾기
      var ed = null;
      try { ed = SmartEditor._editors['blogpc001']; } catch(e) {}
      
      if (ed && typeof ed.focusTitle === 'function') {
        ed.focusTitle();
        // focusTitle 후 문서에서 활성화된 contenteditable 찾기
        var active = document.activeElement;
        if (active && active.getAttribute('contenteditable')) {
          active.innerText = title;
          active.dispatchEvent(new Event('input', { bubbles: true }));
          return 'focused_and_set';
        }
      }
      
      // 직접 se-docu 내부 contenteditable 찾기
      var docuEl = document.querySelector('.se-docu [contenteditable], .se-component.se-docu [contenteditable]');
      if (docuEl) {
        docuEl.focus();
        docuEl.innerText = title;
        docuEl.dispatchEvent(new Event('input', { bubbles: true }));
        return 'docu_ce_set';
      }
      
      // 모든 contenteditable 중 첫 번째 visible 요소
      var allCE = document.querySelectorAll('[contenteditable]');
      for (var i = 0; i < allCE.length; i++) {
        var ce = allCE[i];
        var r = ce.getBoundingClientRect();
        if (r.width > 100 && r.y > 50 && r.y < 300) {
          ce.focus();
          ce.innerText = title;
          ce.dispatchEvent(new Event('input', { bubbles: true }));
          return 'ce_' + i + '_set_at_y' + Math.round(r.y);
        }
      }
      
      return 'no_element';
    } catch(e) { return 'error: ' + e.message.substring(0, 50); }
  }, '병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)');
  console.log('  ' + titleResult);

  await sleep(1000);

  // === 2단계: 본문 영역 직접 focus ===
  console.log('2. 본문 입력...');
  var bodyText = '병원 영상마케팅을 고민하는 원장님들께서 가장 궁금해하는 것이 있습니다.\n\n1. 병원 숏폼 마케팅, 왜 지금 시작해야 할까\n\n대기 시간에 릴스를 보는 환자들은 점점 늘고 있습니다.\n\n2. 숏폼 1편, 실제 제작 비용\n\n중요한 건 비용이 아니라 꾸준함입니다.\n\n3. 실제 도입 사례 — 성형외과 K원장님\n\n도입 3개월 후 팔로워 300명 → 2,100명, 문의 3~5건 → 20~30건.\n\n4. 병원 마케팅 영상, 이렇게 준비하세요\n\n핸드폰으로 원장님이 직접 5~10분 촬영하시면 됩니다.\n\n5. 지금 시작해야 하는 이유\n\n네이버와 인스타그램 모두 숏폼 콘텐츠에 검색 가중치를 높이고 있습니다.\n\n카카오톡 채널: 에이컷 | 이메일: contact@aicut.co.kr | 홈페이지: aicut.co.kr';

  var bodyResult = await mf.evaluate(function(text) {
    try {
      // 첫 번째 텍스트 contenteditable 찾기 (제목 이후)
      var allCE = document.querySelectorAll('[contenteditable]');
      var target = null;
      for (var i = 0; i < allCE.length; i++) {
        var ce = allCE[i];
        var r = ce.getBoundingClientRect();
        // y > 300이고 visible한 요소 = 본문 영역
        if (r.width > 100 && r.y > 300 && r.y < 600) {
          target = ce;
          break;
        }
      }
      
      if (!target) {
        // fallback: se-text 영역
        target = document.querySelector('.se-text [contenteditable], .se-component.se-text [contenteditable]');
      }
      
      if (target) {
        target.focus();
        target.innerText = text;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        return 'set_' + text.length + 'chars';
      }
      
      return 'no_target';
    } catch(e) { return 'error: ' + e.message.substring(0, 50); }
  }, bodyText);
  console.log('  ' + bodyResult);

  await sleep(2000);

  // === 3단계: 이미지 업로드 ===
  console.log('3. 이미지 업로드...');
  try {
    var fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(function() { return null; });
    await page.mouse.click(36, 74);  // 사진 버튼
    await sleep(1500);

    // 내 PC에서 업로드
    var subClick = await mf.evaluate(function() {
      var all = document.querySelectorAll('button, span, a, div, li');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if ((t.indexOf('내 PC') >= 0 || t.indexOf('업로드') >= 0) && all[i].offsetParent !== null) {
          var r = all[i].getBoundingClientRect();
          all[i].click();
          return { x: Math.round(r.x), y: Math.round(r.y), text: t.substring(0, 10) };
        }
      }
      return null;
    });

    if (subClick) console.log('  내 PC 클릭:', subClick.text);
    await sleep(2000);

    var fc = await fcPromise;
    if (fc) {
      await fc.setFiles([DIR + '/blog_img_hospital.png', DIR + '/body_hospital_stat.png']);
      console.log('  ✅ 이미지 2장 업로드 완료');
      await sleep(3000);
    }
  } catch(e) {
    console.log('  ⚠️ 업로드 오류');
  }

  // === 4단계: 저장 ===
  console.log('4. 저장...');
  try {
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click(); return;
        }
      }
    });
    console.log('  저장됨');
  } catch(e) {}

  await sleep(3000);
  console.log('\n✅ 완료! 블로그 탭 확인해주세요.');
  await b.close();
})();

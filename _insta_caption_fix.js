// 인스타 캡션 수정
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  var ip = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { ip = pages[i]; break; }
  }
  if (!ip) { await b.close(); return; }

  await ip.bringToFront();
  await ip.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(4000);

  var postUrl = await ip.evaluate(function() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].href || '';
      if (h.indexOf('/p/') >= 0) return h;
    }
    return null;
  });

  if (!postUrl) { console.log('게시물 없음'); await b.close(); return; }

  console.log('게시물 이동:', postUrl.substring(0, 60));
  await ip.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(3000);

  // ⋮ 메뉴 버튼 클릭
  await ip.evaluate(function() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var html = all[i].innerHTML || '';
      if (html.indexOf('M12') >= 0 || html.indexOf('more') >= 0 || html.indexOf('More') >= 0) {
        var btn = all[i].closest('button') || all[i].closest('div');
        if (btn && btn.offsetParent !== null) { btn.click(); return; }
      }
    }
  });
  await sleep(2000);

  // 수정 선택
  await ip.evaluate(function() {
    var all = document.querySelectorAll('div, span, button, a');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '수정' || t === 'Edit') && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(3000);

  // 캡션 입력
  var caption = '온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유 📚\n\n강의 촬영하고 편집하는 데 하루 종일 걸리시나요?\n\n"영상 퀄리티가 맘에 안 드는데 고칠 시간도 없다"\n"콘텐츠는 계속 만들어야 하는데 체력이 바닥났다"\n\n교육 콘텐츠의 완성도는 이제 편집이 결정합니다 🎬\n\n에이컷이 해결합니다 ✨\n자막 · BGM · 인트로 · 챕터 구분\n릴스/쇼츠 숏폼까지 한 번에!\n\n촬영 원본만 보내주시면 끝 🙌\n👉 aicut.co.kr\n\n#온라인강의 #교육콘텐츠 #영상편집 #강의영상 #에이컷\n#강사마케팅 #인프런 #클래스101 #영상아웃소싱 #숏폼편집';

  var inputEl = await ip.$('textarea');
  if (inputEl) {
    await inputEl.click({ force: true });
    await sleep(500);
    await ip.keyboard.type(caption, { delay: 3 });
    await sleep(1000);
    console.log('캡션 입력 ✅');

    // 완료
    var done = await ip.evaluate(function() {
      var all = document.querySelectorAll('button, div');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if ((t === '완료' || t === 'Done') && !all[i].disabled && all[i].offsetParent !== null) {
          all[i].click(); return true;
        }
      }
      return false;
    });
    console.log('완료:', done ? '✅' : '⚠️');
    await sleep(3000);
    console.log('\n✅ 인스타 캡션 수정 완료');
  } else {
    console.log('textarea 못 찾음');
  }

  await b.close();
})();

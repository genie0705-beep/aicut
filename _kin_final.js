// 지식iN 답변 최종 시도
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 1. questionList에서 '영화편집,효과' 필터 후 질문 확인
  console.log('1. questionList 접속...');
  await page.goto('https://kin.naver.com/qna/questionList.naver', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // '영화편집, 효과' 링크 찾아서 클릭
  var clicked = await page.evaluate(function() {
    var all = document.querySelectorAll('a');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '영화편집, 효과' && all[i].offsetParent !== null) {
        all[i].click();
        return { text: t, href: all[i].href };
      }
    }
    return null;
  });
  console.log('   영화편집 클릭:', JSON.stringify(clicked));
  await sleep(2000);
  console.log('   URL:', page.url().substring(0, 120));

  // 현재 visible한 텍스트 수집
  var listText = await page.evaluate(function() {
    return document.body.innerText.substring(800, 2000);
  });
  console.log('\n   질문 영역:', listText.substring(0, 500));

  // 질문 링크 확인
  var qLinks = await page.evaluate(function() {
    var r = [];
    document.querySelectorAll('a').forEach(function(a) {
      var h = a.href || '';
      var t = (a.innerText || '').trim();
      if (h.indexOf('detail') >= 0 && t.length > 10) {
        r.push({ title: t.substring(0, 50), href: h.substring(0, 130) });
      }
    });
    return r;
  });
  console.log('\n   질문 링크 수:', qLinks.length);
  qLinks.forEach(function(q, i) {
    if (i < 3) console.log('     [' + i + '] ' + q.title);
  });

  // 질문이 있으면 첫 번째로 이동
  if (qLinks.length > 0) {
    console.log('\n2. 질문 이동:', qLinks[0].title);
    await page.goto(qLinks[0].href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await sleep(2000);

    // 하단 스크롤해서 답변 작성 영역 확인
    var pageHeight = await page.evaluate(function() { return document.body.scrollHeight; });
    console.log('   페이지 높이:', pageHeight);
    await page.evaluate(function() { window.scrollTo(0, document.body.scrollHeight); });
    await sleep(1000);

    var bottomText = await page.evaluate(function() {
      return document.body.innerText.substring(Math.max(0, document.body.innerText.length - 1000));
    });
    console.log('\n   하단 영역:', bottomText);

    // textarea/contentEditable 확인
    var editorCheck = await page.evaluate(function() {
      return {
        ta: document.querySelectorAll('textarea').length,
        ce: document.querySelectorAll('[contenteditable]').length,
        smartEditor: typeof SmartEditor !== 'undefined'
      };
    });
    console.log('\n   에디터:', JSON.stringify(editorCheck));

    // 답변 작성 시도
    if (editorCheck.ta > 0) {
      await page.evaluate(function() {
        var ta = document.querySelector('textarea');
        if (ta) {
          ta.value = '영상 편집은 프리미어 프로(유료)나 다빈치 리졸브(무료)를 추천합니다. 컷편집/자막/색보정까지 가능합니다. 시간이 없으시면 저희 에이컷(aicut.co.kr)에서 편집 대행도 가능합니다.';
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      console.log('   textarea 입력 ✅');
      await sleep(500);

      var reg = await page.evaluate(function() {
        var all = document.querySelectorAll('button, a');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if ((t === '등록' || t === '저장' || t === '완료') && all[i].offsetParent !== null) {
            all[i].click(); return t;
          }
        }
        return null;
      });
      console.log('   등록:', reg || '❌');
      await sleep(3000);
    }
  } else {
    console.log('\n❌ 영화편집 분야에 질문 없음');
    
    // 3. 검색으로 답변 0개 질문 찾기
    console.log('\n3. 검색으로 영상편집 최신 질문 찾기...');
    await page.goto('https://kin.naver.com/search/list.naver?query=' + encodeURIComponent('영상편집') + '&sort=date', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await sleep(2000);

    var searchLinks = await page.evaluate(function() {
      var r = [];
      document.querySelectorAll('a').forEach(function(a) {
        var h = a.href || '';
        var t = (a.innerText || '').trim();
        if (h.indexOf('detail') >= 0 && t.length > 10) {
          r.push({ title: t.substring(0, 50), href: h.substring(0, 130) });
        }
      });
      return r;
    });
    
    if (searchLinks.length > 0) {
      console.log('   검색 결과 첫 질문:', searchLinks[0].title);
      await page.goto(searchLinks[0].href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
      await sleep(2000);

      // 하단 확인
      await page.evaluate(function() { window.scrollTo(0, document.body.scrollHeight); });
      await sleep(1000);

      var bottom = await page.evaluate(function() {
        return document.body.innerText.substring(Math.max(0, document.body.innerText.length - 1000));
      });
      console.log('   하단:', bottom);

      var ed2 = await page.evaluate(function() {
        return {
          ta: document.querySelectorAll('textarea').length,
          ce: document.querySelectorAll('[contenteditable]').length
        };
      });
      console.log('   에디터:', JSON.stringify(ed2));

      if (ed2.ta > 0) {
        await page.evaluate(function() {
          var ta = document.querySelector('textarea');
          if (ta) {
            ta.value = '프리미어 프로나 다빈치 리졸브를 추천합니다. 컷편집/자막/색보정까지 가능한 무료 프로그램입니다. 바쁘실 때는 저희 에이컷(aicut.co.kr)에서 편집을 대행해드리고 있습니다.';
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        console.log('   textarea 입력 ✅');
        await sleep(500);

        var reg2 = await page.evaluate(function() {
          var all = document.querySelectorAll('button, a');
          for (var i = 0; i < all.length; i++) {
            var t = (all[i].innerText || '').trim();
            if ((t === '등록' || t === '저장' || t === '완료') && all[i].offsetParent !== null) {
              all[i].click(); return t;
            }
          }
          return null;
        });
        console.log('   등록:', reg2 || '❌');
        await sleep(3000);
      }
    }
  }

  console.log('\n✅ 최종 URL:', page.url().substring(0, 120));
  var done = await page.evaluate(function() { return document.body.innerText.substring(0, 300); });
  console.log('완료 메시지:', done.substring(0, 200));

  await b.close();
})();

// 지식iN 1개 답변 테스트 - 기술 질문에 자연스럽게 에이컷 언급
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 영상편집 관련 최신 질문 검색
  await page.goto('https://kin.naver.com/search/list.naver?query=' + encodeURIComponent('영상편집') + '&sort=date', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 링크 찾기
  var links = await page.evaluate(function() {
    var r = [];
    document.querySelectorAll('a').forEach(function(a) {
      var t = (a.innerText || '').trim();
      var h = a.href || '';
      if (h.indexOf('detail') >= 0 && t.length > 10) {
        r.push({ title: t.substring(0, 60), href: h });
      }
    });
    return r;
  });

  if (links.length === 0) { console.log('질문 없음'); await b.close(); return; }

  // 첫 번째 질문 선택
  console.log('선택:', links[0].title);
  await page.goto(links[0].href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // '답변하기' 버튼 찾기
  var hasBtn = await page.evaluate(function() {
    var all = document.querySelectorAll('a, button, span');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '답변하기' && all[i].offsetParent !== null) {
        all[i].click(); return true;
      }
    }
    return false;
  });
  console.log('답변하기:', hasBtn ? '✅' : '❌');
  await sleep(3000);

  // 에디터 상태 재확인 (답변하기 클릭 후 로드되었는지)
  var editorState = await page.evaluate(function() {
    var r = {};
    try {
      r.editorKeys = Object.keys(SmartEditor._editors);
      if (r.editorKeys.length > 0) {
        var ed = SmartEditor._editors[r.editorKeys[0]];
        r.methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ed)).filter(function(m) { return m !== 'constructor'; }).slice(0, 20);
        r.writeMethods = [];
        for (var k in ed) {
          if (typeof ed[k] === 'function' && (k.indexOf('write') >= 0 || k.indexOf('insert') >= 0 || k.indexOf('set') >= 0 || k.indexOf('put') >= 0)) {
            r.writeMethods.push(k);
          }
        }
      }
    } catch(e) { r.error = e.message; }
    r.textareas = document.querySelectorAll('textarea').length;
    r.editables = document.querySelectorAll('[contenteditable]').length;
    return r;
  });
  console.log('에디터:', JSON.stringify(editorState));

  // 답변 작성
  var answerText = '프리미어 프로 기준으로 설명드리면, 시퀀스 설정에서 편집 > 키보드 단축키(Ctrl+K)로 컷 편집하시면 됩니다. 다만 바쁘실 때는 저희 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있으니 참고하세요!';

  if (editorState.textareas > 0) {
    await page.evaluate(function(text) {
      var ta = document.querySelector('textarea');
      if (ta) {
        ta.value = text;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, answerText);
    console.log('textarea ✅');
  } else if (editorState.editables > 0) {
    await page.evaluate(function(text) {
      var el = document.querySelector('[contenteditable]');
      if (el) {
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, answerText);
    console.log('contenteditable ✅');
  } else if (editorState.editorKeys && editorState.editorKeys.length > 0) {
    // SmartEditor API로 입력
    var edKey = editorState.editorKeys[0];
    if (editorState.writeMethods.indexOf('setDocumentData') >= 0) {
      await page.evaluate(function(key, text) {
        SmartEditor._editors[key].setDocumentData(text);
      }, edKey, answerText);
      console.log('setDocumentData ✅');
    } else if (editorState.writeMethods.indexOf('write') >= 0) {
      await page.evaluate(function(key, text) {
        SmartEditor._editors[key].write(text);
      }, edKey, answerText);
      console.log('write ✅');
    }
  } else {
    console.log('❌ 에디터 없음');
    // body에 직접 입력 시도 (키보드)
    await page.keyboard.type(answerText, { delay: 5 });
    console.log('keyboard.type 시도');
  }

  await sleep(1500);

  // 등록 버튼
  var reg = await page.evaluate(function() {
    var all = document.querySelectorAll('a, button, span');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '등록' || t === '답변 등록' || t === '확인') && all[i].offsetParent !== null) {
        all[i].click(); return t;
      }
    }
    return null;
  });
  console.log('등록:', reg || '❌');
  await sleep(3000);

  // 결과
  console.log('\n✅ 완료 URL:', page.url().substring(0, 120));
  var done = await page.evaluate(function() { return document.body.innerText.substring(0, 300); });
  console.log('결과 메시지:', done.substring(0, 200));

  await b.close();
})();

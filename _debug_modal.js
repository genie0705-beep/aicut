// 사진 버튼 클릭 후 모달 분석
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  var pages = ctx.pages();
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { page = pages[i]; break; }
  }
  if (!page) { await b.close(); return; }

  // 사진 버튼 클릭
  await page.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t.indexOf('사진') >= 0) { btns[i].click(); return; }
    }
  });
  await new Promise(function(r) { setTimeout(r, 3000); });

  var after = await page.evaluate(function() {
    var r = {};

    // 모든 visible 요소
    var all = document.querySelectorAll('div, span, button, a, li, label');
    r.texts = [];
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t && all[i].offsetParent !== null && t.length < 40) {
        r.texts.push({ tag: all[i].tagName, text: t, cls: (all[i].className || '').substring(0, 50) });
      }
    }

    // input elements
    r.inputs = [];
    document.querySelectorAll('input').forEach(function(inp) {
      if (inp.offsetParent !== null || true) {
        r.inputs.push({
          type: inp.type, id: inp.id, name: inp.name,
          accept: inp.accept, placeholder: inp.placeholder,
          visible: inp.offsetParent !== null
        });
      }
    });

    // iframe
    r.iframes = [];
    document.querySelectorAll('iframe').forEach(function(f, idx) {
      r.iframes.push({ id: f.id, name: f.name, src: (f.src || '').substring(0, 100) });
    });

    // 업로드 영역 관련
    r.uploadRelated = [];
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t && all[i].offsetParent !== null) {
        if (t.indexOf('업로드') >= 0 || t.indexOf('PC') >= 0 || t.indexOf('내 컴') >= 0 || t.indexOf('내 PC') >= 0 || t.indexOf('파일') >= 0) {
          r.uploadRelated.push({ tag: all[i].tagName, text: t, cls: (all[i].className || '').substring(0, 60) });
        }
      }
    }

    return r;
  });

  console.log('=== visible 텍스트 요소들 ===');
  for (var j = 0; j < after.texts.length; j++) {
    console.log('  [' + j + '] ' + after.texts[j].tag + ' "' + after.texts[j].text + '"');
  }

  console.log('\n=== input 요소들 ===');
  for (var j = 0; j < after.inputs.length; j++) {
    console.log('  type=' + after.inputs[j].type + ' id=' + after.inputs[j].id + ' visible=' + after.inputs[j].visible);
  }

  console.log('\n=== iframe들 ===');
  for (var j = 0; j < after.iframes.length; j++) {
    console.log('  id=' + after.iframes[j].id + ' src=' + after.iframes[j].src);
  }

  console.log('\n=== 업로드 관련 ===');
  for (var j = 0; j < after.uploadRelated.length; j++) {
    console.log('  ' + after.uploadRelated[j].tag + ' "' + after.uploadRelated[j].text + '"');
  }

  await b.close();
})();

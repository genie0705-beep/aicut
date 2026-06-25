const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.goto('https://kin.naver.com/qna/detail.naver?d1id=3&dirId=3031003&docId=493568488', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(3000);

  // 답변하기 클릭
  var btnResult = await page.evaluate(function() {
    var btns = Array.from(document.querySelectorAll('button'));
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '답변하기' && btns[i].offsetParent !== null) {
        btns[i].click(); return 'clicked';
      }
    }
    return 'not found';
  });
  console.log('답변 버튼:', btnResult);
  await sleep(3000);

  // iframe과 에디터 분석
  var info = await page.evaluate(function() {
    var r = {};
    r.iframes = Array.from(document.querySelectorAll('iframe')).map(function(f) {
      return { id: f.id || '', name: f.name || '', visible: f.offsetParent !== null };
    });
    r.contenteditables = Array.from(document.querySelectorAll('[contenteditable]')).map(function(el) {
      return { id: el.id || '', tag: el.tagName, visible: el.offsetParent !== null, text: (el.innerText || '').substring(0, 30) };
    });
    r.textareas = Array.from(document.querySelectorAll('textarea')).map(function(el) {
      return { id: el.id || '', visible: el.offsetParent !== null };
    });
    r.smartEditors = Array.from(document.querySelectorAll('[class*=smart], [class*=se_], [class*=editor]')).slice(0, 5).map(function(el) {
      return { id: el.id || '', class: (el.className || '').substring(0, 40), tag: el.tagName, visible: el.offsetParent !== null };
    });
    return r;
  });
  console.log('iframes:', JSON.stringify(info.iframes));
  console.log('contenteditables:', JSON.stringify(info.contenteditables));
  console.log('textareas:', JSON.stringify(info.textareas));
  console.log('editor divs:', JSON.stringify(info.smartEditors));

  await b.close();
})();

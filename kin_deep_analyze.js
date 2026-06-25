const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 미답변 질문 많은 카테고리로 이동
  console.log('=== 지식iN 페이지 분석 ===\n');

  // 컴퓨터/IT > 영상편집 카테고리
  await page.goto('https://kin.naver.com/search/list.naver?query=' + encodeURIComponent('영상편집'), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(3000);

  // 첫 번째 질문의 detail 링크 찾기
  var qLinks = await page.evaluate(function() {
    var all = Array.from(document.querySelectorAll('a'));
    return all.filter(function(l) { return l.href && l.href.includes('/qna/detail'); }).slice(0, 3).map(function(l) {
      return { text: (l.innerText || '').trim().substring(0, 40), href: l.href };
    });
  });
  console.log('질문 목록:', JSON.stringify(qLinks, null, 2));

  if (qLinks.length === 0) {
    console.log('질문 없음 ❌');
    await b.close();
    return;
  }

  // 첫 질문으로 이동
  await page.goto(qLinks[0].href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(4000);

  // 전체 페이지 분석
  var analysis = await page.evaluate(function() {
    var r = {};
    
    // 모든 버튼 분석
    var btns = Array.from(document.querySelectorAll('button'));
    r.buttons = btns.filter(function(b) { return b.offsetParent !== null; }).map(function(b) {
      return { text: (b.innerText || '').trim().substring(0, 30), id: b.id, class: (b.className || '').substring(0, 30) };
    });

    // 모든 a 태그
    var links = Array.from(document.querySelectorAll('a'));
    r.links = links.filter(function(l) { return l.offsetParent !== null; }).slice(0, 20).map(function(l) {
      return { text: (l.innerText || '').trim().substring(0, 25), href: (l.href || '').substring(0, 80), class: (l.className || '').substring(0, 20) };
    });

    // 모든 div[class] (유의미한 것만)
    var divs = Array.from(document.querySelectorAll('div[class]'));
    r.divs = divs.filter(function(d) { return d.offsetParent !== null; }).slice(0, 30).map(function(d) {
      var c = d.className || '';
      return c.substring(0, 40);
    }).filter(function(c, i, arr) { return c && arr.indexOf(c) === i; });

    // 모든 span
    var spans = Array.from(document.querySelectorAll('span'));
    r.spans = spans.filter(function(s) { return s.offsetParent !== null; }).slice(0, 30).map(function(s) {
      return (s.innerText || '').trim().substring(0, 20);
    }).filter(function(t, i, arr) { return t && arr.indexOf(t) === i; });

    // 페이지 텍스트 (앞부분)
    r.bodyText = (document.body.innerText || '').substring(0, 1000);

    // 숨겨진 에디터 관련 요소
    r.hiddenEditors = [];
    var hiddenEls = document.querySelectorAll('[id*=\"editor\"], [id*=\"answer\"], [class*=\"editor\"], [class*=\"answer\"]');
    hiddenEls.forEach(function(el) {
      r.hiddenEditors.push({ id: el.id, class: (el.className || '').substring(0, 30), tag: el.tagName, visible: el.offsetParent !== null });
    });

    return r;
  });

  console.log('\n=== 보이는 버튼 ===');
  analysis.buttons.forEach(function(b) { console.log('  ' + b.text + ' | id=' + b.id + ' | class=' + b.class); });

  console.log('\n=== 주요 링크 ===');
  analysis.links.forEach(function(l) { console.log('  ' + l.text + ' -> ' + l.href.substring(0, 50)); });

  console.log('\n=== 주요 div 클래스 ===');
  analysis.divs.slice(0, 15).forEach(function(d) { console.log('  ' + d); });

  console.log('\n=== 주요 span 텍스트 ===');
  analysis.spans.slice(0, 15).forEach(function(s) { console.log('  ' + s); });

  console.log('\n=== 에디터/답변 관련 요소 ===');
  analysis.hiddenEditors.slice(0, 10).forEach(function(e) { console.log('  [' + e.tag + '] id=' + e.id + ' class=' + e.class + ' visible=' + e.visible); });

  console.log('\n=== 페이지 본문 (앞 500자) ===');
  console.log(analysis.bodyText.substring(0, 500));

  await b.close();
})();

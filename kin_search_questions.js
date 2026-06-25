const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var page = b.contexts()[0].pages()[0];
  
  // 지식iN 검색 (네이버 통합검색)
  await page.goto('https://search.naver.com/search.naver?query=' + encodeURIComponent('영상편집') + '&where=kin', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  var result = await page.evaluate(function() {
    var items = [];
    // 지식iN 질문 링크 찾기
    var links = document.querySelectorAll('a[href*="kin.naver.com/qna"]');
    for (var i = 0; i < Math.min(links.length, 5); i++) {
      var href = links[i].getAttribute('href') || '';
      var title = (links[i].innerText || '').trim();
      if (title && title.length > 5) {
        items.push({ title: title.substring(0, 60), href: href.substring(0, 80) });
      }
    }
    
    var text = (document.body.innerText || '').substring(0, 600);
    return { items: items, text: text };
  });
  
  console.log('=== 검색 결과 ===');
  console.log(result.text.substring(0, 400));
  console.log('');
  
  if (result.items.length > 0) {
    console.log('=== 답변 가능한 질문 ===');
    for (var i = 0; i < result.items.length; i++) {
      console.log((i+1) + '. ' + result.items[i].title);
    }
  } else {
    console.log('질문 링크를 찾지 못함 (다른 선택자 필요)');
    
    // 다른 방식: 모든 링크에서 지식iN 관련 링크 찾기
    var allLinks = await page.evaluate(function() {
      var all = document.querySelectorAll('a');
      var kinLinks = [];
      for (var i = 0; i < all.length; i++) {
        var h = all[i].getAttribute('href') || '';
        var t = (all[i].innerText || '').trim();
        if (h.indexOf('kin') >= 0 || h.indexOf('knowledge') >= 0 || t.indexOf('질문') >= 0 || t.indexOf('답변') >= 0) {
          if (t.length > 5) kinLinks.push({ t: t.substring(0, 50), h: h.substring(0, 60) });
        }
      }
      return kinLinks;
    });
    
    console.log('관련 링크:');
    for (var i = 0; i < Math.min(allLinks.length, 10); i++) {
      console.log((i+1) + '. ' + allLinks[i].t + ' | ' + allLinks[i].h);
    }
  }
  
  await b.close();
})();

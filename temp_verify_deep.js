const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 새 게시물 - 스크롤해서 더 로딩
  await page.goto('https://www.instagram.com/p/DZ6HbJ-mZJV/', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // 스크롤
  await page.evaluate(function() { window.scrollTo(0, 1000); });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(function() { window.scrollTo(0, 0); });
  await new Promise(r => setTimeout(r, 2000));
  
  // 모든 텍스트 요소 찾기
  var textElements = await page.evaluate(function() {
    var elements = document.querySelectorAll('[class*="caption"], [class*="text"], [class*="content"], [class*="desc"], article div, [role="presentation"] div');
    var texts = [];
    for (var i = 0; i < elements.length && i < 20; i++) {
      var t = (elements[i].innerText || '').trim();
      if (t.length > 10) texts.push(t.substring(0, 100));
    }
    return texts;
  });
  
  console.log('텍스트 요소들:');
  textElements.forEach(function(t, i) { console.log(i + ':', t); });
  
  // 전체 body 길이
  var bodyLen = await page.evaluate(function() { return document.body.innerText.length; });
  console.log('\nbody 길이:', bodyLen);
  
  // 이전 게시물과 비교
  await page.goto('https://www.instagram.com/p/DZ4n7l_GTcD/', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  var oldLen = await page.evaluate(function() { return document.body.innerText.length; });
  var oldText = await page.evaluate(function() { return (document.body.innerText || '').substring(0, 200); });
  console.log('\n이전 게시물 body 길이:', oldLen);
  console.log('이전 게시물 텍스트:', oldText);
  
  await b.close();
})();

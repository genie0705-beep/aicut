const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 새 게시물 확인
  await page.goto('https://www.instagram.com/p/DZ6HbJ-mZJV/', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  var result = await page.evaluate(function() {
    var text = document.body.innerText || '';
    var idx = text.indexOf('하반기 마케팅');
    return {
      captionFound: idx >= 0,
      preview: idx >= 0 ? text.substring(idx, idx + 100) : 'N/A',
      totalLen: text.length
    };
  });
  
  console.log('새 게시물 확인:', JSON.stringify(result, null, 2));
  
  if (result.captionFound) {
    console.log('\n✅ 캡션 정상 등록 확인!');
  } else {
    console.log('\n⚠️ 캡션 미확인 (캐시 문제일 수 있음)');
  }
  
  await b.close();
})();

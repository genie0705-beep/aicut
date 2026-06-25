const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  var pages = ctx.pages();
  
  // 새 탭으로 블로그 목록
  var page = await ctx.newPage();
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=&parentCategoryNo=&from=postMenu', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(4000);
  
  // iframe 확인
  var frames = page.frames();
  for (var f of frames) {
    try {
      var url = f.url();
      if (url.includes('PostList')) {
        // 게시글 링크 찾기
        var links = await f.evaluate(function() {
          var as = document.querySelectorAll('a[href*="/aicut/"]');
          return Array.from(as).slice(0, 3).map(function(a) { return a.href; });
        });
        console.log('게시물:', JSON.stringify(links));
        
        // 첫 번째 게시물 (최신) 수정 페이지로
        if (links.length > 0) {
          await page.goto(links[0], { waitUntil: 'domcontentloaded', timeout: 15000 });
          await sleep(2000);
          
          // 수정 버튼
          var editResult = await page.evaluate(function() {
            var btns = document.querySelectorAll('a, button');
            for (var el of btns) {
              var t = el.textContent.trim();
              if (t === '수정') { el.click(); return 'clicked'; }
              var href = el.href || '';
              if (href.includes('PostEdit') || href.includes('Edit')) { el.click(); return 'edit link'; }
            }
            return 'not found';
          });
          console.log('수정:', editResult);
          await sleep(3000);
          
          // SmartEditor 확인
          var se = await page.evaluate(function() {
            return typeof SmartEditor !== 'undefined';
          }).catch(function() { return false; });
          console.log('SmartEditor:', se);
          
          // 현재 URL
          console.log('URL:', page.url().substring(0, 100));
        }
        break;
      }
    } catch(e) {}
  }
  
  await b.close();
})().catch(e => console.error('❌', e.message));

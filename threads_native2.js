const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const pages = b.contexts()[0].pages();
  
  var page = null;
  for (var p of pages) {
    if (p.url().includes('threads')) { page = p; break; }
  }
  if (!page) { await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  // 1. "새로운 스레드" 좌표 클릭
  var btn1 = await page.evaluate(function() {
    var divs = document.querySelectorAll('div');
    for (var d of divs) {
      if (d.textContent.trim() === '새로운 스레드' && d.offsetParent !== null) {
        var r = d.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height };
      }
    }
    return null;
  });
  if (!btn1) { await b.close(); return; }
  await page.mouse.click(btn1.x, btn1.y);
  await sleep(3000);

  // 2. 텍스트 입력
  await page.keyboard.type('Threads 테스트 🎬\n\n👉 aicut.co.kr', {delay:8});
  await sleep(2000);

  // 3. "게시" DIV의 좌표 찾아서 네이티브 클릭
  var btn2 = await page.evaluate(function() {
    var all = document.querySelectorAll('div');
    for (var d of all) {
      var t = d.textContent.trim();
      if (t === '게시' && d.offsetParent !== null) {
        // 부모 확인 - 게시 버튼은 보통 disabled 여부가 있음
        var r = d.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height };
      }
    }
    return null;
  });
  
  if (!btn2) {
    console.log('게시 버튼 위치 못 찾음');
    await b.close();
    return;
  }
  
  console.log('게시 버튼:', btn2.x, btn2.y, btn2.w + 'x' + btn2.h);
  await page.mouse.click(btn2.x, btn2.y);
  await sleep(5000);

  // 4. 확인
  var visibleText = await page.evaluate(function() {
    var body = document.body.innerText;
    // 피드 영역 확인
    var feed = document.querySelector('[role="feed"]');
    if (feed) return feed.innerText.substring(0, 500);
    return body.substring(0, 500);
  });
  console.log('게시 후 피드:', visibleText.replace(/\n/g,' ').substring(0, 200));
  console.log('뷰티 포함:', visibleText.includes('Threads'));

  await b.close();
})();

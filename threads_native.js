const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const pages = b.contexts()[0].pages();
  
  var page = null;
  for (var p of pages) {
    if (p.url().includes('threads')) { page = p; break; }
  }
  if (!page) { console.log('no threads'); await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  // 네이티브 click으로 "새로운 스레드" 클릭
  var clicked = await page.evaluate(function() {
    var all = document.querySelectorAll('div, a, span');
    for (var el of all) {
      if (el.textContent.trim() === '새로운 스레드') {
        var rect = el.getBoundingClientRect();
        return { x: rect.x + rect.width/2, y: rect.y + rect.height/2, found: true };
      }
    }
    return { found: false };
  });
  
  if (clicked.found) {
    console.log('클릭 위치:', clicked.x, clicked.y);
    await page.mouse.click(clicked.x, clicked.y);
    await sleep(3000);
    
    // 페이지 변화 확인
    var url = page.url();
    console.log('URL:', url.substring(0, 80));
    
    // 모달/팝업 확인
    var modals = await page.evaluate(function() {
      var all = document.querySelectorAll('[role="dialog"], [role="presentation"], [class*="modal"], [class*="overlay"]');
      return Array.from(all).filter(function(el) {
        return el.offsetParent !== null;
      }).map(function(el) {
        return { role: el.getAttribute('role'), text: el.textContent.trim().substring(0, 100) };
      });
    });
    console.log('모달:', JSON.stringify(modals));
    
    // editable 영역
    var editable = await page.$('[contenteditable="true"], [role="textbox"]');
    if (editable) {
      console.log('✅ editable 영역 있음');
      await editable.click();
      await sleep(300);
      await page.keyboard.type('뷰티·화장품 브랜드라면 숏폼 영상 마케팅을 시작해야 하는 이유 💄\n\n👉 aicut.co.kr', {delay:10});
      await sleep(2000);
      
      // 게시 버튼
      var posted = await page.evaluate(function() {
        var btns = document.querySelectorAll('button');
        for (var b of btns) {
          var t = b.textContent.trim();
          if ((t === '게시' || t === 'Post' || t === '게시하기') && !b.disabled && b.offsetParent !== null) {
            b.click();
            return t;
          }
        }
        return null;
      });
      console.log('게시 버튼:', posted || '못 찾음');
      await sleep(3000);
      
      // 확인
      var bodyText = await page.evaluate(function() { return document.body.innerText; });
      console.log('뷰티 확인:', bodyText.includes('뷰티'));
    } else {
      console.log('❌ editable 없음');
      // 페이지 텍스트 확인
      var text = await page.evaluate(function() { return document.body.innerText.substring(0, 500); });
      console.log('페이지:', text.replace(/\n/g,' ').substring(0, 200));
    }
  }

  await b.close();
})();

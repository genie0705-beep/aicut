const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const pages = b.contexts()[0].pages();
  let page = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') || p.url().includes('blog.naver')) { page = p; break; }
  }
  if (!page) { console.log('페이지 없음'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);
  
  const info = await page.evaluate(function() {
    var body = document.body;
    if (!body) return { error: 'no body' };
    var text = (body.innerText || '').substring(0, 800);
    
    var mainElements = [];
    var divs = body.querySelectorAll('div, section, main');
    for (var i = 0; i < Math.min(divs.length, 15); i++) {
      var el = divs[i];
      mainElements.push({
        tag: el.tagName,
        id: el.id || '-',
        cls: (el.className || '').substring(0, 50),
        visible: el.offsetParent !== null,
        text: (el.innerText || '').substring(0, 50)
      });
    }
    
    return { text: text, elements: mainElements };
  });
  
  console.log('=== 페이지 텍스트 (처음 800자) ===');
  console.log(info.text);
  console.log('\n=== 주요 DOM 요소 ===');
  for (var i = 0; i < info.elements.length; i++) {
    var e = info.elements[i];
    console.log(i + ': <' + e.tag + '#' + e.id + '> cls=' + e.cls + ' visible=' + e.visible + ' [' + e.text + ']');
  }
  
  await b.close();
})();

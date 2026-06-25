const { chromium } = require('playwright');

const POST_TITLE = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('Redirect=Write') || pg.url().includes('PostWriteForm')) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  // Find PostWriteForm frame
  let editorFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes('PostWriteForm') && !f.url().includes('wtm')) {
      editorFrame = f;
      break;
    }
  }
  if (!editorFrame) { console.log('no editor'); await b.close(); return; }

  // 검사: 모든 input과 button 찾기
  console.log('=== 에디터 프레임 버튼/입력 ===');
  const info = await editorFrame.evaluate(function() {
    var inputs = [];
    document.querySelectorAll('input').forEach(function(el) {
      inputs.push({ ph: el.placeholder, id: el.id, cls: (el.className || '').substring(0, 20), visible: el.offsetParent !== null });
    });
    
    var btns = [];
    document.querySelectorAll('button').forEach(function(el) {
      var t = (el.innerText || '').trim();
      if (t) btns.push({ text: t.substring(0, 20), visible: el.offsetParent !== null });
    });
    
    // Title area
    var titleEl = document.querySelector('[aria-label*="제목"], [placeholder*="제목"], .se-title-input, input[name*="title"]');
    
    return {
      inputs: inputs,
      buttons: btns.slice(0, 30),
      titleEl: titleEl ? { tag: titleEl.tagName, ph: titleEl.placeholder, id: titleEl.id } : null
    };
  });
  
  console.log(JSON.stringify(info, null, 2));

  // Try to set title via SmartEditor API
  console.log('\n=== SmartEditor API 직접 호출 ===');
  const apiResult = await editorFrame.evaluate(function(title) {
    // Naver SmartEditor API
    if (typeof SmartEditor !== 'undefined') {
      var editors = SmartEditor._editors;
      if (editors) {
        return 'SmartEditor found, keys: ' + Object.keys(editors).join(',');
      }
    }
    return 'SmartEditor not found';
  }, POST_TITLE);
  console.log(apiResult);

  // Check for saved content (body is there already)
  const ceContent = await editorFrame.evaluate(function() {
    var ce = document.querySelector('[contenteditable]');
    if (!ce) return 'no ce';
    return 'CE content length: ' + ce.innerHTML.length + ', text: ' + (ce.innerText || '').substring(0, 50);
  });
  console.log('\n본문 상태:', ceContent);

  await b.close();
})();

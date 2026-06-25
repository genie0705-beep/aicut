const { chromium } = require('playwright');
const TITLE = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('aicut') && (pg.url().includes('Write') || pg.url().includes('write'))) {
      page = pg; break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  // Deep scan ALL frames for ANY input element
  for (let fi = 0; fi < page.frames().length; fi++) {
    const f = page.frames()[fi];
    try {
      var info = await f.evaluate(function() {
        var results = [];
        // Every input element
        var inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(function(el, i) {
          var r = el.getBoundingClientRect();
          results.push({
            idx: i,
            tag: el.tagName,
            type: el.type || '',
            ph: (el.placeholder || '').substring(0, 15),
            id: (el.id || '').substring(0, 10),
            cls: (el.className || '').substring(0, 15),
            value: (el.value || '').substring(0, 15),
            visible: el.offsetParent !== null,
            rect: r.width > 0 ? Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) : 'hidden'
          });
        });
        return results;
      }).catch(function() { return []; });
      
      if (info && info.length > 0) {
        console.log('\nFrame ' + fi + ' inputs:');
        info.forEach(function(el) {
          if (el.tag || el.ph) {
            console.log('  [' + el.idx + '] ' + (el.tag || '') + ' ' + (el.type || '') + ' ph="' + (el.ph || '') + '" visible=' + (el.visible ? 'Y' : 'N') + ' val="' + el.value + '" ' + el.rect);
          }
        });
      }
    } catch(e) {}
  }

  // Find editor frame (PostWriteForm)
  var editorFrame = null;
  for (const f of page.frames()) {
    try {
      var url = f.url() || '';
      if (url.indexOf('PostWriteForm') >= 0 && url.indexOf('wtm') < 0) { editorFrame = f; break; }
    } catch(e) {}
  }

  if (editorFrame) {
    // Try using SmartEditor API to set title via document data
    console.log('\n=== SmartEditor API로 제목 설정 시도 ===');
    var apiResult = await editorFrame.evaluate(function(title) {
      try {
        var se = SmartEditor._editors['blogpc001'];
        if (!se) return 'no_editor';
        
        // Try direct method call exploration
        var methods = [];
        for (var key in se) {
          if (typeof se[key] === 'function' && key.indexOf('set') >= 0) methods.push(key);
          if (typeof se[key] === 'function' && key.indexOf('title') >= 0) methods.push(key);
          if (typeof se[key] === 'function' && key.indexOf('Title') >= 0) methods.push(key);
        }
        
        if (methods.length > 0) return 'Available setter methods: ' + methods.join(', ');
        
        // Try button click approach - find 저장 and check state
        var stateKeys = [];
        for (var key in se) {
          if (key.indexOf('state') >= 0 || key.indexOf('State') >= 0) stateKeys.push(key);
        }
        
        return 'No setter methods found. State keys: ' + stateKeys.slice(0, 5).join(', ');
        
      } catch(e) {
        return 'error: ' + e.message.substring(0, 60);
      }
    }, TITLE);
    console.log('  ' + apiResult);
    
    // Try finding title in the mainFrame (Frame 0) content
    var mainFrame = null;
    for (const f of page.frames()) {
      if (f.name() === 'mainFrame') { mainFrame = f; break; }
    }
    
    if (mainFrame) {
      // Try to find and click on title area, then type
      var clickTitle = await mainFrame.evaluate(function(title) {
        try {
          // The title in Naver blog is often inside the PostWriteForm iframe,
          // but React might render it in the main frame
          // Try: click on first contenteditable area
          var allCE = document.querySelectorAll('[contenteditable]');
          for (var i = 0; i < allCE.length; i++) {
            var ce = allCE[i];
            var r = ce.getBoundingClientRect();
            if (r.y >= 0 && r.y < 120 && r.width > 100) {
              ce.focus();
              ce.innerText = title;
              ce.dispatchEvent(new Event('input', { bubbles: true }));
              return 'CE title set: ' + Math.round(r.y);
            }
          }
          
          // Try: find parent element of the toolbar, look above it
          var btns = document.querySelectorAll('button');
          for (var j = 0; j < btns.length; j++) {
            var t = (btns[j].innerText || '').trim();
            if (t === '사진' || t.indexOf('사진') >= 0) {
              // Click above the photo button (title area)
              var r2 = btns[j].getBoundingClientRect();
              var clickX = r2.x + 50;
              var clickY = r2.y - 80; // Above toolbar = likely title area
              // We can't click here from evaluate, need to return coordinates
              return { find: '사진버튼', x: Math.round(clickX), y: Math.round(clickY) };
            }
          }
          
          return 'no_method';
        } catch(e) {
          return 'error: ' + e.message.substring(0, 50);
        }
      }, TITLE);
      
      console.log('  제목찾기:', JSON.stringify(clickTitle));
      
      // If we got coordinates, click there and type
      if (clickTitle && clickTitle.x && clickTitle.y) {
        await page.mouse.click(clickTitle.x, clickTitle.y);
        await sleep(500);
        await page.keyboard.type(TITLE, { delay: 30 });
        console.log('  ✅ 키보드로 제목 입력 완료!');
      }
    }
  }

  await sleep(1000);
  
  // Save
  var mainFrame = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mainFrame = f; break; }
  }
  if (mainFrame) {
    await mainFrame.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click();
          return;
        }
      }
    });
    console.log('💾 저장 완료!');
  }

  await sleep(2000);
  console.log('\n✅ 블로그 작성 완료! 브라우저 탭 확인해주세요.');
  await b.close();
})();

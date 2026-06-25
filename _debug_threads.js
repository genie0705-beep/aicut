// Threads DOM 분석
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();
  var tp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com') >= 0) { tp = pages[i]; break; }
  }
  if (!tp) { await b.close(); return; }
  
  await tp.bringToFront();
  await new Promise(function(r) { setTimeout(r, 3000); });
  
  var info = await tp.evaluate(function() {
    var r = {};
    r.editable = document.querySelectorAll('[contenteditable]').length;
    r.textarea = document.querySelectorAll('textarea').length;
    r.textbox = document.querySelectorAll('[role="textbox"]').length;
    r.input = document.querySelectorAll('input').length;
    
    r.editableElements = [];
    document.querySelectorAll('*').forEach(function(el) {
      if (el.offsetParent !== null) {
        var tag = el.tagName;
        var isEditable = (tag === 'TEXTAREA' || tag === 'INPUT' || el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox');
        if (isEditable) {
          r.editableElements.push({
            tag: tag,
            type: el.type,
            role: el.getAttribute('role'),
            placeholder: (el.getAttribute('placeholder') || '').substring(0, 30),
            cls: (el.className || '').substring(0, 50)
          });
        }
      }
    });
    
    // 전체 body 텍스트 (처음 1500자)
    r.bodyText = (document.body.innerText || '').substring(0, 1500);
    
    return r;
  });
  
  console.log('Threads 상태:');
  console.log('  editable:', info.editable);
  console.log('  textarea:', info.textarea);
  console.log('  textbox:', info.textbox);
  console.log('  input:', info.input);
  console.log('  editableElements:', JSON.stringify(info.editableElements));
  console.log('\n--- body 텍스트 ---');
  console.log(info.bodyText);
  
  await b.close();
})();

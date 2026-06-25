const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('493566474')) { p = pg; break; }
  }
  if (!p) { console.log('page not found'); await b.close(); return; }

  await p.bringToFront();
  await p.waitForTimeout(1000);

  // Check content in editor
  const editorContent = await p.evaluate(() => {
    const ed = document.querySelector('div[contenteditable="true"]');
    return ed ? ed.innerText.substring(0, 100) : 'no editor';
  });
  console.log('에디터 내용:', editorContent);

  // Use SE API to save content if available
  const apiResult = await p.evaluate(() => {
    // Try SmartEditor API methods
    if (typeof SmartEditor !== 'undefined') {
      return 'SmartEditor exists, type: ' + typeof SmartEditor;
    }
    if (typeof SE !== 'undefined') {
      // Check SE methods
      const methods = Object.getOwnPropertyNames(SE);
      return 'SE exists, methods: ' + methods.slice(0, 10).join(', ');
    }
    return 'no SmartEditor API found';
    // Try finding SE instances on DOM
  });
  console.log('SE API:', apiResult);

  // Try different approaches to submit
  // 1. 직접 버튼 찾아서 클릭
  const clicked = await p.evaluate(() => {
    // Find all buttons that might be the register button
    const buttons = document.querySelectorAll('button');
    let found = null;
    
    for (const btn of buttons) {
      const text = btn.innerText.trim();
      const cls = btn.className;
      
      // 등록 button
      if (text === '등록' || text.startsWith('등록')) {
        found = { text, cls, action: 'clicking' };
        btn.click();
        break;
      }
    }
    
    if (!found) {
      // Try any _answerRegisterButton
      const rb = document.querySelector('button._answerRegisterButton');
      if (rb) {
        found = { text: rb.innerText, cls: rb.className, action: 'found by class' };
        rb.click();
      }
    }
    
    return found;
  });
  
  console.log('등록 시도:', JSON.stringify(clicked));
  await p.waitForTimeout(3000);

  // Check if a dialog/popup appeared after clicking 등록
  const popupAfter = await p.evaluate(() => {
    // Check for alert/confirm/prompt
    const dialog = document.querySelector('div[role="dialog"], div.popup, div.modal, .alert, .confirm');
    if (dialog && dialog.style.display !== 'none') {
      return 'dialog visible: ' + dialog.innerText.substring(0, 100);
    }
    
    // Check page URL change
    const currentUrl = window.location.href;
    
    // Check if editor is gone
    const ed = document.querySelector('div[contenteditable="true"]');
    return {
      url: currentUrl.substring(0, 80),
      editorGone: !ed,
      answerCount: (document.body.innerText.match(/번째 답변/g) || []).length
    };
  });
  
  console.log('등록 후 상태:', JSON.stringify(popupAfter, null, 2));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  const info = await page.evaluate(() => {
    const r = [];

    // contenteditable elements
    document.querySelectorAll('[contenteditable]').forEach(el => {
      r.push({
        type: 'contenteditable',
        tag: el.tagName,
        val: el.getAttribute('contenteditable'),
        text: (el.innerText || '').substring(0, 50),
        visible: el.offsetParent !== null,
        placeholder: el.getAttribute('aria-placeholder') || ''
      });
    });

    // role=textbox
    document.querySelectorAll('[role="textbox"]').forEach(el => {
      r.push({
        type: 'textbox',
        tag: el.tagName,
        text: (el.innerText || '').substring(0, 50),
        visible: el.offsetParent !== null
      });
    });

    // "게시" button
    const btns = Array.from(document.querySelectorAll('button'));
    const postBtn = btns.find(b => b.innerText?.trim() === '게시');
    if (postBtn) {
      r.push({ type: 'post-btn', parentHTML: (postBtn.parentElement?.innerHTML || '').substring(0, 500) });
    }

    // Also try clicking the text input area directly
    const inputArea = document.querySelector('[aria-label*="텍스트"]');
    if (inputArea) {
      r.push({ 
        type: 'aria-text', 
        tag: inputArea.tagName,
        html: (inputArea.innerHTML || '').substring(0, 200)
      });
    }

    return r;
  });

  console.log(JSON.stringify(info, null, 2));
  await b.close();
})().catch(e => console.log('ERR:', e.message));

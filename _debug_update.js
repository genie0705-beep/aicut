const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = null;
  for (const p of pages) {
    if (p.url().includes('blog.naver.com')) { target = p; break; }
  }
  if (!target) { target = await b.contexts()[0].newPage(); }
  
  target.on('dialog', async d => { await d.dismiss(); });
  await target.bringToFront();
  
  await target.goto('https://blog.naver.com/PostUpdate.nhn?blogId=aicut&logNo=224326361515', { timeout: 30000 }).catch(() => {});
  await sleep(8000);
  
  const info = await target.evaluate(() => {
    // Check what kind of page we're on
    const smartEditorKeys = Object.keys(window).filter(k => k.toLowerCase().includes('smart') || k.toLowerCase().includes('editor'));
    const hasContenteditable = document.querySelectorAll('[contenteditable]').length;
    const url = location.href;
    const title = document.title;
    const body = document.body.innerText.substring(0, 500);
    const iframes = document.querySelectorAll('iframe').length;
    
    // Check for SmartEditor
    let seInfo = 'not found';
    try {
      if (window.SmartEditor) {
        seInfo = 'SmartEditor global found';
        if (SmartEditor._editors) {
          seInfo += ', editors: ' + Object.keys(SmartEditor._editors).join(',');
        }
      }
    } catch(e) { seInfo = 'error: ' + e.message; }
    
    return { url: url.substring(0, 150), title, smartEditorKeys: smartEditorKeys.slice(0, 10), hasContenteditable, iframes, seInfo, bodyPreview: body.replace(/\s+/g, ' ').trim().substring(0, 300) };
  });
  
  console.log(JSON.stringify(info, null, 2));
  
  await target.screenshot({ path: 'blog_update_page.png' });
  console.log('Screenshot saved');
  
  b.close();
})().catch(e => console.log('ERR: ' + e.message));

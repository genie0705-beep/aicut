const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  const blog = pages.find(p => p.url().includes('blog.naver.com/aicut'));
  if (!blog) { console.log('NO_BLOG_TAB'); browser.close(); return; }
  await blog.bringToFront();
  await new Promise(r => setTimeout(r, 2000));
  
  let editorFrame = null;
  for (const f of blog.frames()) {
    if (f.url().includes('PostWriteForm')) { editorFrame = f; break; }
  }
  if (!editorFrame) { console.log('NO_EDITOR_FRAME'); browser.close(); return; }
  
  // Check title and content
  const info = await editorFrame.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const paras = document.querySelectorAll('.se-text-paragraph');
    return {
      title: se.getTitle ? se.getTitle() : document.querySelector('.se_title_editor')?.innerText || 'unknown',
      contentLen: se.getContentText().length,
      paras: paras.length,
      centerAlign: document.querySelectorAll('.se-text-paragraph[style*="center"]').length,
      // Check for 저장 button
      saveBtn: document.querySelector('button:not([class*="hidden"]):not([style*="display:none"])')?.innerText || '',
      allBtns: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
    };
  });
  
  console.log('Editor state:', JSON.stringify(info, null, 2));
  
  // Find and click 저장 button
  const saveClicked = await editorFrame.evaluate(() => {
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    for (const btn of buttons) {
      if (btn.innerText.trim() === '저장' && btn.offsetParent !== null) {
        btn.click();
        return 'clicked: ' + btn.className;
      }
    }
    return 'not found';
  });
  console.log('Save button click:', saveClicked);
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Check result
  const result = await editorFrame.evaluate(() => {
    return {
      url: window.location.href,
      text: document.body?.innerText?.substring(0, 500) || ''
    };
  });
  console.log('After save:', JSON.stringify(result, null, 2));
  
  browser.disconnect();
})().catch(e => console.log('ERR: ' + e.message));

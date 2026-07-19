const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  }
  
  // Try different methods to focus and paste
  const api = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ed));
    const ownMethods = Object.keys(ed);
    return {
      protoMethods: methods.filter(m => m !== 'constructor'),
      ownKeys: ownMethods.filter(k => typeof ed[k] === 'function').slice(0, 20),
      editorType: ed.constructor?.name,
    };
  });
  console.log('Editor API:', JSON.stringify(api, null, 2));
  
  // Try clicking on the editable area
  const editableAreas = await page.evaluate(() => {
    const areas = document.querySelectorAll('[contenteditable], [role="textbox"], .se-editor, .editor_area, iframe');
    return Array.from(areas).map(a => ({
      tag: a.tagName,
      id: a.id,
      cls: a.className.slice(0, 60),
      contenteditable: a.getAttribute('contenteditable'),
      role: a.getAttribute('role'),
    }));
  });
  console.log('\nEditable areas:', JSON.stringify(editableAreas, null, 2));
  
  // Check for iframe
  const iframes = await page.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    return Array.from(frames).map(f => ({
      id: f.id,
      cls: f.className.slice(0, 60),
      src: f.getAttribute('src')?.slice(0, 100),
    }));
  });
  console.log('\nIframes:', JSON.stringify(iframes, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: 'blog_se4_check.png', fullPage: false });
  console.log('Screenshot saved');
})();

const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  // Find existing editor tab
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  }
  
  console.log('=== 에디터 상태 분석 ===');
  console.log('URL:', page.url());
  
  // 1. Check editor content
  const editorState = await page.evaluate(() => {
    // Check if SmartEditor exists
    const seExists = typeof SmartEditor !== 'undefined';
    const editorKeys = seExists ? Object.keys(SmartEditor._editors || {}) : [];
    
    // Try to get current content
    let content = '';
    let contentLength = 0;
    try {
      if (SmartEditor._editors['blogpc001']) {
        const doc = SmartEditor._editors['blogpc001'];
        if (doc.getDocumentData) content = doc.getDocumentData();
        else if (doc.getContent) content = doc.getContent();
        contentLength = content ? content.length : 0;
      }
    } catch(e) { content = 'Error: ' + e.message; }
    
    // Check editor frame
    const mainFrame = document.querySelector('#mainFrame');
    let frameContent = '';
    let frameHtml = '';
    try {
      if (mainFrame && mainFrame.contentDocument) {
        frameContent = (mainFrame.contentDocument.body.innerText || '').substring(0, 200);
        frameHtml = (mainFrame.contentDocument.body.innerHTML || '').substring(0, 300);
      }
    } catch(e) {}
    
    // Check title
    let title = '';
    try {
      if (SmartEditor._editors['blogpc001']) {
        title = SmartEditor._editors['blogpc001'].getDocumentTitle();
      }
    } catch(e) {}
    
    return {
      smartEditorExists: seExists,
      editorKeys,
      contentLength,
      contentPreview: (content || '').substring(0, 150),
      title,
      frameContentPreview: frameContent,
      frameHtmlPreview: frameHtml
    };
  });
  
  console.log('SmartEditor:', editorState.smartEditorExists ? '✅' : '❌');
  console.log('Editor keys:', editorState.editorKeys);
  console.log('Title:', editorState.title);
  console.log('Content length:', editorState.contentLength);
  console.log('Content preview:', editorState.contentPreview);
  console.log('Frame content:', editorState.frameContentPreview);
  console.log('Frame HTML:', editorState.frameHtmlPreview);
  
  // Take screenshot
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_shop_error.png') });
  console.log('\nScreenshot saved');
  
  await browser.close();
})();

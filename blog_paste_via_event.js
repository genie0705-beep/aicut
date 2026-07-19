const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  }
  console.log('URL:', page.url());
  
  // === TITLE ===
  const title = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
  await page.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), title);
  console.log('✅ Title set');
  
  // === BODY HTML ===
  const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
  
  // Focus first text
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
  });
  await page.waitForTimeout(300);
  
  // Dispatch paste event with HTML data directly
  const pasteResult = await page.evaluate((html) => {
    try {
      // Find the editor's editable element
      // SE4 uses a contenteditable div
      const editable = document.querySelector('div[contenteditable="true"]') ||
                       document.querySelector('[contenteditable="true"]');
      
      if (!editable) return 'no editable found';
      
      // Create DataTransfer with HTML content
      const dt = new DataTransfer();
      dt.setData('text/html', html);
      dt.setData('text/plain', html.replace(/<[^>]+>/g, ''));
      
      // Create and dispatch paste event
      const event = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      
      editable.dispatchEvent(event);
      return 'paste dispatched on editable: ' + editable.tagName;
    } catch(e) {
      return 'error: ' + e.message + ' | ' + e.stack?.slice(0, 100);
    }
  }, bodyHtml);
  console.log('Paste result:', pasteResult);
  await page.waitForTimeout(1000);
  
  // Try again on the editor's internal iframe
  const pasteResult2 = await page.evaluate((html) => {
    try {
      // Try to access the iframe's content document
      const iframe = document.querySelector('#smart_editor_blogpc001 iframe, iframe[src*="smart_editor"]') 
                     || document.querySelector('iframe.editor_iframe');
      
      if (!iframe) return 'no iframe found';
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return 'no contentDocument';
      
      const body = doc.body;
      if (!body) return 'no body in iframe';
      
      body.focus();
      
      const dt = new DataTransfer();
      dt.setData('text/html', html);
      dt.setData('text/plain', html.replace(/<[^>]+>/g, ''));
      
      const event = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      
      body.dispatchEvent(event);
      return 'paste dispatched on iframe body';
    } catch(e) {
      return 'iframe error: ' + e.message;
    }
  }, bodyHtml);
  console.log('Iframe paste result:', pasteResult2);
  await page.waitForTimeout(1000);
  
  // Check result  
  const check = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    // Try various methods to get content
    const data = typeof ed.getDocumentData === 'function' ? ed.getDocumentData() : null;
    const content = ed._document ? JSON.stringify(ed._document).slice(0, 100) : 'no _document';
    return {
      title: ed.getDocumentTitle(),
      dataType: typeof data,
      dataLen: data ? data.length : 0,
      documentPreview: content,
    };
  });
  console.log('Result:', JSON.stringify(check, null, 2));
  
  await page.screenshot({ path: 'blog_event_paste.png', fullPage: false });
  console.log('Screenshot saved');
})();

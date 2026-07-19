// 이미지 clipboard paste 방식 테스트
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);
    
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('iframe not found'); return; }
    
    // Remove old images
    await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const doc = se._documentService.getDocumentData();
      doc.document.components = doc.document.components.filter(c => c['@ctype'] !== 'image');
      se._documentService.setDocumentData(doc);
    });
    
    console.log('클립보드에 이미지 복사 후 paste 테스트...');
    const imagePath = path.resolve(__dirname, 'aicut_blog_dental_main.png');
    const imageBuf = fs.readFileSync(imagePath);
    
    // Read the image as base64
    const b64 = imageBuf.toString('base64');
    const mime = 'image/png';
    
    // 방법 1: Clipboard API - write to clipboard, then paste
    // Set clipboard content in the page context
    await editFrame.evaluate(async ({ b64, mime }) => {
      const response = await fetch(`data:${mime};base64,${b64}`);
      const blob = await response.blob();
      const item = new ClipboardItem({ [mime]: blob });
      await navigator.clipboard.write([item]);
    }, { b64, mime });
    
    console.log('✅ 클립보드에 이미지 기록 완료');
    await sleep(1000);
    
    // Focus on editor and press paste
    // First, click on a text area in the editor
    const editorArea = await editFrame.$('.se-textarea, .se-component-content, [contenteditable]');
    if (editorArea) {
      await editorArea.click();
      await sleep(500);
    }
    
    // Press Ctrl+V
    await editFrame.keyboard.press('Control+v');
    console.log('✅ paste 실행');
    
    await sleep(5000);
    
    // Check for new image
    const imgCount = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return -1;
      const doc = se._documentService.getDocumentData();
      return {
        count: doc.document.components.filter(c => c['@ctype'] === 'image').length,
        total: doc.document.components.length,
        comps: doc.document.components.map(c => c['@ctype'])
      };
    });
    
    console.log('문서 상태:', JSON.stringify(imgCount, null, 2));
    
  } finally {
    await page.close();
  }
})();

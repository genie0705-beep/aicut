const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  
  if (!write) { console.log('❌ No write tab'); process.exit(1); }
  
  // Iframe 접근
  const frameEl = await write.$('#mainFrame');
  if (!frameEl) { console.log('❌ No iframe'); process.exit(1); }
  
  const frame = await frameEl.contentFrame();
  if (!frame) { console.log('❌ Cannot access iframe'); process.exit(1); }
  
  console.log('✅ iframe 접근 성공');
  
  // iframe 내부 확인
  const info = await frame.evaluate(() => {
    const win = window;
    const edNames = Object.keys(win.SmartEditor?._editors || {});
    const hasSE = typeof SmartEditor !== 'undefined';
    const hasSEObj = !!window.SmartEditor;
    const canvas = document.querySelector('.se-canvas');
    const canvasBody = document.querySelector('.se-canvas-body');
    const content = document.querySelector('[contenteditable]');
    const titleInput = document.getElementById('titleArea');
    const titleDiv = document.querySelector('#titleArea div[contenteditable]');
    const editors = SmartEditor?._editors ? Object.keys(SmartEditor._editors) : [];
    return {
      hasSE, hasSEObj,
      editorNames: editors,
      hasCanvas: !!canvas,
      hasCanvasBody: !!canvasBody,
      hasContentEditable: !!content,
      contentType: content?.tagName || 'none',
      hasTitleArea: !!titleInput,
      hasTitleDiv: !!titleDiv,
      titleDivText: titleDiv?.innerText?.substring(0, 50) || '',
      bodyClass: document.body.className,
      url: location.href.substring(0, 100),
    };
  });
  
  console.log('iframe 정보:', JSON.stringify(info, null, 2));
  
  // frameelement state
  const bodyText = await frame.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('\niframe body:', bodyText);
  
  process.exit(0);
})();

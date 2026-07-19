const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  
  if (!write) { console.log('❌ No write tab'); process.exit(1); }
  
  // iframe 확인
  const hasIframe = await write.evaluate(() => {
    const iframes = document.querySelectorAll('iframe');
    return iframes.length > 0 ? iframes.length + '개 iframe 발견' : 'iframe 없음';
  });
  console.log('iframe:', hasIframe);
  
  if (hasIframe.includes('iframe 발견')) {
    const iframeInfo = await write.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => ({
        id: f.id,
        src: (f.src || '').substring(0, 100),
        name: f.name,
        classes: f.className
      }));
    });
    console.log('iframe 목록:', JSON.stringify(iframeInfo, null, 2));
    
    // iframe 내부 확인
    for (const f of iframeInfo) {
      try {
        const iframeEl = await write.$('#' + f.id);
        if (iframeEl) {
          const frame = await iframeEl.contentFrame();
          if (frame) {
            const body = await frame.evaluate(() => document.body?.innerText?.substring(0, 100));
            console.log(`iframe ${f.id} body:`, body || '(empty)');
          }
        }
      } catch(e) {
        console.log(`iframe ${f.id} 접근 오류:`, e.message);
      }
    }
  }
  
  // 실제 에디터 엘리먼트 확인
  const editorEls = await write.evaluate(() => {
    return {
      hasSmartEditor: typeof SmartEditor !== 'undefined',
      seContainer: !!document.querySelector('.smarteditor-container'),
      seCanvas: !!document.querySelector('.se-canvas'),
      seContent: !!document.querySelector('.se-content'),
      titleInput: !!document.querySelector('#title'),
      titleTextarea: !!document.querySelector('#titleArea textarea'),
      titleDiv: !!document.querySelector('#titleArea div[contenteditable]'),
      allTitleEls: Array.from(document.querySelectorAll('[id*="title"], [class*="title"]')).slice(0,5).map(e => e.tagName + '#' + e.id + '.' + (e.className || '').substring(0,40)),
      allEditEls: Array.from(document.querySelectorAll('[class*="se-"], [id*="editor"]')).slice(0,8).map(e => e.tagName + '#' + (e.id||'') + '.' + (e.className||'').substring(0,40)),
      allContenteditables: document.querySelectorAll('[contenteditable]').length
    };
  });
  console.log('\n에디터 엘리먼트:', JSON.stringify(editorEls, null, 2));
  
  // body class 확인
  const bodyClasses = await write.evaluate(() => document.body.className);
  console.log('body class:', bodyClasses);
  
  process.exit(0);
})();

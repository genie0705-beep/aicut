const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const bp = await ctx.newPage();
  await bp.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await bp.waitForTimeout(3000);

  const ef = bp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!ef) return console.log('no editor frame');

  // Check SmartEditor state
  const state = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    if (!ed) return { error: 'no editor' };
    
    const result = {};
    
    // Check title
    try {
      result.title = ed._documentService?.getTitle?.() || 
                     ed._document?.title || 
                     document.querySelector('.se-title-input')?.value ||
                     'unknown';
    } catch(e) { result.title_error = e.message; }
    
    // Check body content
    try {
      if (ed._editingService && ed._editingService.getContents) {
        result.body = (ed._editingService.getContents() || '').substring(0, 300);
      } else if (ed._documentService && ed._documentService.getContents) {
        result.body = (ed._documentService.getContents() || '').substring(0, 300);
      } else {
        result.body = 'getContents not available';
      }
    } catch(e) { result.body_error = e.message; }
    
    // Check visual editor content
    try {
      const editorEl = document.querySelector('[contenteditable]');
      if (editorEl) {
        result.visualText = editorEl.textContent.substring(0, 200);
        result.visualHTML = editorEl.innerHTML.substring(0, 200);
      } else {
        result.visualText = 'no contenteditable found';
      }
    } catch(e) { result.visual_error = e.message; }
    
    // Check iframe content (input_buffer)
    try {
      const iframe = document.querySelector('iframe[id^="input_buffer"]');
      if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
        result.iframeText = iframe.contentDocument.body.textContent.substring(0, 200);
      } else {
        result.iframeText = 'no iframe content';
      }
    } catch(e) { result.iframe_error = e.message; }
    
    return result;
  });
  
  console.log('=== SmartEditor 상태 분석 ===');
  console.log(JSON.stringify(state, null, 2));
  
  // Determine if content was actually set
  const hasTitle = state.title && state.title.length > 5;
  const hasBody = (state.body && state.body.length > 20) || 
                  (state.visualText && state.visualText.length > 20) ||
                  (state.iframeText && state.iframeText.length > 20);
  
  console.log('\n=== 결론 ===');
  console.log('제목 있음:', hasTitle ? '✅' : '❌');
  console.log('본문 있음:', hasBody ? '✅' : '❌');
  
  if (hasTitle && hasBody) {
    console.log('블로그 글쓰기 ✅ 완료!');
  } else {
    console.log('본문이 비어 있음 ❌ - 재시도 필요');
  }
})();

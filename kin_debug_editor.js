const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  for (const p of pages) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      
      // Check the complete page state for editor-related elements
      const state = await p.evaluate(() => {
        // Check for SE (Smart Editor) elements
        const seElements = document.querySelectorAll('[class*=se-], [class*=smart]');
        const seInfo = Array.from(seElements).slice(0, 5).map(el => 
          el.tagName + ' ' + (el.className || '').substring(0, 50) + ' ' + (el.id || '')
        );
        
        // Check for iframes that might be the editor
        const iframes = Array.from(document.querySelectorAll('iframe')).map(f => 
          f.id + ' src=' + (f.src || '').substring(0, 80)
        );
        
        // Check for popups/overlays
        const popups = Array.from(document.querySelectorAll('[class*=popup], [class*=layer], [class*=modal]')).slice(0, 5).map(el =>
          el.tagName + ' ' + (el.className || '').substring(0, 50) + ' visible=' + (el.style.display !== 'none')
        );
        
        // Check if there's a textarea
        const textareas = Array.from(document.querySelectorAll('textarea')).map(t =>
          'id=' + t.id + ' name=' + (t.name || '') + ' class=' + (t.className || '').substring(0, 30)
        );
        
        // Check div[contenteditable]
        const editors = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
        
        return {
          seInfo: seInfo,
          iframes: iframes,
          popups: popups,
          textareas: textareas,
          editors: editors.length,
          editorContent: editors.length > 0 ? editors[0].innerText.substring(0, 100) : 'none'
        };
      });
      
      console.log('=== 에디터 상태 ===');
      console.log('SE 요소:', JSON.stringify(state.seInfo, null, 2));
      console.log('iframe:', JSON.stringify(state.iframes, null, 2));
      console.log('팝업:', JSON.stringify(state.popups, null, 2));
      console.log('textarea:', JSON.stringify(state.textareas, null, 2));
      console.log('contenteditable:', state.editors, '개, 내용:', state.editorContent);
      
      break;
    }
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

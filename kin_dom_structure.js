const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  for (const p of ctx.pages()) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      await p.waitForTimeout(1000);
      
      // Close any open editor by clicking 취소 first
      await p.evaluate(() => {
        const cancelBtns = document.querySelectorAll('button');
        for (const btn of cancelBtns) {
          if (btn.innerText.includes('취소')) {
            btn.click();
            break;
          }
        }
      });
      await p.waitForTimeout(2000);
      
      // Now click 답변하기 fresh
      await p.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.innerText.includes('답변하기')) {
            btn.click();
            break;
          }
        }
      });
      await p.waitForTimeout(5000);
      
      // Now analyze the full DOM after editor opens
      const domInfo = await p.evaluate(() => {
        // Look for the actual editor structure
        // SE2 creates an editor inside a container
        
        // All iframes that might be the editor
        const iframes = document.querySelectorAll('iframe');
        const iframeInfo = Array.from(iframes).map(f => ({
          id: f.id,
          src: (f.src || '').substring(0, 100),
          width: f.width,
          height: f.height,
          visible: f.offsetParent !== null
        }));
        
        // SE-related divs
        const seDivs = document.querySelectorAll('[class*=se-]');
        const seInfo = Array.from(seDivs).slice(0, 10).map(d => ({
          tag: d.tagName,
          class: d.className.substring(0, 60),
          visible: d.offsetParent !== null,
          children: d.children.length,
          textLen: d.innerText.length
        }));
        
        // Check if editor is inside a modal/popup
        const modals = document.querySelectorAll('[class*=modal], [class*=popup], [class*=layer]');
        const visibleModals = Array.from(modals).filter(m => m.offsetParent !== null).map(m => ({
          tag: m.tagName,
          class: m.className.substring(0, 60),
          text: m.innerText.substring(0, 100)
        }));
        
        // The SmartEditor2 usually creates an iframe for the editor
        // Check for the editor iframe
        const editorIframe = document.querySelector('iframe.se2_iframe, iframe[title*="editor"], iframe[title*="Editor"]');
        
        return { iframeInfo, seInfo, visibleModals, editorIframe: editorIframe ? 'found' : 'not found' };
      });
      
      console.log('=== DOM 분석 ===');
      console.log('iframe:', JSON.stringify(domInfo.iframeInfo, null, 2));
      console.log('\nSE 요소:', JSON.stringify(domInfo.seInfo, null, 2));
      console.log('\n보이는 모달:', JSON.stringify(domInfo.visibleModals, null, 2));
      console.log('\n편집기 iframe:', domInfo.editorIframe);
      
      // Try to look inside iframes
      for (let i = 0; i < domInfo.iframeInfo.length; i++) {
        const fInfo = domInfo.iframeInfo[i];
        if (fInfo.visible && fInfo.id && !fInfo.id.includes('gnb') && !fInfo.id.includes('powerlink') && !fInfo.id.includes('da_kin') && !fInfo.id.includes('input_buffer')) {
          try {
            const iframeEl = document.querySelector('#' + fInfo.id);
            if (iframeEl) {
              const iframeDoc = iframeEl.contentDocument || iframeEl.contentWindow.document;
              const text = iframeDoc.body.innerText.substring(0, 200);
              console.log('\niframe ' + fInfo.id + ' 내용:', text.substring(0, 100));
            }
          } catch(e) {
            console.log('iframe ' + fInfo.id + ' 접근불가');
          }
        }
      }
      
      break;
    }
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

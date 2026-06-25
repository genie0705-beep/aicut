const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  for (const p of ctx.pages()) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      await p.waitForTimeout(1000);
      
      // Try opening editor if not open
      const edCheck = await p.$('div[contenteditable="true"]');
      if (!edCheck) {
        await p.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.innerText.includes('답변하기')) { btn.click(); break; }
          }
        });
        await p.waitForTimeout(4000);
      }
      
      // Explore SE3 API more thoroughly
      const seAPI = await p.evaluate(() => {
        const result = {};
        
        // SmartEditor constructor
        if (typeof SmartEditor === 'function') {
          result.SmartEditor_own = Object.getOwnPropertyNames(SmartEditor);
          result.SmartEditor_keys = Object.keys(SmartEditor);
          
          // Try creating instance or getting existing
          if (SmartEditor.editors) {
            result.editors = Object.keys(SmartEditor.editors);
            const firstKey = Object.keys(SmartEditor.editors)[0];
            if (firstKey) {
              const ed = SmartEditor.editors[firstKey];
              const edProto = Object.getOwnPropertyNames(Object.getPrototypeOf(ed));
              result.editorProtoMethods = edProto.filter(m => m !== 'constructor').slice(0, 20);
              result.editorOwnProps = Object.getOwnPropertyNames(ed).slice(0, 20);
              
              // Try setting content
              if (typeof ed.setContents === 'function') {
                ed.setContents('<p>test</p>');
                result.setContentsResult = 'called';
              }
            }
          }
          
          // Check _$SE or other internal properties
          const instanceProps = Object.getOwnPropertyNames(SmartEditor).filter(p => p.startsWith('_') || p.startsWith('$'));
          result.instanceProps = instanceProps;
        }
        
        // Try finding SE instances stored in DOM
        const seBodies = document.querySelectorAll('.se-body');
        const seInstances = Array.from(seBodies).map(body => {
          const dataKeys = Object.keys(body.dataset || {});
          const seRef = body.getAttribute('data-se-editor') || body.getAttribute('data-editor');
          return { dataKeys, seRef };
        });
        result.seInstances = seInstances;
        
        // Check for React/Vue/Preact root
        const rootEl = document.getElementById('__next') || document.getElementById('root') || document.querySelector('[data-reactroot]');
        result.hasFrameworkRoot = !!rootEl;
        
        // Check the actual editor element parent chain for data attributes
        const ed = document.querySelector('div[contenteditable="true"]');
        if (ed) {
          const parents = [];
          let el = ed;
          for (let i = 0; i < 10 && el; i++) {
            const attrs = Array.from(el.getAttributeNames ? el.getAttributeNames() : []);
            const seAttrs = attrs.filter(a => a.includes('se') || a.includes('editor'));
            if (seAttrs.length > 0 || (el.className && typeof el.className === 'string' && el.className.includes('se-'))) {
              parents.push({
                tag: el.tagName,
                class: (el.className || '').substring(0, 50),
                attrs: seAttrs
              });
            }
            el = el.parentElement;
          }
          result.editorParents = parents;
        }
        
        // Check for SE editor stored in a global variable
        const globalKeys = Object.getOwnPropertyNames(window);
        const seProps = globalKeys.filter(k => k.startsWith('se') || k.startsWith('_se') || k.startsWith('__se'));
        result.seGlobals = seProps.slice(0, 20);
        
        return result;
      });
      
      console.log(JSON.stringify(seAPI, null, 2));
      
      break;
    }
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

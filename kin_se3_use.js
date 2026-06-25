const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  for (const p of ctx.pages()) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      await p.waitForTimeout(1000);

      const result = await p.evaluate(() => {
        const result = {};
        
        // Get editor instance
        const editor = SmartEditor._editors['kinpc001'];
        if (!editor) return 'no editor';
        
        // Check document service
        const docService = editor._documentService;
        if (docService) {
          const docProto = Object.getOwnPropertyNames(Object.getPrototypeOf(docService));
          result.docServiceMethods = docProto.filter(m => !m.startsWith('_') && m !== 'constructor').slice(0, 15);
          result.docServiceOwn = Object.getOwnPropertyNames(docService).slice(0, 10);
        }
        
        // Check papyrus (document model)
        const papyrus = editor._papyrus;
        if (papyrus) {
          const papProto = Object.getOwnPropertyNames(Object.getPrototypeOf(papyrus));
          result.papyrusMethods = papProto.filter(m => m !== 'constructor').slice(0, 20);
          result.papyrusOwn = Object.getOwnPropertyNames(papyrus).slice(0, 10);
        }
        
        // Check editing service
        const editingService = editor._editingService;
        if (editingService) {
          const edProto = Object.getOwnPropertyNames(Object.getPrototypeOf(editingService));
          result.editingMethods = edProto.filter(m => !m.startsWith('_') && m !== 'constructor').slice(0, 15);
        }
        
        // Check _tagService for content operations
        const tagService = editor._tagService;
        if (tagService) {
          const tagProto = Object.getOwnPropertyNames(Object.getPrototypeOf(tagService));
          result.tagMethods = tagProto.filter(m => !m.startsWith('_') && m !== 'constructor').slice(0, 10);
        }
        
        // Try the actual setContents approach - check if there's a setContents on the editor itself
        const editorOwnMethods = Object.getOwnPropertyNames(editor).filter(k => 
          typeof editor[k] === 'function' && !k.startsWith('_')
        );
        result.editorMethods = editorOwnMethods.slice(0, 15);
        
        // Check prototype chain for setContents
        let proto = Object.getPrototypeOf(editor);
        let foundSetContents = false;
        let chain = [];
        for (let i = 0; i < 5 && proto; i++) {
          const names = Object.getOwnPropertyNames(proto);
          if (names.includes('setContents')) foundSetContents = true;
          chain.push({ level: i, methods: names.filter(m => m.includes('Content') || m.includes('setText') || m.includes('insert') || m === 'getHTML' || m === 'setHTML' || m === 'getContents').slice(0, 10) });
          proto = Object.getPrototypeOf(proto);
        }
        result.protoChain = chain;
        
        return result;
      });
      
      console.log(JSON.stringify(result, null, 2));
      
      // Now try paste via execCommand
      const pasteResult = await p.evaluate(() => {
        const ed = document.querySelector('div[contenteditable="true"]');
        if (!ed) return 'no editor';
        
        ed.focus();
        
        // Clear
        ed.innerHTML = '';
        
        // Use execCommand to insert text - this uses the browser's native undo stack
        const text = `안녕하세요, AI 영상 제작 관련해서 도움이 될 내용 공유드립니다. 설명해주신 플로우를 구현하려면 Runway Gen-3나 Pika Labs 같은 AI 영상 툴을 직접 사용하거나, 크몽에서 외주를 맡기는 방법이 있습니다.`;
        
        // Try insertText
        const success = document.execCommand('insertText', false, text);
        
        // Dispatch events that SE3 listens to
        ed.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
        
        return {
          execCommandResult: success,
          newContentLen: ed.innerText.length
        };
      });
      
      console.log('Paste result:', JSON.stringify(pasteResult));
      
      // Now try to get content from SE
      const getContent = await p.evaluate(() => {
        const editor = SmartEditor._editors['kinpc001'];
        if (!editor) return 'no editor';
        
        // Try various ways to get the current content
        if (editor._documentService && typeof editor._documentService.getContents === 'function') {
          try {
            const contents = editor._documentService.getContents();
            return 'docService.getContents: ' + contents.substring(0, 100);
          } catch(e) {
            return 'docService error: ' + e.message;
          }
        }
        
        // Check if papyrus has the content
        if (editor._papyrus) {
          try {
            const data = editor._papyrus.getData();
            return 'papyrus data: ' + JSON.stringify(data).substring(0, 100);
          } catch(e) {
            return 'papyrus error: ' + e.message;
          }
        }
        
        return 'no content method';
      });
      
      console.log('Get content:', getContent);
      
      await p.waitForTimeout(2000);
      
      // Submit
      await p.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.className.includes('_answerRegisterButton') || btn.innerText.trim() === '등록') {
            btn.scrollIntoView({ block: 'center' });
            setTimeout(() => btn.click(), 200);
            break;
          }
        }
      });
      
      await p.waitForTimeout(5000);
      
      const final = await p.evaluate(() => {
        const ed = document.querySelector('div[contenteditable="true"]');
        const body = document.body.innerText;
        return {
          editorOpen: !!ed,
          hasRunway: body.includes('Runway'),
          hasOurAnswerInBody: body.includes('AI 영상 제작 관련해서')
        };
      });
      
      console.log('Final:', JSON.stringify(final));
      
      break;
    }
  }

  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

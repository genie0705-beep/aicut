const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  for (const p of ctx.pages()) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      await p.waitForTimeout(1000);

      // Open editor
      const hasEd = await p.$('div[contenteditable="true"]');
      if (!hasEd) {
        await p.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.innerText.includes('답변하기')) { btn.click(); break; }
          }
        });
        await p.waitForTimeout(4000);
      }

      // Use SmartEditor API
      const apiResult = await p.evaluate(() => {
        const result = {};
        
        // Check _editors
        if (SmartEditor._editors) {
          result.editorsKeys = Object.keys(SmartEditor._editors);
          const firstKey = Object.keys(SmartEditor._editors)[0];
          if (firstKey) {
            const editor = SmartEditor._editors[firstKey];
            const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(editor));
            result.editorProto = proto.filter(m => m !== 'constructor').slice(0, 30);
            result.editorOwn = Object.getOwnPropertyNames(editor).slice(0, 20);
            
            // Try setContents
            const content = `<p>안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.</p><p><br></p><p>설명해주신 "위성 데이터 → AI 분석 → 위험 감지 → 현장 대응" 플로우를 구현하려면 접근법이 두 가지 있습니다.</p><p><br></p><p><b>1) AI 영상 생성 툴 직접 사용</b></p><p>- Runway Gen-3: 이미지 업로드 후 원하는 모션을 텍스트로 입력</p><p>- Pika Labs: 이미지 기반 카메라 무빙 세밀 지정 가능</p><p>- Kling / Vidu: 사진을 자연스럽게 움직이는 능력이 좋음</p><p><br></p><p><b>2) 외주 의뢰</b></p><p>크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색해보세요.</p><p>포트폴리오 확인 후 의뢰하시면 됩니다.</p><p><br></p><p>AI 영상 툴은 대부분 무료 체험을 제공하니 직접 테스트해보시는 것도 좋습니다.</p>`;
            
            try {
              if (typeof editor.setContents === 'function') {
                editor.setContents(content, 'html');
                result.setContents = 'called setContents';
              } else if (typeof editor.setValue === 'function') {
                editor.setValue(content);
                result.setContents = 'called setValue';
              } else if (typeof editor.exec === 'function') {
                editor.exec('PASTE_HTML', [content]);
                result.setContents = 'called exec(PASTE_HTML)';
              }
            } catch(e) {
              result.setContents = 'error: ' + e.message;
            }
            
            // Try calling synchronize/sync
            try {
              if (typeof editor.sync === 'function') {
                editor.sync();
                result.sync = 'called sync';
              } else if (typeof editor.syncContents === 'function') {
                editor.syncContents();
                result.sync = 'called syncContents';
              }
            } catch(e) {}
          }
        }
        
        // Also check COMMAND
        result.commands = Object.keys(SmartEditor.COMMAND || {});
        
        // Check getEditor
        result.getEditor = typeof SmartEditor.getEditor;
        
        return result;
      });
      
      console.log(JSON.stringify(apiResult, null, 2));
      
      // After setting content via API, try to submit
      await p.waitForTimeout(2000);
      
      const submitResult = await p.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        return new Promise(resolve => {
          setTimeout(() => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
              if (btn.className.includes('_answerRegisterButton') || btn.innerText.trim() === '등록') {
                btn.click();
                resolve('clicked');
                return;
              }
            }
            resolve('no button');
          }, 500);
        });
      });
      
      console.log('Submit:', submitResult);
      await p.waitForTimeout(5000);
      
      // Final check
      const final = await p.evaluate(() => {
        const ed = document.querySelector('div[contenteditable="true"]');
        const body = document.body.innerText;
        const qnaSections = body.match(/\d+번째 답변/g);
        return {
          editorOpen: !!ed,
          answerCount: qnaSections ? qnaSections.length : 0,
          bodyTextLen: body.length
        };
      });
      console.log('최종:', JSON.stringify(final));
      
      break;
    }
  }

  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

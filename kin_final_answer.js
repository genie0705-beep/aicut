const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  for (const p of ctx.pages()) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      await p.waitForTimeout(1000);

      // Click 답변하기 if needed
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

      // Use SmartEditor3 editing service to properly insert content
      const result = await p.evaluate(() => {
        const editor = SmartEditor._editors['kinpc001'];
        if (!editor) return 'no editor instance';
        
        const editingService = editor._editingService;
        if (!editingService) return 'no editing service';
        
        // Focus the editor first
        const ed = document.querySelector('div[contenteditable="true"]');
        if (ed) ed.focus();
        
        // First clear existing content by selecting all and deleting
        document.execCommand('selectAll');
        document.execCommand('delete');
        
        // Now insert content using the SE3 editing service
        const text = `안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.

설명해주신 "위성 데이터 → AI 분석 → 위험 감지 → 현장 대응" 플로우를 구현하는 방법은 크게 두 가지입니다.

1) AI 영상 생성 툴 직접 사용
- Runway Gen-3: 이미지를 업로드하고 원하는 모션을 텍스트로 입력하면 생성됩니다
- Pika Labs: 이미지 기반으로 카메라 무빙을 세밀하게 지정할 수 있습니다
- Kling / Vidu: 사진을 자연스럽게 움직이는 능력이 좋습니다

2) 외주 의뢰
크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색하시고 포트폴리오를 확인해보세요. 장면별 설명을 문서로 정리해서 전달하면 견적이 정확합니다.

AI 영상 툴은 대부분 무료 체험을 제공하니 직접 테스트해보시는 것도 좋습니다.`;

        // Try write() method
        try {
          editingService.write(text);
          return 'write() called successfully';
        } catch(e) {
          try {
            // Try writeTextWithSoftLineBreak
            editingService.writeTextWithSoftLineBreak(text);
            return 'writeTextWithSoftLineBreak called';
          } catch(e2) {
            try {
              // Try insertByExternalPaste
              const html = text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
              editingService.insertByExternalPaste('<p>' + html + '</p>');
              return 'insertByExternalPaste called';
            } catch(e3) {
              return 'all methods failed: ' + e.message + ' | ' + e2.message + ' | ' + e3.message;
            }
          }
        }
      });
      
      console.log('Insert result:', result);
      await p.waitForTimeout(2000);
      
      // Verify content via SE3 API
      const verification = await p.evaluate(() => {
        const editor = SmartEditor._editors['kinpc001'];
        if (!editor) return 'no editor';
        
        // Try getContentText from prototype
        if (typeof editor.getContentText === 'function') {
          const text = editor.getContentText();
          return 'SE content: ' + text.substring(0, 100);
        }
        
        // Check contenteditable
        const ed = document.querySelector('div[contenteditable="true"]');
        return 'contenteditable: ' + (ed ? ed.innerText.substring(0, 100) : 'none');
      });
      
      console.log('Verification:', verification);
      
      // Now submit
      await p.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        return new Promise(resolve => {
          setTimeout(() => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
              if (btn.className.includes('_answerRegisterButton') || btn.innerText.trim() === '등록') {
                btn.scrollIntoView({ block: 'center' });
                setTimeout(() => {
                  btn.click();
                  resolve('clicked');
                }, 300);
                return;
              }
            }
            resolve('no button');
          }, 500);
        });
      });
      
      console.log('Submit button clicked');
      await p.waitForTimeout(5000);
      
      // Final check
      const finalState = await p.evaluate(() => {
        const ed = document.querySelector('div[contenteditable="true"]');
        const body = document.body.innerText;
        const answerSections = document.querySelectorAll('._answer');
        return {
          editorOpen: !!ed,
          answerCount: answerSections.length,
          answerTexts: Array.from(answerSections).map(a => a.innerText.substring(0, 80))
        };
      });
      
      console.log('Final:', JSON.stringify(finalState, null, 2));
      
      break;
    }
  }

  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

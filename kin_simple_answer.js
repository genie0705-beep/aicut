const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // Find the detail page or navigage
  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('493566474')) { p = pg; break; }
  }
  if (!p) { console.log('페이지를 찾을 수 없습니다'); await b.close(); return; }
  
  await p.bringToFront();
  await p.waitForTimeout(1000);
  
  // Click 답변하기 if editor not present
  const hasEditor = await p.$('div[contenteditable="true"]');
  if (!hasEditor) {
    await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.innerText.includes('답변하기') || btn.innerText.trim() === '답변') {
          btn.click();
          break;
        }
      }
    });
    console.log('답변하기 버튼 클릭');
    await p.waitForTimeout(4000);
  } else {
    console.log('에디터 이미 열려 있음');
  }
  
  // Now use SE2 API to properly set content
  const result = await p.evaluate(() => {
    // Try to find SmartEditor2 instance
    // SE2 typically stores instances in SmartEditor.editors or in nhn.husky.EZCreator
    
    // Method 1: Check SmartEditor global
    if (typeof SmartEditor !== 'undefined') {
      // Check if getInstance exists
      if (SmartEditor.getInstance) {
        const ed = SmartEditor.getInstance();
        if (ed) {
          const text = `안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.`;
          ed.setContents(text, 'text');
          return 'set via SmartEditor.getInstance';
        }
      }
      // Check SmartEditor.editors
      if (SmartEditor.editors && SmartEditor.editors.length > 0) {
        SmartEditor.editors[0].exec('PASTE_HTML', ['<p>test content</p>']);
        return 'used SmartEditor.editors[0].exec';
      }
    }
    
    // Method 2: Try nhn.husky.EZCreator
    if (typeof nhn !== 'undefined' && nhn.husky && nhn.husky.EZCreator) {
      return 'EZCreator found: ' + Object.keys(nhn.husky.EZCreator).join(', ');
    }
    
    // Method 3: Direct contenteditable manipulation
    const ed = document.querySelector('div[contenteditable="true"]');
    if (ed) {
      ed.focus();
      // Use document.execCommand with PASTE (simulates paste action)
      const text = `안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.

설명해주신 "위성 데이터 -> AI 분석 -> 위험 감지 -> 현장 대응" 플로우를 구현하려면 접근법이 두 가지 있습니다.

1) AI 영상 생성 툴 직접 사용
- Runway Gen-3: 이미지 업로드 후 원하는 모션을 텍스트로 입력
- Pika Labs: 이미지 기반 카메라 무빙(팬, 줌인) 세밀 지정 가능
- Kling / Vidu: 사진을 자연스럽게 움직이는 능력이 좋음

2) 외주 의뢰
크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색, 포트폴리오 확인 후 의뢰하세요.

AI 영상 툴은 대부분 무료 체험을 제공하니 직접 테스트해보시는 것도 추천합니다.`;
      
      ed.innerHTML = '';
      // Create paragraph elements properly
      const lines = text.split('\n\n');
      lines.forEach((para, i) => {
        if (i > 0) ed.appendChild(document.createElement('br'));
        const p = document.createElement('p');
        p.innerText = para.replace(/\n/g, ' ');
        ed.appendChild(p);
      });
      
      // Dispatch all necessary events
      ['input', 'change', 'keyup', 'keydown'].forEach(evt => {
        ed.dispatchEvent(new Event(evt, { bubbles: true }));
      });
      
      return 'content set via innerHTML: ' + ed.innerText.length + ' chars';
    }
    
    return 'no method worked';
  });
  
  console.log('SE API 결과:', result);
  await p.waitForTimeout(2000);

  // Now click the 등록 button
  const clickResult = await p.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    // Wait a bit for scroll to complete
    return new Promise(resolve => {
      setTimeout(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          const txt = btn.innerText.trim();
          if (txt === '등록' && btn.className.includes('_answerRegisterButton')) {
            btn.click();
            resolve('clicked register button: ' + txt);
            return;
          }
        }
        // Fallback - any button with 등록 text
        for (const btn of btns) {
          if (btn.innerText.trim() === '등록') {
            btn.click();
            resolve('clicked register (fallback): ' + btn.className);
            return;
          }
        }
        resolve('no register button found');
      }, 500);
    });
  });
  
  console.log('등록 클릭:', clickResult);
  await p.waitForTimeout(5000);
  
  // Final state check
  const finalState = await p.evaluate(() => {
    const ed = document.querySelector('div[contenteditable="true"]');
    const bodyText = document.body.innerText;
    const answerCount = (bodyText.match(/\d+번째 답변/g) || []).length;
    return {
      editorOpen: !!ed,
      answerCount: answerCount,
      bodyHasOurAnswer: bodyText.includes('Runway') || bodyText.includes('Pika'),
      url: window.location.href.substring(0, 80)
    };
  });
  
  console.log('최종 상태:', JSON.stringify(finalState));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

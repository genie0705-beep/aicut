const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  for (const p of pages) {
    if (p.url().includes('493566474')) {
      // Check editor state
      const state = await p.evaluate(() => {
        const ed = document.querySelector('div[contenteditable="true"]');
        const text = ed ? ed.innerText.substring(0, 200) : 'none';
        
        // Check all buttons for 등록
        const btns = Array.from(document.querySelectorAll('button'));
        const btnInfo = btns.map(b => b.innerText.substring(0, 30) + ' | class=' + (b.className || '').substring(0, 40)).filter(t => t.includes('등록') || t.includes('취소'));
        
        return { editorText: text, buttons: btnInfo };
      });
      
      console.log('=== 현재 상태 ===');
      console.log('에디터 내용(처음 200자):', state.editorText);
      console.log('등록/취소 버튼들:', state.buttons);
      break;
    }
  }
  
  // Also check if we have tab with the question without answer form
  for (const p of pages) {
    if (p.url().includes('kin.naver.com') && !p.url().includes('detail')) {
      console.log('Kin main page found:', p.url().substring(0, 80));
    }
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

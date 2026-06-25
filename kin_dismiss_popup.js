const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  for (const p of pages) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      
      // Check popup content
      const popupInfo = await p.evaluate(() => {
        const popupContent = document.querySelector('.popup__content');
        if (!popupContent) return 'no popup';
        const title = popupContent.querySelector('.popup__title_text');
        const mainText = popupContent.querySelector('.popup__maintext');
        const buttons = popupContent.querySelectorAll('button, a');
        const btnText = Array.from(buttons).map(b => b.innerText.trim().substring(0, 30));
        return {
          title: title ? title.innerText.trim() : '',
          mainText: mainText ? mainText.innerText.trim().substring(0, 200) : '',
          buttons: btnText,
          html: popupContent.innerHTML.substring(0, 300)
        };
      });
      
      console.log('=== 팝업 정보 ===');
      console.log(JSON.stringify(popupInfo, null, 2));
      
      // Try to click 확인/등록/완료 button in the popup
      if (popupInfo.buttons && popupInfo.buttons.length > 0) {
        for (const btnText of popupInfo.buttons) {
          console.log('팝업 버튼:', btnText);
        }
        
        // Click the confirm button
        const confirmBtn = await p.evaluate(() => {
          const btns = document.querySelectorAll('.popup__content button');
          for (const btn of btns) {
            if (btn.innerText.includes('확인') || btn.innerText.includes('등록') || btn.innerText.includes('완료')) {
              btn.click();
              return 'clicked: ' + btn.innerText;
            }
          }
          return 'no matching button';
        });
        console.log('팝업 버튼 클릭:', confirmBtn);
        await p.waitForTimeout(3000);
      }
      
      // Check if answer was registered now
      const afterText = await p.evaluate(() => {
        const body = document.body.innerText;
        if (body.includes('Runway') || body.includes('Pika')) return '✅ 답변 등록된 것으로 보임';
        // Check if editor is gone
        const ed = document.querySelector('div[contenteditable="true"]');
        return ed ? '에디터 여전히 열림. 내용:' + ed.innerText.substring(0, 50) : '에디터 닫힘 (등록 완료?)';
      });
      console.log('결과:', afterText);
      
      break;
    }
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

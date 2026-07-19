// 위치 선택 + 공유 마무리
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/location/')) {
      console.log('위치 페이지 발견');
      
      // "Seoul, South Korea" 클릭
      await p.evaluate(() => {
        const items = document.querySelectorAll('[role="button"], [role="option"]');
        for (const item of items) {
          const t = item.innerText || '';
          if (t === 'Seoul, South Korea' || t === '서울, 대한민국') {
            item.click();
            return;
          }
        }
        // 첫 번째 결과
        const first = document.querySelector('[role="button"]');
        if (first && first.innerText.includes('Seoul')) first.click();
      });
      
      await p.waitForTimeout(3000);
      console.log('위치 선택 후 URL:', p.url());
      
      // 공유 버튼
      const text = await p.evaluate(() => (document.body.innerText || '').slice(0, 400));
      console.log('화면:', text);
      
      await p.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('div[role="button"], button'));
        for (const btn of btns) {
          if (btn.innerText === '공유' || btn.innerText === 'Share') {
            btn.click();
            return;
          }
        }
      });
      
      await p.waitForTimeout(5000);
      
      const finalText = await p.evaluate(() => (document.body.innerText || '').slice(0, 200));
      console.log('공유 후:', finalText);
      
      await p.screenshot({ path: 'debug_ig_shared.png', fullPage: true });
      break;
    }
  }
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

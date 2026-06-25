// postwrite 탭 상태 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      console.log('=== postwrite 탭 발견 ===');

      const title = await p.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        for (const i of inputs) {
          if (i.value && i.value.length > 5) return i.value.substring(0, 50);
        }
        return '빈 제목';
      }).catch(() => '오류');
      console.log('제목:', title);

      const content = await p.evaluate(() => {
        const eds = document.querySelectorAll('[contenteditable]');
        let maxLen = 0;
        for (const ed of eds) {
          if (ed.innerHTML && ed.innerHTML.length > maxLen) {
            maxLen = ed.innerHTML.length;
          }
        }
        return maxLen > 0 ? '본문 ' + maxLen + '자 입력됨' : '본문 없음';
      }).catch(() => '오류');
      console.log('본문:', content);

      // 탭 활성화시키기 위해 evaluate 실행
      await p.evaluate(() => {
        const tabs = document.querySelectorAll('[role="tab"]');
        console.log('tabs:', tabs.length);
      }).catch(() => {});

      break;
    }
  }

  try { await b.close(); } catch(e) {}
})();

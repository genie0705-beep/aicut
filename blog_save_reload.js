// 저장 후 새로고침 → React가 내용 복원
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      // 저장 버튼 찾기
      const btns = await p.$$('button');
      for (const btn of btns) {
        const txt = await btn.innerText().catch(() => '');
        const vis = await btn.isVisible().catch(() => false);
        if (txt.trim() === '저장' && vis) {
          await btn.click({ force: true });
          await p.waitForTimeout(3000);
          console.log('저장 버튼 클릭');
          break;
        }
      }

      // 새로고침
      await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await p.waitForTimeout(5000);
      console.log('새로고침 완료');

      // 저장된 내용 확인
      const result = await p.evaluate(() => {
        const titleEl = document.querySelector('.se-title-text');
        const title = titleEl ? titleEl.innerText || '' : '';

        const bodyEls = document.querySelectorAll('[contenteditable]');
        let body = '';
        for (const el of bodyEls) {
          const t = el.innerText || '';
          if (t.length > body.length) body = t;
        }

        return {
          title: title.substring(0, 40),
          bodyLen: body.length,
          bodyPreview: body.substring(0, 80)
        };
      }).catch(() => ({}));

      console.log('제목:', result.title || '(비어있음)');
      console.log('본문:', result.bodyLen > 0 ? `${result.bodyLen}자` : '(비어있음)');
      if (result.bodyLen > 0) console.log('시작:', result.bodyPreview);

      break;
    }
  }

  try { await b.close(); } catch(e) {}
})();

const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('blog.naver.com/aicut') && p.url().includes('Write'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 2000));

  // 메인 페이지에서 발행 버튼 찾기
  const btn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, [role="button"], a, span, div');
    for (const el of btns) {
      const t = (el.innerText || '').trim();
      if (t === '발행') {
        const r = el.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });

  if (!btn) { console.log('발행 버튼 못 찾음'); await b.close(); process.exit(0); }

  console.log('발행 버튼:', btn.x, btn.y);
  
  // page.mouse.click 사용
  await page.mouse.click(btn.x, btn.y);
  console.log('클릭 완료');
  await new Promise(r => setTimeout(r, 3000));

  // 발행 모달 처리
  const modalText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('발행 후:', modalText.substring(0, 300));

  // "발행하기" 버튼이 있는지 (확인 모달)
  const confirmBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, [role="button"], a, span, div');
    for (const el of btns) {
      const t = (el.innerText || '').trim();
      if (t === '발행하기' || t === '확인' || t === '게시' || t.includes('발행')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: t };
      }
    }
    return null;
  });

  if (confirmBtn) {
    console.log('발행 확인 버튼:', confirmBtn.text);
    await page.mouse.click(confirmBtn.x, confirmBtn.y);
    await new Promise(r => setTimeout(r, 3000));
    console.log('발행 완료! ✅');
  } else {
    console.log('확인 모달 없음 - 이미 발행되었을 수 있음');
  }

  // 최종 URL 확인
  const finalUrl = page.url();
  console.log('최종 URL:', finalUrl.substring(0, 100));

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

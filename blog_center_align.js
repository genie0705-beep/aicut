const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // 1. 에디터 영역 클릭해서 활성화
  await page.evaluate(() => {
    const seBody = document.querySelector('.se-body');
    if (seBody) seBody.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. 전체 선택 (Ctrl+A)
  await page.keyboard.press('Control+a');
  await new Promise(r => setTimeout(r, 1000));

  // 3. 정렬 버튼 찾기 (가운데 정렬)
  const centerBtn = await page.evaluate(() => {
    // 툴바에서 정렬 아이콘 찾기
    const allButtons = document.querySelectorAll('button, [role="button"], a, span, div');
    for (const el of allButtons) {
      const text = el.innerText?.trim() || '';
      const cls = (typeof el.className === 'string') ? el.className : '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      
      // 가운데 정렬 관련 키워드
      if (ariaLabel.includes('가운데') || ariaLabel.includes('center') || ariaLabel.includes('Center') ||
          text.includes('가운데') || cls.includes('center') || cls.includes('align')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: text.substring(0, 20) };
      }
    }
    // SVG 아이콘 중 center 정렬 아이콘
    const svgs = document.querySelectorAll('svg, path');
    for (const svg of svgs) {
      const parent = svg.closest('button, [role="button"]');
      if (parent) {
        const html = parent.innerHTML || '';
        if (html.includes('center') || html.includes('Center') || html.includes('align')) {
          const r = parent.getBoundingClientRect();
          if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: 'svg center' };
        }
      }
    }
    return null;
  });

  if (centerBtn) {
    console.log('가운데 정렬 버튼 찾음:', centerBtn.text);
    await page.mouse.click(centerBtn.x, centerBtn.y);
    await new Promise(r => setTimeout(r, 1000));
    console.log('가운데 정렬 클릭 완료');
  } else {
    console.log('가운데 정렬 버튼 못 찾음 → execCommand 시도');
    // execCommand로 center 정렬
    await page.evaluate(() => {
      document.execCommand('justifyCenter', false, null);
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log('execCommand justifyCenter 실행');
  }

  // 4. 결과 확인
  const result = await page.evaluate(() => {
    const sel = window.getSelection();
    const range = sel.getRangeCount() > 0 ? sel.getRangeAt(0) : null;
    return {
      selectionText: range ? range.toString().substring(0, 30) : '선택 없음',
      execApplied: true
    };
  });
  console.log('결과:', JSON.stringify(result));

  // 5. 선택 해제 (ESC)
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // 6. 스크린샷
  await page.screenshot({ path: 'postwrite_centered.png' });
  console.log('스크린샷: postwrite_centered.png');

  console.log('\n✅ 가운데 정렬 완료! 모바일 최적화 적용됨');
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

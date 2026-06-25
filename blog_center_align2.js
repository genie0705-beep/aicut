const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // 전체 선택
  await page.evaluate(() => {
    const seBody = document.querySelector('.se-body');
    if (seBody) seBody.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Control+a');
  await new Promise(r => setTimeout(r, 1000));

  // 정렬 드롭다운 버튼 찾아서 클릭
  const dropBtn = await page.evaluate(() => {
    const els = document.querySelectorAll('button, [role="button"]');
    for (const el of els) {
      // SVG가 있는 버튼 중 "정렬"과 관련된 것
      const text = el.innerText?.trim() || '';
      const html = el.innerHTML || '';
      if ((text.includes('정렬') || html.includes('align') || html.includes('justify')) && el.offsetParent !== null) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: text.substring(0, 20) };
      }
    }
    return null;
  });

  if (dropBtn) {
    console.log('정렬 드롭다운:', dropBtn.text);
    await page.mouse.click(dropBtn.x, dropBtn.y);
    await new Promise(r => setTimeout(r, 1500));
    console.log('드롭다운 열림');
  }

  // 드롭다운 메뉴에서 "가운데 정렬" 찾기
  const centerOpt = await page.evaluate(() => {
    // 드롭다운 메뉴 항목들
    const items = document.querySelectorAll('[role="menuitem"], [role="option"], .menu-item, li, a, button');
    for (const el of items) {
      const text = el.innerText?.trim() || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      if (text.includes('가운데') || text.includes('center') || ariaLabel.includes('center') || ariaLabel.includes('가운데')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: text.substring(0, 20) };
      }
    }
    // SVG path 기반 center 아이콘
    const allEls = document.querySelectorAll('*');
    for (const el of allEls) {
      const html = el.innerHTML || '';
      if (html.includes('viewBox') && (html.includes('center') || html.includes('align-center') || html.includes('align_center'))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: 'svg' };
      }
    }
    return null;
  });

  if (centerOpt) {
    console.log('가운데 정렬 옵션:', centerOpt.text);
    await page.mouse.click(centerOpt.x, centerOpt.y);
    await new Promise(r => setTimeout(r, 1000));
    console.log('가운데 정렬 적용 ✅');
  } else {
    console.log('가운데 정렬 옵션 못 찾음');
    // execCommand 시도
    await page.evaluate(() => {
      const ce = document.querySelector('[contenteditable]');
      if (ce) {
        ce.focus();
        document.execCommand('justifyCenter', false, null);
        ce.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log('execCommand justifyCenter 실행');
  }

  // ESC로 선택 해제
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  console.log('\n✅ 완료! 모바일 최적화 적용');
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

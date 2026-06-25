const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  // 새 메시지 버튼(연필 아이콘) 찾기
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"], svg'))
      .map(b => ({ 
        tag: b.tagName,
        text: b.innerText ? b.innerText.trim().substring(0,30) : '', 
        title: b.title || '', 
        ariaLabel: b.getAttribute('aria-label') || ''
      }))
      .filter(b => b.text || b.title || b.ariaLabel)
      .slice(0, 20);
  });
  console.log('Buttons:', JSON.stringify(btns, null, 2));

  // 새 메시지 아이콘 클릭 시도
  const clicked = await page.evaluate(() => {
    const el = document.querySelector('[aria-label*="새"], [aria-label*="New"], [aria-label*="작성"], [title*="새"]');
    if (el) { el.click(); return 'found'; }
    // SVG 버튼 중 연필 모양
    const btns = Array.from(document.querySelectorAll('button'));
    const newMsgBtn = btns.find(b => {
      const svg = b.querySelector('svg');
      return svg && !b.innerText.trim();
    });
    if (newMsgBtn) { newMsgBtn.click(); return 'svg_btn'; }
    return false;
  });
  console.log('Clicked:', clicked);
  await new Promise(r => setTimeout(r, 2000));

  // 검색창 확인
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      placeholder: i.placeholder, type: i.type, name: i.name, visible: i.offsetParent !== null
    }));
  });
  console.log('Inputs after click:', JSON.stringify(inputs));

  await b.close();
})().catch(e => console.error('ERR:', e.message));

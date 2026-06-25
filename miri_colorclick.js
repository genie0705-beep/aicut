const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(500);

  // 배경색 흰색 박스 좌표 찾기
  const boxPos = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('*'));
    for (const el of allEls) {
      const text = el.innerText?.trim();
      if (text === '배경색') {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement;
        if (parent) {
          const pRect = parent.getBoundingClientRect();
          // 형제 요소들 확인
          const siblings = Array.from(parent.children).map(c => ({
            tag: c.tagName,
            cls: c.className.substring(0,50),
            rect: c.getBoundingClientRect(),
            style: c.getAttribute('style')
          }));
          return { labelRect: rect, parentRect: pRect, siblings };
        }
        return { labelRect: rect };
      }
    }
    return null;
  });
  
  if (boxPos) {
    console.log('배경색 위치:', JSON.stringify(boxPos.labelRect));
    // 흰색 박스는 배경색 레이블 오른쪽에 있음 — 우측 ~245px, 130px 클릭
    await page.mouse.click(245, 130);
    console.log('배경색 박스 좌표 클릭 (245, 130)');
    await sleep(2000);
    
    await page.screenshot({ path: 'miri_color2.png' });
    
    // hex input 찾기
    const hexInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const hex = inputs.find(i => i.value && i.value.match(/^#?[0-9a-fA-F]{3,6}$/) || (i.maxLength === 6 || i.maxLength === 7));
      return hex ? { val: hex.value, ph: hex.placeholder, cls: hex.className.substring(0,50), maxLen: hex.maxLength } : null;
    });
    console.log('hex input:', hexInput);
  } else {
    console.log('배경색 요소 못 찾음');
  }

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

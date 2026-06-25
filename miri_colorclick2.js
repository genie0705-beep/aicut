const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(500);

  // 배경색 박스 정확한 위치 찾기 (y=196~228 범위)
  const boxPos = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('*'));
    for (const el of allEls) {
      const text = el.innerText?.trim();
      if (text === '배경색') {
        const parent = el.parentElement;
        if (parent) {
          // 부모의 모든 자식 요소 확인
          const children = Array.from(parent.children);
          const result = children.map(c => {
            const r = c.getBoundingClientRect();
            const bg = window.getComputedStyle(c).backgroundColor;
            return { tag: c.tagName, cls: c.className.substring(0,40), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bg };
          });
          return result;
        }
      }
    }
    return null;
  });
  console.log('배경색 자식들:', JSON.stringify(boxPos));

  // 흰색 박스 직접 찾아서 클릭
  const clicked = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('*'));
    for (const el of allEls) {
      const text = el.innerText?.trim();
      if (text === '배경색') {
        const parent = el.parentElement;
        if (parent) {
          const children = Array.from(parent.children);
          for (const c of children) {
            const bg = window.getComputedStyle(c).backgroundColor;
            const r = c.getBoundingClientRect();
            // 흰색 또는 색상 박스 찾기
            if (r.width < 50 && r.height < 50 && r.width > 10) {
              c.click();
              return `클릭: ${c.tagName} (${Math.round(r.x)}, ${Math.round(r.y)}) bg=${bg}`;
            }
          }
          // 못 찾으면 오른쪽 끝 클릭
          const pRect = parent.getBoundingClientRect();
          return `부모 우측: (${Math.round(pRect.right - 20)}, ${Math.round(pRect.top + pRect.height/2)})`;
        }
      }
    }
    return '못 찾음';
  });
  console.log('클릭 결과:', clicked);
  await sleep(1500);

  // 실제 좌표 클릭 시도 (우측 박스 위치)
  await page.mouse.click(245, 212); // 배경색 박스 우측 (y=196+16=212)
  await sleep(1500);
  await page.screenshot({ path: 'miri_color3.png' });

  const hexInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      val: i.value, ph: i.placeholder, maxLen: i.maxLength, cls: i.className.substring(0,40)
    }));
  });
  console.log('입력창들:', JSON.stringify(hexInputs.slice(0,8)));

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

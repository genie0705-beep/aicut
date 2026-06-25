const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 좌측 메뉴 "구성요소 관리" 정확한 위치
  const menuPos = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find(e => e.innerText?.trim() === '구성요소 관리');
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), tag: el.tagName, cls: el.className.substring(0,50) };
    }
    return null;
  });
  console.log('구성요소 관리 위치:', menuPos);

  if (menuPos) {
    await page.mouse.click(menuPos.x, menuPos.y);
    await sleep(1500);

    // 펼쳐진 서브메뉴 확인
    const allVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a, li'))
        .map(el => ({ text: el.innerText?.trim().substring(0,20), href: el.href||'', visible: el.getBoundingClientRect().width > 0 }))
        .filter(el => el.text && el.visible && (el.text.includes('비즈') || el.text.includes('채널') || el.text.includes('전환')))
        .slice(0,10);
    });
    console.log('서브메뉴:', JSON.stringify(allVisible));
    await page.screenshot({ path: 'naver_comp2.png' });
  }

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

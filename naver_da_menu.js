const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "구성요소 관리" 클릭
  const pos = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('li, a, span, button'));
    const el = els.find(e => e.innerText?.trim() === '구성요소 관리');
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
    }
    return null;
  });
  console.log('구성요소 관리 위치:', pos);

  if (pos) {
    await page.mouse.click(pos.x, pos.y);
    await sleep(1500);

    // DA 비즈채널 서브메뉴 확인
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a, li, span'))
        .map(el => ({ text: el.innerText?.trim().substring(0,20), href: el.href||'' }))
        .filter(el => el.text && el.text.length > 1 && el.text.length < 20)
        .filter(el => el.text.includes('비즈') || el.text.includes('채널') || el.text.includes('이미지') || el.text.includes('애셋'))
        .slice(0, 10);
    });
    console.log('서브메뉴:', JSON.stringify(links));

    await page.screenshot({ path: 'naver_da_menu.png' });
  }

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('aicut.co.kr')) { p = pg; break; }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p.waitForTimeout(4000);
  }
  await p.bringToFront();
  await p.waitForTimeout(1000);

  const heroInfo = await p.evaluate(() => {
    // 로고 찾기 (모든 이미지)
    const allImgs = document.querySelectorAll('img');
    const imgInfo = Array.from(allImgs).map(img => ({
      src: (img.src || '').substring(0, 80),
      alt: (img.alt || '').substring(0, 40),
      width: img.width,
      height: img.height,
      visible: img.offsetParent !== null
    }));

    // 첫 섹션 (Hero) 구조
    const firstSection = document.querySelector('section:first-child');
    const heroHTML = firstSection ? firstSection.innerHTML.substring(0, 1000) : 'no section';

    // 브랜드명 텍스트
    const brandTexts = [];
    const allEls = document.querySelectorAll('h1, h2, strong, b, [class*=logo], [class*=brand]');
    allEls.forEach(el => {
      const t = el.innerText.trim();
      if (t && (t.includes('AICUT') || t.includes('에이컷') || t.includes('AI CUT'))) {
        brandTexts.push(t.substring(0, 40));
      }
    });

    // 타이틀 폰트 스타일
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? (() => {
      const cs = getComputedStyle(h1);
      return {
        font: cs.fontFamily,
        size: cs.fontSize,
        weight: cs.fontWeight,
        color: cs.color,
        lineHeight: cs.lineHeight
      };
    })() : null;

    return { imgInfo, brandTexts, h1Style, heroHTML: heroHTML.substring(0, 500) };
  });

  console.log(JSON.stringify(heroInfo, null, 2));
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

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
  await p.waitForTimeout(2000);

  const analysis = await p.evaluate(() => {
    const allEls = document.querySelectorAll('*');
    const fontSet = new Set();
    const colorMap = {};

    function rgbToHex(rgb) {
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!m) return rgb;
      const r = parseInt(m[1]).toString(16).padStart(2, '0');
      const g = parseInt(m[2]).toString(16).padStart(2, '0');
      const b = parseInt(m[3]).toString(16).padStart(2, '0');
      return '#' + r + g + b;
    }

    allEls.forEach(el => {
      const cs = getComputedStyle(el);
      const font = cs.fontFamily;
      if (font) {
        fontSet.add(font.replace(/"/g, ''));
      }
      const color = cs.color;
      if (color && color.startsWith('rgb')) {
        const hex = rgbToHex(color);
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }
      const bg = cs.backgroundColor;
      if (bg && bg.startsWith('rgb') && bg !== 'rgba(0, 0, 0, 0)') {
        const hex = rgbToHex(bg);
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }
    });

    // 폰트 정리
    const fonts = Array.from(fontSet)
      .filter(f => f.includes('Pretendard') || f.includes('Noto') || f.includes('DM') || f.includes('Spoqa') || f.includes('sans') || f.includes('serif'))
      .slice(0, 8);

    // 컬러 정렬
    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 20);

    // 로고 찾기
    const logoImg = document.querySelector('img[alt*="AICUT"], img[alt*="aicut"], img[src*="logo"], img[src*="Logo"]');
    const logoSrc = logoImg ? logoImg.src : null;

    // Section 배경 분석
    const sections = document.querySelectorAll('section');
    const sectionInfo = Array.from(sections).slice(0, 3).map(sec => {
      const cs = getComputedStyle(sec);
      return {
        bg: cs.background.substring(0, 80),
        padding: cs.padding,
        height: cs.height
      };
    });

    // 버튼 스타일
    const btns = document.querySelectorAll('button, a[class*=btn], a[class*=button]');
    const btnStyle = btns.length > 0 ? (() => {
      const cs = getComputedStyle(btns[0]);
      return {
        bg: rgbToHex(cs.backgroundColor),
        color: rgbToHex(cs.color),
        radius: cs.borderRadius,
        padding: cs.padding
      };
    })() : null;

    return {
      fonts,
      topColors: sorted,
      logoSrc: logoSrc ? logoSrc.substring(0, 120) : 'not found',
      sectionInfo,
      btnStyle
    };
  });

  console.log(JSON.stringify(analysis, null, 2));
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

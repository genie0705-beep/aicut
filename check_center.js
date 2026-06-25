// HTML 이미지의 실제 렌더링 위치 분석 + 센터 보정
const { chromium } = require('playwright');
const fs = require('fs');

const DIR = 'C:/Users/paul/.openclaw/workspace';
const files = [
  'blog_img_shop.html',
  'blog_img_realestate.html',
  'blog_img_lawyer.html',
  'blog_img_hospital.html',
  'blog_img_edu.html',
  'blog_img_realestate2.html'
];

async function analyze(file, page) {
  const filePath = 'file:///' + DIR + '/' + file;
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Take a precise screenshot for analysis
  const screenshotPath = DIR + '/_analyze_' + file.replace('.html', '.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });

  // Get element positions
  const positions = await page.evaluate(() => {
    const card = document.querySelector('.card');
    if (!card) return null;

    const cr = card.getBoundingClientRect();
    const cw = cr.width;  // 700
    const ch = cr.height; // 700
    const centerX = cw / 2; // 350
    const centerY = ch / 2; // 350

    const elements = [
      { name: 'badge', el: document.querySelector('.badge') },
      { name: 'main', el: document.querySelector('.main') },
      { name: 'sub', el: document.querySelector('.sub') },
      { name: 'cta', el: document.querySelector('.cta') },
      { name: 'brand', el: document.querySelector('.brand') },
      { name: 'glow', el: document.querySelector('.glow') },
    ];

    const results = [];
    elements.forEach(item => {
      if (!item.el) return;
      const r = item.el.getBoundingClientRect();
      const elCenterX = r.left + r.width / 2;
      const elCenterY = r.top + r.height / 2;
      const offsetX = elCenterX - centerX;
      const offsetY = elCenterY - centerY;
      const leftMargin = r.left;
      const rightMargin = cw - r.right;

      results.push({
        name: item.name,
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
        centerOffsetX: Math.round(offsetX),
        centerOffsetY: Math.round(offsetY),
        leftMargin: Math.round(leftMargin),
        rightMargin: Math.round(rightMargin),
        marginDiff: Math.round(Math.abs(leftMargin - rightMargin))
      });
    });

    // Calculate total content bounding box
    const contentEls = ['.badge', '.main', '.sub', '.cta'].map(s => document.querySelector(s)).filter(Boolean);
    if (contentEls.length > 0) {
      let minY = Infinity, maxY = -Infinity;
      contentEls.forEach(el => {
        const r = el.getBoundingClientRect();
        minY = Math.min(minY, r.top);
        maxY = Math.max(maxY, r.bottom);
      });
      const contentHeight = maxY - minY;
      const contentCenterY = minY + contentHeight / 2;
      results.push({
        name: '!CONTENT_BLOCK',
        contentHeight: Math.round(contentHeight),
        centerOffsetY: Math.round(contentCenterY - centerY),
        topMargin: Math.round(minY),
        bottomMargin: Math.round(ch - maxY),
        marginDiff: Math.round(Math.abs(minY - (ch - maxY)))
      });
    }

    return { canvasW: cw, canvasH: ch, centerX, centerY, elements: results };
  });

  return { file, positions, screenshotPath };
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });

  console.log('📐 블로그 이미지 센터 정렬 분석\n');
  
  for (const file of files) {
    const result = await analyze(file, page);
    console.log('[' + file + ']');
    console.log('  캔버스: ' + result.positions.canvasW + '×' + result.positions.canvasH);
    
    result.positions.elements.forEach(el => {
      if (el.name.startsWith('!')) {
        console.log('  ' + el.name + ': 높이=' + el.contentHeight + 'px, ' +
          '수직센터차=' + (el.centerOffsetY >= 0 ? '+' : '') + el.centerOffsetY + 'px, ' +
          '상단=' + el.topMargin + 'px, 하단=' + el.bottomMargin + 'px, ' +
          '차이=' + el.marginDiff + 'px');
      } else {
        console.log('  ' + el.name.padEnd(12) + 
          ' x=' + el.x.toString().padStart(3) + ' y=' + el.y.toString().padStart(3) +
          ' w=' + el.w.toString().padStart(3) + ' h=' + el.h.toString().padStart(2) +
          ' | 가로센터=' + (el.centerOffsetX >= 0 ? '+' : '') + el.centerOffsetX + 'px' +
          ' | 좌여백=' + el.leftMargin + ' 우여백=' + el.rightMargin + ' diff=' + el.marginDiff);
      }
    });
    console.log('');
  }

  await page.close();
  await b.close();
})();

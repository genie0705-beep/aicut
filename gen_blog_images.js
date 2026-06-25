// 블로그 대표 이미지 생성 (700x700)
const { chromium } = require('playwright');
const path = require('path');

const DIR = 'C:/Users/paul/.openclaw/workspace';
const images = [
  { html: 'blog_img_shop.html', out: 'blog_img_shop.png', label: '쇼핑몰 숏폼 마케팅' },
  { html: 'blog_img_realestate.html', out: 'blog_img_realestate.png', label: '부동산 영상 마케팅' },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.setViewportSize({ width: 700, height: 700 });

  for (const img of images) {
    const filePath = `file:///${DIR}/${img.html}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);

    const outPath = path.join(DIR, img.out);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`✅ ${img.out} (${img.label})`);
  }

  await b.close();
  console.log('\n🎉 블로그 이미지 2장 생성 완료!');
  console.log(`위치: ${DIR}`);
})().catch(e => console.error('Fatal:', e.message));

const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');
const path = require('path');

const accent = '#a78bfa';
const accent2 = '#06b6d4';
const subtext = '#c0c0d0';
const gradient = 'linear-gradient(135deg, #0D1630 0%, #1a1f4e 50%, #0D1630 100%)';

(async () => {
  // 정사각형 1080x1080 대표 이미지 생성 (기존 스타일 유지)
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1080px;
    background: ${gradient};
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 80px; text-align: center; overflow: hidden;
  }
  .tag {
    background: ${accent}; color: #fff;
    padding: 14px 40px; border-radius: 30px;
    font-size: 26px; font-weight: 700;
    margin-bottom: 30px; letter-spacing: 1px;
  }
  h1 {
    color: #fff; font-size: 60px; font-weight: 900;
    line-height: 1.35; margin-bottom: 24px; word-break: keep-all;
  }
  .sub {
    color: ${subtext}; font-size: 26px;
    word-break: keep-all; line-height: 1.5;
  }
  .accent-text { color: ${accent2}; }
</style>
</head>
<body>
  <div class="tag">\uD83E\uDD16 AI \uC2DC\uB300\uC758 \uC601\uC0C1 \uD3B8\uC9D1</div>
  <h1>\"AI \uC601\uC0C1 \uD3B8\uC9D1\uC774 \uB300\uC138?\"<br><span class="accent-text">\uADF8\uB798\uB3C4 \uC804\uBB38 \uC5D0\uB514\uD130\uAC00</span><br>\uD544\uC694\uD55C \uC774\uC720</h1>
  <div class="sub">AI \uD234\uACFC \uC804\uB2F4 \uC5D0\uB514\uD130\uC758 \uCD5C\uC801 \uC870\uD569</div>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, '_temp_square.html'), html, 'utf-8');
  
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/_temp_square.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_ai_thumb_square.png', fullPage: false });
  console.log('✅ 정사각형 대표 이미지 생성 완료 (1080x1080)');
  fs.unlinkSync(path.join(__dirname, '_temp_square.html'));
  await b.close();
})();

const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; overflow: hidden;
    font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
  .card {
    width: 1080px; height: 1080px;
    background: linear-gradient(145deg, #0D1630 0%, #1a1f4e 100%);
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center; position: relative; overflow: hidden;
  }
  .g { position: absolute; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 65%);
    width: 700px; height: 700px; top: 50%; left: 50%;
    transform: translate(-50%, -50%); }
  .tag { color: #c4b5fd; font-size: 42px; font-weight: 700; letter-spacing: 2px;
    margin-bottom: 50px; z-index: 2; position: relative; }
  .main { color: #fff; font-size: 140px; font-weight: 900;
    line-height: 1.0; letter-spacing: -4px;
    z-index: 2; position: relative; word-break: keep-all; text-align: center;
    margin-bottom: 50px; }
  .main em { color: #a78bfa; font-style: normal; display: block; }
  .sub { color: rgba(255,255,255,0.7); font-size: 44px; font-weight: 500;
    line-height: 1.55; z-index: 2; position: relative; margin-bottom: 60px;
    word-break: keep-all; }
  .cta { background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: #fff;
    font-size: 40px; font-weight: 800; padding: 24px 70px; border-radius: 70px;
    z-index: 2; position: relative; letter-spacing: 1px; }
  .brand { position: absolute; right: 80px; bottom: 72px;
    color: rgba(255,255,255,0.35); font-size: 34px; font-weight: 900;
    letter-spacing: 4px; z-index: 2; }
</style>
</head>
<body>
<div class="card">
  <div class="g"></div>
  <div class="tag">AI \uc2dc\ub300\uc758 \uc601\uc0c1 \ud3b8\uc9d1</div>
  <div class="main">"AI \uc601\uc0c1<br><em>\ud3b8\uc9d1\uc774 \ub300\uc138?"</em></div>
  <div class="sub">\uadf8\ub798\ub3c4 \uc804\ubb38 \uc5d0\ub514\ud130\uac00<br>\ud544\uc694\ud55c \uc774\uc720</div>
  <div class="cta">\ubb34\ub8cc \uc0c1\ub2f4 \u2192</div>
  <div class="brand">AICUT</div>
</div>
</body>
</html>`;

(async () => {
  fs.writeFileSync('_temp_card.html', html);
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/_temp_card.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'aicut_blog_ai_thumb_square.png', fullPage: false });
  console.log('✅');
  fs.unlinkSync('_temp_card.html');
  await b.close();
})();

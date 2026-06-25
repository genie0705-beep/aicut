const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;

async function makeInstaImage() {
  const W = 1080, H = 1080;
  const theme = {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    badgeBg: 'rgba(167,139,250,0.15)',
    badgeColor: '#a78bfa',
    badgeBorder: 'rgba(167,139,250,0.3)',
    textColor: '#fff',
    accent: '#a78bfa',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#5c3de8',
    ctaTo: '#7c5cf6',
  };

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; margin: 0 auto;
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
  .card { width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
    background: ${theme.bg};
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; padding: 80px; }
  .glow { position: absolute; border-radius: 50%;
    background: radial-gradient(circle, ${theme.glow} 0%, transparent 60%);
    width: 640px; height: 640px;
    top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .badge { display: inline-block; background: ${theme.badgeBg};
    color: ${theme.badgeColor}; font-size: 22px; font-weight: 700; padding: 10px 28px;
    border: 1px solid ${theme.badgeBorder}; border-radius: 30px;
    margin-bottom: 36px; z-index: 2; position: relative; }
  .main { color: ${theme.textColor}; font-size: 54px; font-weight: 800; line-height: 1.35;
    z-index: 2; position: relative; margin-bottom: 20px;
    word-break: keep-all; letter-spacing: -1.5px; }
  .main em { color: ${theme.accent}; font-style: normal; }
  .sub { color: ${theme.subColor}; font-size: 24px; font-weight: 500; line-height: 1.5;
    z-index: 2; position: relative; margin-bottom: 40px; word-break: keep-all;
    max-width: 850px; }
  .cta { background: linear-gradient(135deg, ${theme.ctaFrom}, ${theme.ctaTo}); color: #fff;
    font-size: 24px; font-weight: 700; padding: 16px 56px; border-radius: 50px;
    z-index: 2; position: relative; display: inline-block; }
  .brand { position: absolute; bottom: 36px; right: 40px; color: rgba(255,255,255,0.25);
    font-size: 16px; font-weight: 700; z-index: 2; letter-spacing: 2px; }
</style>
</head>
<body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">📅 하반기 마케팅 전략</div>
  <div class="main">하반기 마케팅,\n지금 <em>영상 편집 외주</em>를\n정해야 하는 이유</div>
  <div class="sub">6월이 완벽한 타이밍인 3가지 이유<br>① 물량 선점 ② 꾸준함이 경쟁력 ③ 시행착오 줄이기</div>
  <div class="cta">🔗 프로필 링크에서 확인</div>
  <div class="brand">AICUT</div>
</div>
</body>
</html>`;

  const tmpFile = path.join(__dirname, '_tmp_insta.html');
  fs.writeFileSync(tmpFile, html);

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });

  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000);

  const outPath = path.join(__dirname, 'insta_h2_thumb.png');
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await page.close();
  await b.close();
  fs.unlinkSync(tmpFile);

  return { file: 'insta_h2_thumb.png', sizeKB: Math.round(size / 1024) };
}

(async () => {
  console.log('인스타그램 이미지 생성...');
  const r = await makeInstaImage();
  console.log(`✅ 생성 완료: ${r.file} (${r.sizeKB}KB)`);
})();

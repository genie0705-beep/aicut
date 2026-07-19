// 블로그 이미지 생성기 — 커스텀 HTML, CTA 조건부 렌더링
// 사용법: node _blog_gen_images.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;

const THEMES = {
  dark_purple: {
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
  },
  light_cyan: {
    bg: 'linear-gradient(160deg, #f9fafb, #f0f2f5, #e8ecf5)',
    glow: 'rgba(6,182,212,0.25)',
    badgeBg: 'rgba(6,182,212,0.1)',
    badgeColor: '#0891b2',
    badgeBorder: 'rgba(6,182,212,0.25)',
    textColor: '#0f172a',
    accent: '#06b6d4',
    subColor: 'rgba(15,23,42,0.5)',
    ctaFrom: '#06b6d4',
    ctaTo: '#5c3de8',
  },
  dark_green: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)',
    glow: 'rgba(52,211,153,0.35)',
    badgeBg: 'rgba(52,211,153,0.15)',
    badgeColor: '#34d399',
    badgeBorder: 'rgba(52,211,153,0.3)',
    textColor: '#fff',
    accent: '#34d399',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#059669',
    ctaTo: '#34d399',
  }
};

async function generateImage(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const W = opt.width || 700;
  const H = opt.height || 700;
  const hasCTA = opt.showCTA !== false;

  const ctaHtml = hasCTA
    ? `<div class="cta">${opt.cta || 'AICUT 무료상담 →'}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; margin: 0 auto;
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
  .card { width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
    background: ${T.bg};
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; padding: ${H <= 350 ? 30 : 50}px; }
  .glow { position: absolute; border-radius: 50%;
    background: radial-gradient(circle, ${T.glow} 0%, transparent 60%);
    width: ${Math.round(W * 0.64)}px; height: ${Math.round(W * 0.64)}px;
    top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .badge { display: inline-block; background: ${T.badgeBg};
    color: ${T.badgeColor}; font-size: ${H <= 400 ? 13 : 17}px; font-weight: 700;
    padding: ${H <= 400 ? '4px 14px' : '6px 20px'};
    border: 1px solid ${T.badgeBorder}; border-radius: 30px;
    margin-bottom: ${H <= 400 ? 12 : 24}px; z-index: 2; position: relative; }
  .main { color: ${T.textColor}; font-size: ${H <= 400 ? 26 : W >= 700 ? 46 : 34}px;
    font-weight: 800; line-height: 1.35;
    z-index: 2; position: relative; margin-bottom: ${H <= 400 ? 8 : 14}px;
    word-break: keep-all; letter-spacing: -1px; }
  .main em { color: ${T.accent}; font-style: normal; }
  .sub { color: ${T.subColor}; font-size: ${H <= 400 ? 13 : W >= 700 ? 18 : 16}px;
    font-weight: 500; line-height: 1.4;
    z-index: 2; position: relative; margin-bottom: ${hasCTA ? (H <= 400 ? 12 : 24) : 0}px;
    word-break: keep-all; }
  .cta { background: linear-gradient(135deg, ${T.ctaFrom}, ${T.ctaTo}); color: #fff;
    font-size: ${H <= 400 ? 15 : 18}px; font-weight: 700; padding: ${H <= 400 ? '10px 32px' : '12px 40px'};
    border-radius: 50px;
    z-index: 2; position: relative; display: inline-block; }
</style>
</head>
<body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${opt.badge}</div>
  <div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${opt.sub}</div>
  ${ctaHtml}
</div>
</body>
</html>`;

  const tmpFile = path.join(__dirname, '_tmp_' + path.basename(opt.out));
  fs.writeFileSync(tmpFile, html);

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });

  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);

  const outPath = path.join(__dirname, opt.out);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await page.close();
  // Don't close browser - just disconnect

  fs.unlinkSync(tmpFile);

  return { file: opt.out, sizeKB: Math.round(size / 1024), w: W, h: H };
}

async function main() {
  const images = [
    // 1. 대표 이미지 (700×700, dark_purple, CTA 유지)
    {
      theme: 'dark_purple', width: 700, height: 700, showCTA: true,
      badge: '☀️ 2026년 장마기간',
      main: '장마가 끝나면\n<em>하반기</em>가 시작됩니다\n지금 준비하세요',
      sub: '하반기 영상 마케팅, 장마철이 골든타임입니다',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_main_rainy.png'
    },
    // 2. 본문카드 1 — 문제제기 (600×338, light_cyan, CTA 제거)
    {
      theme: 'light_cyan', width: 600, height: 338, showCTA: false,
      badge: '🌧️ 장마 VS 마케팅',
      main: '장마 시즌,\n<em>마케팅 공백</em>을\n걱정하시나요?',
      sub: '7월 장마, 8월 폭염... 하반기 준비는 지금부터',
      out: 'aicut_body1_rainy.png'
    },
    // 3. 본문카드 2 — 장마기간 정보 (600×338, dark_purple, CTA 제거)
    {
      theme: 'dark_purple', width: 600, height: 338, showCTA: false,
      badge: '📋 2026년 장마기간',
      main: '<em>2026년 장마</em>\n예상 기간과\n마케팅 전략',
      sub: '중부 6/25~7/26, 남부 6/22~7/24, 영동 6/26~7/29',
      out: 'aicut_body2_rainy.png'
    },
    // 4. 본문카드 3 — 업종별 전략 (600×338, light_cyan, CTA 제거)
    {
      theme: 'light_cyan', width: 600, height: 338, showCTA: false,
      badge: '🎯 업종별 전략',
      main: 'FP·부동산·병원·교육\n<em>업종별 맞춤</em>\n영상 마케팅',
      sub: '각 업종 특성에 맞춘 하반기 숏폼 전략 가이드',
      out: 'aicut_body3_rainy.png'
    },
    // 5. CTA 카드 (600×338, dark_green, CTA 유지)
    {
      theme: 'dark_green', width: 600, height: 338, showCTA: true,
      badge: '✅ 지금 시작하세요',
      main: '하반기 마케팅,\n<em>지금 준비</em>해야\n성과가 다릅니다',
      sub: '무료 상담으로 시작해보세요',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_cta_rainy.png'
    }
  ];

  console.log('=== 블로그 이미지 생성 시작 ===');
  for (const img of images) {
    try {
      const r = await generateImage(img);
      console.log(`✅ ${r.file} (${r.w}×${r.h}, ${r.sizeKB}KB)`);
    } catch (e) {
      console.error(`❌ ${img.out}: ${e.message}`);
    }
  }
  console.log('=== 이미지 생성 완료 ===');
}

main().catch(e => console.error('FATAL:', e.message));

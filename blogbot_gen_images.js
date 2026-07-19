// 이미지 생성 전용 - headless Chromium 사용
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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

async function makeImage(opt) {
  const T = THEMES[opt.theme];
  const W = opt.width || 700;
  const H = opt.height || 700;
  const hasCta = opt.cta && opt.cta.length > 0;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; margin: 0; font-family: 'Noto Sans KR', sans-serif; }
  .card { width: ${W}px; height: ${H}px; position: relative; overflow: hidden; background: ${T.bg};
    display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; }
  .glow { position: absolute; border-radius: 50%; background: radial-gradient(circle, ${T.glow} 0%, transparent 60%);
    width: ${Math.round(W * 0.64)}px; height: ${Math.round(W * 0.64)}px; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .badge { display: inline-block; background: ${T.badgeBg}; color: ${T.badgeColor}; font-size: ${H <= 350 ? 13 : 16}px; font-weight: 700;
    padding: ${H <= 350 ? '4px 14px' : '6px 20px'}; border: 1px solid ${T.badgeBorder}; border-radius: 30px;
    margin-bottom: ${H <= 350 ? 12 : 22}px; z-index: 2; position: relative; }
  .main { color: ${T.textColor}; font-size: ${H <= 350 ? 24 : H <= 450 ? 32 : 42}px; font-weight: 800; line-height: 1.35;
    z-index: 2; position: relative; margin-bottom: ${hasCta ? (H <= 350 ? 8 : 12) : 0}px;
    word-break: keep-all; letter-spacing: -0.5px; }
  .main em { color: ${T.accent}; font-style: normal; }
  .sub { color: ${T.subColor}; font-size: ${H <= 350 ? 13 : H <= 450 ? 15 : 18}px; font-weight: 500; line-height: 1.4;
    z-index: 2; position: relative; margin-bottom: ${hasCta ? (H <= 350 ? 12 : 24) : 4}px; word-break: keep-all; }
  .cta { background: linear-gradient(135deg, ${T.ctaFrom}, ${T.ctaTo}); color: #fff;
    font-size: ${H <= 350 ? 14 : 18}px; font-weight: 700; padding: ${H <= 350 ? '10px 32px' : '12px 40px'};
    border-radius: 50px; z-index: 2; position: relative; display: ${hasCta ? 'inline-block' : 'none'}; }
</style>
</head>
<body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${opt.badge}</div>
  <div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${opt.sub}</div>
  <div class="cta">${hasCta ? opt.cta : ''}</div>
</div>
</body>
</html>`;

  const tmpFile = path.join('C:\\Users\\paul\\.openclaw\\workspace', '_tmp_gen_img.html');
  fs.writeFileSync(tmpFile, html);

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\paul\\AppData\\Local\\ms-playwright\\chromium-1217\\chrome-win64\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);

  const outPath = path.join('C:\\Users\\paul\\.openclaw\\workspace', opt.out);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await browser.close();
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

  return { file: opt.out, sizeKB: Math.round(size / 1024) };
}

const imageConfigs = [
  {
    label: '대표 이미지',
    out: 'aicut_implant_main.png',
    theme: 'dark_purple',
    width: 700, height: 700,
    badge: '🦷 치과 마케팅',
    main: '치과 임플란트 마케팅,\n하반기 준비는\n<em>영상 콘텐츠</em>로\n시작하세요',
    sub: '환자 신뢰는 영상이 만든다',
    cta: 'AICUT 무료상담 →'
  },
  {
    label: '본문카드1',
    out: 'aicut_implant_card1.png',
    theme: 'light_cyan',
    width: 600, height: 338,
    badge: '📋 신뢰 마케팅',
    main: '<em>임플란트 수술 영상</em>이\n주는 신뢰감',
    sub: '직접 보여주는 것이 가장 강력한 마케팅',
    cta: ''
  },
  {
    label: '본문카드2',
    out: 'aicut_implant_card2.png',
    theme: 'light_cyan',
    width: 600, height: 338,
    badge: '✂️ 편집 아웃소싱',
    main: '영상 편집 아웃소싱,\n<em>에이컷</em>이 해결합니다',
    sub: '촬영은 원장님, 편집은 에이컷',
    cta: ''
  },
  {
    label: '본문카드3',
    out: 'aicut_implant_card3.png',
    theme: 'light_cyan',
    width: 600, height: 338,
    badge: '📅 하반기 준비',
    main: '하반기 치과 마케팅,\n<em>지금 준비</em>해야 하는\n이유',
    sub: '경쟁 병원보다 한 발 먼저 준비하세요',
    cta: ''
  },
  {
    label: 'CTA 이미지',
    out: 'aicut_implant_cta.png',
    theme: 'dark_green',
    width: 500, height: 300,
    badge: '💬 지금 시작하세요',
    main: '지금 바로\n<em>시작</em>하세요',
    sub: '무료 상담으로 부담 없이 시작해보세요',
    cta: 'AICUT 무료상담 →'
  }
];

(async () => {
  console.log('=== 이미지 생성 시작 (5장) ===');
  for (const cfg of imageConfigs) {
    console.log(`\n📸 ${cfg.label} 생성 중... (${cfg.width}x${cfg.height}, ${cfg.theme})`);
    try {
      const result = await makeImage(cfg);
      console.log(`   ✅ ${result.file} (${result.sizeKB}KB)`);
    } catch (e) {
      console.error(`   ❌ 실패: ${e.message}`);
    }
  }
  console.log('\n✅ 모든 이미지 생성 완료');
})();

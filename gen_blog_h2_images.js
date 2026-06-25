// 블로그 이미지 5장 생성 (수정된 image_gen.js 방식 활용)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = process.env.CDP_PORT || 9224;

// 테마 색상
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
  },
};

async function makeImage(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const W = opt.width || 700;
  const H = opt.height || 700;

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
    text-align: center; padding: ${H <= 450 ? 40 : 60}px; }
  .glow { position: absolute; border-radius: 50%;
    background: radial-gradient(circle, ${T.glow} 0%, transparent 60%);
    width: ${Math.round(W * 0.64)}px; height: ${Math.round(W * 0.64)}px;
    top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .badge { display: inline-block; background: ${T.badgeBg};
    color: ${T.badgeColor}; font-size: ${H <= 450 ? 13 : 16}px; font-weight: 700; padding: ${H <= 450 ? '4px 14px' : '6px 20px'};
    border: 1px solid ${T.badgeBorder}; border-radius: 30px;
    margin-bottom: ${H <= 450 ? 12 : 24}px; z-index: 2; position: relative; }
  .main { color: ${T.textColor}; font-size: ${H <= 450 ? 28 : W <= 700 ? 40 : 44}px; font-weight: 800; line-height: 1.35;
    z-index: 2; position: relative; margin-bottom: ${H <= 450 ? 8 : 14}px;
    word-break: keep-all; letter-spacing: -1px; }
  .main em { color: ${T.accent}; font-style: normal; }
  .sub { color: ${T.subColor}; font-size: ${H <= 450 ? 14 : 18}px; font-weight: 500; line-height: 1.5;
    z-index: 2; position: relative; margin-bottom: ${H <= 450 ? 14 : 28}px; word-break: keep-all; }
  .cta { background: linear-gradient(135deg, ${T.ctaFrom}, ${T.ctaTo}); color: #fff;
    font-size: ${H <= 450 ? 16 : 20}px; font-weight: 700; padding: ${H <= 450 ? '10px 36px' : '14px 48px'}; border-radius: 50px;
    z-index: 2; position: relative; display: inline-block; }
</style>
</head>
<body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${opt.badge}</div>
  <div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${opt.sub}</div>
  <div class="cta">${opt.cta || 'AICUT 무료상담 →'}</div>
</div>
</body>
</html>`;

  const tmpFile = path.join(__dirname, '_tmp_gen_blog.html');
  fs.writeFileSync(tmpFile, html);

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  if (!ctx) { console.log('  ⚠️ no context, creating new...'); ctx = await b.newContext(); }
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });

  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000); // 3초 충분히 대기

  const outPath = path.join(__dirname, opt.out);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await page.close();
  await b.close();
  fs.unlinkSync(tmpFile);

  return { file: opt.out, sizeKB: Math.round(size / 1024) };
}

// 이미지 5장 생성
const images = [
  {
    // 1. 대표 이미지 (700x700)
    theme: 'dark_purple',
    width: 700, height: 700,
    badge: '📅 하반기 마케팅 전략',
    main: '하반기 마케팅,\n지금 <em>영상 편집 외주</em>를\n정해야 하는 이유',
    sub: '6월이 완벽한 타이밍인 3가지 이유',
    cta: 'AICUT 무료상담 →',
    out: 'aicut_blog_h2_thumb.png'
  },
  {
    // 2. 릴스 알고리즘 (800x450)
    theme: 'light_cyan',
    width: 800, height: 450,
    badge: '🎯 숏폼 마케팅 트렌드',
    main: '<em>릴스 알고리즘</em> 2026,\n조회수가 아니라\n참여도가 답이다',
    sub: '변화하는 숏폼 마케팅, 꾸준함이 경쟁력',
    cta: 'AICUT에 맡기기 →',
    out: 'aicut_blog_h2_reels.png'
  },
  {
    // 3. AI vs 전문가 (800x450)
    theme: 'dark_green',
    width: 800, height: 450,
    badge: '🤖 AI 영상 편집 시대',
    main: 'AI가 다 해준다는데,\n왜 <em>전문 에디터</em>가\n필요할까?',
    sub: '템플릿을 벗어난 브랜디드 콘텐츠의 힘',
    cta: '차이를 경험하세요 →',
    out: 'aicut_blog_h2_ai.png'
  },
  {
    // 4. 지금 시작해야 하는 이유 (800x450)
    theme: 'dark_purple',
    width: 800, height: 450,
    badge: '✅ 하반기 준비 체크리스트',
    main: '지금 외주사를 정해야 하는\n<em>3가지 이유</em>',
    sub: '①물량 선점 ②꾸준함이 경쟁력 ③시행착오 줄이기',
    cta: '지금 상담 시작 →',
    out: 'aicut_blog_h2_reasons.png'
  },
  {
    // 5. CTA (800x450)
    theme: 'light_cyan',
    width: 800, height: 450,
    badge: '💡 영상 편집 아웃소싱',
    main: '7월부터 정기 납품,\n지금 준비하세요',
    sub: '촬영본만 보내시면 됩니다 ✨',
    cta: '카카오톡 무료상담 →',
    out: 'aicut_blog_h2_cta.png'
  }
];

(async () => {
  console.log('=== 블로그 이미지 5장 생성 시작 ===\n');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`[${i+1}/5] ${img.out} (${img.width}x${img.height})...`);
    try {
      const result = await makeImage(img);
      console.log(`  ✅ 생성 완료: ${result.file} (${result.sizeKB}KB)`);
    } catch (e) {
      console.log(`  ❌ 실패: ${e.message}`);
    }
  }
  console.log('\n=== 모든 이미지 생성 완료 ===');
})();

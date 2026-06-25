// 📸 AICUT 블로그 이미지 생성기 (확정 방식)
// =============================================
// 사용법:
//   node skills/image_gen.js --topic="쇼핑몰" --out="aicut_blog_shop.png"
//
// ※ 파일명에 aicut_ prefix 필수 (운영 정책)
//
// PC에 Noto Sans KR 폰트 설치 필수!
// CDN 링크 사용 금지 (file:// 에서 충돌)
// =============================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// === 테마 팔레트 ===
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
    accent2: '#a78bfa',
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
    accent2: '#06b6d4',
  },
  light_pink: {
    bg: 'linear-gradient(160deg, #f9fafb, #f0f2f5, #fce7f3)',
    glow: 'rgba(236,72,153,0.2)',
    badgeBg: 'rgba(236,72,153,0.1)',
    badgeColor: '#db2777',
    badgeBorder: 'rgba(236,72,153,0.25)',
    textColor: '#0f172a',
    accent: '#db2777',
    subColor: 'rgba(15,23,42,0.5)',
    ctaFrom: '#db2777',
    ctaTo: '#5c3de8',
    accent2: '#db2777',
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
    accent2: '#34d399',
  }
};

/**
 * 이미지 1장 생성
 * @param {object} opt - { theme, badge, main, em, sub, cta, out, width, height }
 */
async function makeImage(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const W = opt.width || 700;
  const H = opt.height || 700;

  // 깨끗한 HTML 생성 (편집 이력 없음, CDN 링크 없음)
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; margin: 0 auto;
    font-family: 'Noto Sans KR', sans-serif; }
  .card { width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
    background: ${T.bg};
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; padding: 60px; }
  .glow { position: absolute; border-radius: 50%;
    background: radial-gradient(circle, ${T.glow} 0%, transparent 60%);
    width: ${Math.round(W * 0.64)}px; height: ${Math.round(W * 0.64)}px;
    top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .badge { display: inline-block; background: ${T.badgeBg};
    color: ${T.badgeColor}; font-size: ${H <= 450 ? 14 : 18}px; font-weight: 700; padding: ${H <= 450 ? '4px 16px' : '8px 24px'};
    border: 1px solid ${T.badgeBorder}; border-radius: 30px;
    margin-bottom: ${H <= 450 ? 14 : 28}px; z-index: 2; position: relative; }
  .main { color: ${T.textColor}; font-size: ${H <= 450 ? 32 : 48}px; font-weight: 800; line-height: 1.35;
    z-index: 2; position: relative; margin-bottom: ${H <= 450 ? 10 : 16}px;
    word-break: keep-all; letter-spacing: -1px; }
  .main em { color: ${T.accent}; font-style: normal; }
  .sub { color: ${T.subColor}; font-size: ${H <= 450 ? 15 : 20}px; font-weight: 500; line-height: 1.4;
    z-index: 2; position: relative; margin-bottom: ${H <= 450 ? 16 : 32}px; word-break: keep-all; }
  .cta { background: linear-gradient(135deg, ${T.ctaFrom}, ${T.ctaTo}); color: #fff;
    font-size: 20px; font-weight: 700; padding: 14px 48px; border-radius: 50px;
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

  const tmpFile = path.join(__dirname, '..', '_tmp_gen.html');
  fs.writeFileSync(tmpFile, html);

  var cdpPort = process.env.CDP_PORT || 9223;
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + cdpPort);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });

  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);

  const outPath = path.join(__dirname, '..', opt.out);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await page.close();
  await b.close();
  fs.unlinkSync(tmpFile);

  return { file: opt.out, sizeKB: Math.round(size / 1024) };
}

// 명령행 실행 지원
if (require.main === module) {
  const args = {};
  process.argv.slice(2).forEach(a => {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  });

  const topic = args.topic || '테스트';
  const configs = {
    쇼핑몰:    { theme: 'dark_purple',  badge: '🛒 이커머스 마케팅',  main: '쇼핑몰·스마트스토어\n운영자라면\n<em>숏폼 마케팅</em>에\n주목해야 하는 이유',  sub: '영상 하나가 전환율을 바꾼다' },
    부동산:    { theme: 'light_cyan',   badge: '🏢 부동산 마케팅',   main: '부동산 중개사·\n공인중개사라면\n<em>영상 마케팅</em>을\n시작해야 하는 이유', sub: '매물 영상 하나면 계약까지 반으로' },
    변호사:    { theme: 'dark_purple',  badge: '⚖️ 전문직 마케팅',   main: '변호사·세무사·\n보험설계사라면\n<em>영상 마케팅</em>을\n고민해야 하는 이유', sub: '신뢰는 텍스트가 아니라 영상으로 쌓인다' },
    병원:      { theme: 'light_pink',   badge: '🏥 의료 마케팅',     main: '병원·의원 원장님이라면\n<em>영상 편집</em> 아웃소싱이\n답인 이유',       sub: '원장님이 직접 찍은 영상, 편집은 에이컷에' },
    교육:      { theme: 'dark_green',   badge: '📚 교육 콘텐츠',     main: '온라인 강의·\n교육 콘텐츠 창작자라면\n<em>영상 편집</em>이 필요한 이유', sub: '강의 퀄리티는 편집이 결정한다' },
    부동산2:   { theme: 'light_cyan',   badge: '🏢 부동산 마케팅',   main: '매물 영상 올리다\n지쳐버린 중개법인이\n<em>월 20편 정시 납품</em>으로\n바꾼 방법', sub: '반복되는 촬영·편집, 이제 아웃소싱하세요' },
  };

  const cfg = configs[topic];
  if (!cfg) {
    console.log('사용법: node skills/image_gen.js --topic=쇼핑몰');
    console.log('지원 토픽:', Object.keys(configs).join(', '));
    process.exit(1);
  }

  makeImage({ ...cfg, out: args.out || ('aicut_blog_' + topic + '.png') })
    .then(r => console.log('✅ 생성 완료:', r.file, '(' + r.sizeKB + 'KB)'))
    .catch(e => console.error('❌ 실패:', e.message));
}

module.exports = { makeImage, THEMES };

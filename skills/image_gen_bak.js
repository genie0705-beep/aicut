// ?벝 AICUT 釉붾줈洹??대?吏 ?앹꽦湲?(?뺤젙 諛⑹떇)
// =============================================
// ?ъ슜踰?
//   node skills/image_gen.js --topic="?쇳븨紐? --out="aicut_blog_shop.png"
//
// ???뚯씪紐낆뿉 aicut_ prefix ?꾩닔 (?댁쁺 ?뺤콉)
//
// PC??Noto Sans KR ?고듃 ?ㅼ튂 ?꾩닔!
// CDN 留곹겕 ?ъ슜 湲덉? (file:// ?먯꽌 異⑸룎)
// =============================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// === ?뚮쭏 ?붾젅??===
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
 * ?대?吏 1???앹꽦
 * @param {object} opt - { theme, badge, main, em, sub, cta, out, width, height }
 */
async function makeImage(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const W = opt.width || 700;
  const H = opt.height || 700;

  // 源⑤걮??HTML ?앹꽦 (?몄쭛 ?대젰 ?놁쓬, CDN 留곹겕 ?놁쓬)
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
  <div class="cta">${opt.cta || 'AICUT 臾대즺?곷떞 ??}</div>
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

// 紐낅졊???ㅽ뻾 吏??if (require.main === module) {
  const args = {};
  process.argv.slice(2).forEach(a => {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  });

  const topic = args.topic || '?뚯뒪??;
  const configs = {
    ?쇳븨紐?    { theme: 'dark_purple',  badge: '?썟 ?댁빱癒몄뒪 留덉???,  main: '?쇳븨紐걔룹뒪留덊듃?ㅽ넗??n?댁쁺?먮씪硫?n<em>?륂뤌 留덉???/em>??n二쇰ぉ?댁빞 ?섎뒗 ?댁쑀',  sub: '?곸긽 ?섎굹媛 ?꾪솚?⑥쓣 諛붽씔?? },
    遺?숈궛:    { theme: 'light_cyan',   badge: '?룫 遺?숈궛 留덉???,   main: '遺?숈궛 以묎컻???n怨듭씤以묎컻?щ씪硫?n<em>?곸긽 留덉???/em>??n?쒖옉?댁빞 ?섎뒗 ?댁쑀', sub: '留ㅻЪ ?곸긽 ?섎굹硫?怨꾩빟源뚯? 諛섏쑝濡? },
    蹂?몄궗:    { theme: 'dark_purple',  badge: '?뽳툘 ?꾨Ц吏?留덉???,   main: '蹂?몄궗쨌?몃Т???n蹂댄뿕?ㅺ퀎?щ씪硫?n<em>?곸긽 留덉???/em>??n怨좊??댁빞 ?섎뒗 ?댁쑀', sub: '?좊ː???띿뒪?멸? ?꾨땲???곸긽?쇰줈 ?볦씤?? },
    蹂묒썝:      { theme: 'light_pink',   badge: '?룯 ?섎즺 留덉???,     main: '蹂묒썝쨌?섏썝 ?먯옣?섏씠?쇰㈃\n<em>?곸긽 ?몄쭛</em> ?꾩썐?뚯떛??n?듭씤 ?댁쑀',       sub: '?먯옣?섏씠 吏곸젒 李띿? ?곸긽, ?몄쭛? ?먯씠而룹뿉' },
    援먯쑁:      { theme: 'dark_green',   badge: '?뱴 援먯쑁 肄섑뀗痢?,     main: '?⑤씪??媛뺤쓽쨌\n援먯쑁 肄섑뀗痢?李쎌옉?먮씪硫?n<em>?곸긽 ?몄쭛</em>???꾩슂???댁쑀', sub: '媛뺤쓽 ?꾨━?곕뒗 ?몄쭛??寃곗젙?쒕떎' },
    遺?숈궛2:   { theme: 'light_cyan',   badge: '?룫 遺?숈궛 留덉???,   main: '留ㅻЪ ?곸긽 ?щ━??n吏爾먮쾭由?以묎컻踰뺤씤??n<em>??20???뺤떆 ?⑺뭹</em>?쇰줈\n諛붽씔 諛⑸쾿', sub: '諛섎났?섎뒗 珥ъ쁺쨌?몄쭛, ?댁젣 ?꾩썐?뚯떛?섏꽭?? },
  };

  const cfg = configs[topic];
  if (!cfg) {
    console.log('?ъ슜踰? node skills/image_gen.js --topic=?쇳븨紐?);
    console.log('吏???좏뵿:', Object.keys(configs).join(', '));
    process.exit(1);
  }

  makeImage({ ...cfg, out: args.out || ('aicut_blog_' + topic + '.png') })
    .then(r => console.log('???앹꽦 ?꾨즺:', r.file, '(' + r.sizeKB + 'KB)'))
    .catch(e => console.error('???ㅽ뙣:', e.message));
}

module.exports = { makeImage, THEMES };

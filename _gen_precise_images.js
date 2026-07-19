const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const THEMES = {
  dark_purple: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.55)',
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
    bg: 'linear-gradient(160deg, #f0f4f8, #e8ecf5, #dce5f5)',
    glow: 'rgba(6,182,212,0.18)',
    badgeBg: 'rgba(6,182,212,0.1)',
    badgeColor: '#0891b2',
    badgeBorder: 'rgba(6,182,212,0.25)',
    textColor: '#0f172a',
    accent: '#0891b2',
    subColor: 'rgba(15,23,42,0.5)',
    ctaFrom: '#0891b2',
    ctaTo: '#5c3de8',
  },
  light_pink: {
    bg: 'linear-gradient(160deg, #faf5f7, #f8edf5, #fce7f3)',
    glow: 'rgba(236,72,153,0.16)',
    badgeBg: 'rgba(236,72,153,0.1)',
    badgeColor: '#db2777',
    badgeBorder: 'rgba(236,72,153,0.25)',
    textColor: '#0f172a',
    accent: '#db2777',
    subColor: 'rgba(15,23,42,0.5)',
    ctaFrom: '#db2777',
    ctaTo: '#5c3de8',
  },
  dark_green: {
    bg: 'linear-gradient(160deg, #0a1628, #0f2847, #064e3b)',
    glow: 'rgba(52,211,153,0.3)',
    badgeBg: 'rgba(52,211,153,0.15)',
    badgeColor: '#34d399',
    badgeBorder: 'rgba(52,211,153,0.3)',
    textColor: '#fff',
    accent: '#34d399',
    subColor: 'rgba(255,255,255,0.65)',
    ctaFrom: '#059669',
    ctaTo: '#34d399',
  }
};

function makeHTML(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const W = opt.width || 700;
  const H = opt.height || 700;
  const isCard = W > H; // 700x400 = card

  // REF 분석 기반 비율 (700x700 main 기준):
  // badge: 19%, main text: 30~52%, sub: 59~62%, cta: 63~65%, bottom padding: 20%
  // 700x400 card: badge: 15%, main text: 30~55%, cta: 63%, bottom padding: 21%

  let badgeMt, badgeFont, mainFont, mainMt, mainMb, subFont, subMb, ctaFont, ctaP, ctaMb, glowSize;

  if (isCard) {
    badgeMt = Math.round(H * 0.10);    // 10% top margin for badge
    badgeFont = 14;
    mainFont = 34;
    mainMt = Math.round(H * 0.07);      // 7% after badge
    mainMb = Math.round(H * 0.04);      // 4% before sub
    subFont = 15;
    subMb = Math.round(H * 0.06);       // 6% before cta
    ctaFont = 15;
    ctaP = '10px 36px';
    ctaMb = Math.round(H * 0.10);       // 10% bottom
    glowSize = Math.round(W * 0.9);
  } else {
    // 700x700 square (main)
    badgeMt = Math.round(H * 0.13);    // 13% top margin
    badgeFont = 15;
    mainFont = 42;
    mainMt = Math.round(H * 0.08);      // 8%
    mainMb = Math.round(H * 0.05);      // 5%
    subFont = 17;
    subMb = Math.round(H * 0.07);       // 7%
    ctaFont = 16;
    ctaP = '12px 42px';
    ctaMb = Math.round(H * 0.12);       // 12% bottom
    glowSize = Math.round(W * 0.85);
  }

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg}}
.card{width:${W}px;height:${H}px;position:relative;overflow:hidden;
  background:${T.bg};display:flex;flex-direction:column;align-items:center;
  text-align:center;padding:0;}
.glow{position:absolute;border-radius:50%;
  background:radial-gradient(circle,${T.glow} 0%,transparent 60%);
  width:${glowSize}px;height:${glowSize}px;
  top:35%;left:50%;transform:translate(-50%,-50%);}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};
  font-size:${badgeFont}px;font-weight:700;padding:6px 20px;
  border:1px solid ${T.badgeBorder};border-radius:30px;
  z-index:2;position:relative;margin-top:${badgeMt}px;
  letter-spacing:-0.3px;backdrop-filter:blur(1px);}
.main{color:${T.textColor};font-size:${mainFont}px;font-weight:800;line-height:1.35;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.5px;max-width:90%;
  margin-top:${mainMt}px;margin-bottom:${mainMb}px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${subFont}px;font-weight:400;line-height:1.45;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.2px;max-width:85%;
  margin-bottom:${subMb}px;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;
  font-size:${ctaFont}px;font-weight:700;padding:${ctaP};
  border-radius:50px;z-index:2;position:relative;display:inline-block;
  letter-spacing:-0.3px;margin-bottom:${ctaMb}px;
  box-shadow:0 2px 16px rgba(92,61,232,0.25);}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${opt.badge}</div>
  <div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${opt.sub}</div>
  <div class="cta">${opt.cta || 'AICUT 무료상담 →'}</div>
</div></body></html>`;
}

async function makeCard(opt) {
  const W = opt.width || 700;
  const H = opt.height || 700;
  const html = makeHTML(opt);
  const tmpFile = path.join(__dirname, '_tmp_card.html');
  fs.writeFileSync(tmpFile, html);

  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
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
  await b.close();
  fs.unlinkSync(tmpFile);
  return { file: opt.out, sizeKB: Math.round(size / 1024) };
}

async function main() {
  const imgs = [
    // Main 700x700 — dark_purple
    { theme: 'dark_purple', badge: '🏢 분양 마케팅',
      main: '분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
      sub: '직접 부딪힌 3개월, 솔직한 후기', cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_estate_main.png', width: 700, height: 700 },
    // Cycle 700x400 — light_cyan
    { theme: 'light_cyan', badge: '🔄 3개월의 기록',
      main: '1달 차: 자신감\n2달 차: 좌절\n<em>3달 차: 현타</em>',
      sub: '이 패턴, 공감되시나요? 😅', cta: 'AICUT 해결 →',
      out: 'aicut_blog_estate_cycle.png', width: 700, height: 400 },
    // Cost 700x400 — dark_green
    { theme: 'dark_green', badge: '💰 현실 계산',
      main: '인력 1명 300만원\n<em>외주는 절반</em>\n퀄리티는 더 높은데',
      sub: '직접 하는 게 오히려 손해였다 🤯', cta: 'AICUT 견적 →',
      out: 'aicut_blog_estate_cost.png', width: 700, height: 400 },
    // Channel 700x400 — light_pink
    { theme: 'light_pink', badge: '📱 3채널 전략',
      main: '릴스·쇼츠·틱톡\n<em>채널별 맞춤</em>\n콘텐츠로 바꿨다',
      sub: '감성/정보/트렌드, 각각 다르게', cta: 'AICUT 전략 →',
      out: 'aicut_blog_estate_channel.png', width: 700, height: 400 },
    // After 700x400 — dark_purple
    { theme: 'dark_purple', badge: '✅ 바뀐 점 4가지',
      main: '① 밤 11시에 잡니다\n② 퀄리티 UP\n③ 비용 DOWN\n④ 팀원 표정 😂',
      sub: '외주 맡기고 모든 게 바뀌었다', cta: 'AICUT 후기 →',
      out: 'aicut_blog_estate_after.png', width: 700, height: 400 },
    // CTA 700x400 — dark_green
    { theme: 'dark_green', badge: '🚀 지금 시작',
      main: '하반기 준비\n<em>에이컷과 함께</em>',
      sub: '카톡: pf.kakao.com/_GIesX/chat', cta: 'AICUT 상담 신청',
      out: 'aicut_blog_estate_cta.png', width: 700, height: 400 }
  ];

  console.log('=== REF 정밀 분석 기반 이미지 생성 ===');
  for (let i = 0; i < imgs.length; i++) {
    console.log(`[${i+1}/6] ${imgs[i].out}...`);
    try {
      const r = await makeCard(imgs[i]);
      console.log(`  OK ${r.file} (${r.sizeKB}KB)`);
    } catch (e) { console.log(`  FAIL: ${e.message}`); }
  }
  console.log('=== 완료 ===');
}

main().catch(e => console.error(e));

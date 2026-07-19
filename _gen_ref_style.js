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
  }
};

function makeHTML(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const W = opt.width || 700;
  const H = opt.height || 700;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg}}
.card{width:${W}px;height:${H}px;position:relative;overflow:hidden;
  background:${T.bg};display:flex;flex-direction:column;align-items:center;
  text-align:center;padding:${Math.round(H*0.13)}px ${Math.round(W*0.08)}px;}
.glow{position:absolute;border-radius:50%;
  background:radial-gradient(circle,${T.glow} 0%,transparent 60%);
  width:${W}px;height:${H}px;
  top:35%;left:50%;transform:translate(-50%,-50%);}
.glow2{position:absolute;border-radius:50%;
  background:radial-gradient(circle,rgba(92,61,232,0.15) 0%,transparent 50%);
  width:${Math.round(W*0.8)}px;height:${Math.round(H*0.8)}px;
  top:60%;left:50%;transform:translate(-50%,-50%);}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};
  font-size:${H >= 400 ? 15 : 14}px;font-weight:700;padding:6px 20px;
  border:1px solid ${T.badgeBorder};border-radius:30px;
  margin-bottom:auto;z-index:2;position:relative;margin-top:${Math.round(H*0.10)}px;
  letter-spacing:-0.3px;backdrop-filter:blur(1px);}
.main{color:${T.textColor};font-size:${H >= 400 ? 40 : 36}px;font-weight:800;line-height:1.35;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.5px;max-width:92%;
  margin-top:${Math.round(H*0.08)}px;margin-bottom:${Math.round(H*0.04)}px;
  flex:1;display:flex;flex-direction:column;justify-content:center;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${H >= 400 ? 17 : 15}px;font-weight:400;line-height:1.5;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.2px;max-width:85%;
  margin-bottom:${Math.round(H*0.06)}px;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;
  font-size:${H >= 400 ? 17 : 15}px;font-weight:700;padding:12px 44px;
  border-radius:50px;z-index:2;position:relative;display:inline-block;
  letter-spacing:-0.3px;margin-bottom:${Math.round(H*0.08)}px;
  box-shadow:0 2px 16px rgba(92,61,232,0.3);}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="glow2"></div>
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
    // Main 700x700
    { theme: 'dark_purple', badge: '🏢 분양 마케팅',
      main: '분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
      sub: '직접 부딪힌 3개월, 솔직한 후기', cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_estate_main.png', width: 700, height: 700 },
    // Cycle card 700x400 (REF style)
    { theme: 'dark_purple', badge: '🔄 3개월의 기록',
      main: '1달 차: 자신감\n2달 차: 좌절\n<em>3달 차: 현타</em>',
      sub: '이 패턴, 공감되시나요? 😅', cta: 'AICUT 해결 →',
      out: 'aicut_blog_estate_cycle.png', width: 700, height: 400 },
    // Cost card 700x400
    { theme: 'dark_purple', badge: '💰 현실 계산',
      main: '인력 1명 300만원\n<em>외주는 절반</em>\n퀄리티는 더 높은데',
      sub: '직접 하는 게 오히려 손해였다 🤯', cta: 'AICUT 견적 →',
      out: 'aicut_blog_estate_cost.png', width: 700, height: 400 },
    // Channel card 700x400
    { theme: 'dark_purple', badge: '📱 3채널 전략',
      main: '릴스·쇼츠·틱톡\n<em>채널별 맞춤</em>\n콘텐츠로 바꿨다',
      sub: '감성/정보/트렌드, 각각 다르게', cta: 'AICUT 전략 →',
      out: 'aicut_blog_estate_channel.png', width: 700, height: 400 },
    // After card 700x400
    { theme: 'dark_purple', badge: '✅ 바뀐 점 4가지',
      main: '① 밤 11시에 잡니다\n② 퀄리티 UP\n③ 비용 DOWN\n④ 팀원 표정 😂',
      sub: '외주 맡기고 모든 게 바뀌었다', cta: 'AICUT 후기 →',
      out: 'aicut_blog_estate_after.png', width: 700, height: 400 },
    // CTA card 700x400
    { theme: 'dark_purple', badge: '🚀 지금 시작',
      main: '하반기 준비\n<em>에이컷과 함께</em>',
      sub: '카톡: pf.kakao.com/_GIesX/chat', cta: 'AICUT 상담 신청',
      out: 'aicut_blog_estate_cta.png', width: 700, height: 400 }
  ];

  console.log('=== REF 스타일 완전 재현 이미지 생성 ===');
  for (let i = 0; i < imgs.length; i++) {
    console.log(`[${i+1}/6] ${imgs[i].out} (${imgs[i].width}x${imgs[i].height})...`);
    try {
      const r = await makeCard(imgs[i]);
      console.log(`  OK ${r.file} (${r.sizeKB}KB)`);
    } catch (e) { console.log(`  FAIL: ${e.message}`); }
  }
  console.log('=== 완료 ===');
}

main().catch(e => console.error(e));

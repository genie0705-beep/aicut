const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

const THEMES = {
  dark_purple: { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.55)', badgeBg:'rgba(167,139,250,0.15)', badgeColor:'#a78bfa', badgeBorder:'rgba(167,139,250,0.3)', textColor:'#fff', accent:'#a78bfa', subColor:'rgba(255,255,255,0.6)', ctaFrom:'#5c3de8', ctaTo:'#7c5cf6' },
  light_cyan: { bg:'linear-gradient(160deg,#f0f4f8,#e8ecf5,#dce5f5)', glow:'rgba(6,182,212,0.18)', badgeBg:'rgba(6,182,212,0.1)', badgeColor:'#0891b2', badgeBorder:'rgba(6,182,212,0.25)', textColor:'#0f172a', accent:'#0891b2', subColor:'rgba(15,23,42,0.5)', ctaFrom:'#0891b2', ctaTo:'#5c3de8' },
  light_pink: { bg:'linear-gradient(160deg,#faf5f7,#f8edf5,#fce7f3)', glow:'rgba(236,72,153,0.16)', badgeBg:'rgba(236,72,153,0.1)', badgeColor:'#db2777', badgeBorder:'rgba(236,72,153,0.25)', textColor:'#0f172a', accent:'#db2777', subColor:'rgba(15,23,42,0.5)', ctaFrom:'#db2777', ctaTo:'#5c3de8' },
  dark_green: { bg:'linear-gradient(160deg,#0a1628,#0f2847,#064e3b)', glow:'rgba(52,211,153,0.3)', badgeBg:'rgba(52,211,153,0.15)', badgeColor:'#34d399', badgeBorder:'rgba(52,211,153,0.3)', textColor:'#fff', accent:'#34d399', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#059669', ctaTo:'#34d399' }
};

async function gen(opt) {
  const T = THEMES[opt.theme] || THEMES.dark_purple;
  const iW = opt.width || 700;
  const iH = opt.height || 700;
  const isCard = iW > iH;
  const mtTop = isCard ? Math.round(iH*0.10) : Math.round(iH*0.14);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${iW}px;height:${iH}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg}}
.card{width:${iW}px;height:${iH}px;position:relative;overflow:hidden;background:${T.bg};
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:0;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);
  width:${iW}px;height:${Math.round(iH*1.2)}px;top:30%;left:50%;transform:translate(-50%,-50%);}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};
  font-size:${isCard?14:15}px;font-weight:700;padding:${isCard?'5px 18px':'6px 20px'};
  border:1px solid ${T.badgeBorder};border-radius:30px;z-index:2;position:relative;
  margin-top:${mtTop}px;margin-bottom:0;letter-spacing:-0.3px;backdrop-filter:blur(1px);}
.main{color:${T.textColor};font-size:${isCard?34:40}px;font-weight:800;line-height:1.35;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.5px;max-width:90%;
  margin-top:${isCard?Math.round(iH*0.06):Math.round(iH*0.07)}px;margin-bottom:${isCard?Math.round(iH*0.025):Math.round(iH*0.03)}px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${isCard?14:16}px;font-weight:400;line-height:1.4;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.2px;max-width:85%;
  margin-bottom:${isCard?Math.round(iH*0.04):Math.round(iH*0.05)}px;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;
  font-size:${isCard?14:16}px;font-weight:700;padding:${isCard?'9px 32px':'11px 38px'};
  border-radius:50px;z-index:2;position:relative;display:inline-block;
  letter-spacing:-0.3px;margin-bottom:${isCard?Math.round(iH*0.20):Math.round(iH*0.18)}px;
  box-shadow:0 2px 16px rgba(92,61,232,0.25);}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${opt.badge}</div>
  <div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${opt.sub}</div>
  <div class="cta">${opt.cta||'AICUT →'}</div>
</div></body></html>`;

  const tmp = path.join(W, '_tmp_final.html');
  fs.writeFileSync(tmp, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: iW, height: iH });
  await page.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  const out = path.join(W, opt.out);
  await page.screenshot({ path: out, fullPage: false });
  const size = fs.statSync(out).size;
  await page.close(); await b.close(); fs.unlinkSync(tmp);
  return { file: opt.out, sizeKB: Math.round(size/1024) };
}

async function main() {
  const imgs = [
    { theme:'dark_purple', badge:'🏢 분양 마케팅', out:'aicut_blog_estate_main.png', width:700, height:700,
      main:'분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
      sub:'직접 부딪힌 3개월, 솔직한 후기', cta:'AICUT 무료상담 →' },
    { theme:'light_cyan', badge:'🔄 3개월의 기록', out:'aicut_blog_estate_cycle.png', width:700, height:400,
      main:'1달 차: 자신감\n2달 차: 좌절\n<em>3달 차: 현타</em>',
      sub:'이 패턴, 공감되시나요? 😅', cta:'AICUT 해결 →' },
    { theme:'dark_green', badge:'💰 현실 계산', out:'aicut_blog_estate_cost.png', width:700, height:400,
      main:'인력 1명 300만원\n<em>외주는 절반</em>\n퀄리티는 더 높은데',
      sub:'직접 하는 게 오히려 손해였다 🤯', cta:'AICUT 견적 →' },
    { theme:'light_pink', badge:'📱 3채널 전략', out:'aicut_blog_estate_channel.png', width:700, height:400,
      main:'릴스·쇼츠·틱톡\n<em>채널별 맞춤</em>\n콘텐츠로 바꿨다',
      sub:'감성/정보/트렌드, 각각 다르게', cta:'AICUT 전략 →' },
    { theme:'dark_purple', badge:'✅ 바뀐 점 4가지', out:'aicut_blog_estate_after.png', width:700, height:400,
      main:'① 밤 11시에 잡니다\n② 퀄리티 UP\n③ 비용 DOWN\n④ 팀원 표정 😂',
      sub:'외주 맡기고 모든 게 바뀌었다', cta:'AICUT 후기 →' },
    { theme:'dark_green', badge:'🚀 지금 시작', out:'aicut_blog_estate_cta.png', width:700, height:400,
      main:'하반기 준비\n<em>에이컷과 함께</em>',
      sub:'카톡: pf.kakao.com/_GIesX/chat', cta:'AICUT 상담 신청' },
  ];

  console.log('=== 최종 이미지 생성 (REF 분석 기반) ===');
  for (let i = 0; i < imgs.length; i++) {
    console.log(`[${i+1}/6] ${imgs[i].out}...`);
    try {
      const r = await gen(imgs[i]);
      console.log(`  OK ${r.file} (${r.sizeKB}KB)`);
    } catch(e) { console.log(`  FAIL: ${e.message}`); }
  }
  console.log('=== 완료 ===');
}
main().catch(e => console.error(e));

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const THEMES = {
  dark_purple: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)', glow: 'rgba(92,61,232,0.5)', badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.3)', textColor: '#fff', accent: '#a78bfa', subColor: 'rgba(255,255,255,0.6)' },
  light_warm: { bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)', glow: 'rgba(180,155,120,0.12)', badgeBg: 'rgba(180,155,120,0.12)', badgeColor: '#8b7355', badgeBorder: 'rgba(180,155,120,0.25)', textColor: '#3d3028', accent: '#8b7355', subColor: 'rgba(61,48,40,0.5)' },
  dark_green: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)', glow: 'rgba(52,211,153,0.35)', badgeBg: 'rgba(52,211,153,0.15)', badgeColor: '#34d399', badgeBorder: 'rgba(52,211,153,0.3)', textColor: '#fff', accent: '#34d399', subColor: 'rgba(255,255,255,0.6)' },
};

// 카드 이미지 생성기 — CTA 영역(둥근 사각형 버튼) 제거
async function makeCardNoCta(theme, badge, main, sub, outFile) {
  const T = THEMES[theme];
  if (!T) throw new Error('Unknown theme: ' + theme);
  const W = 600, H = 338;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${T.bg};display:flex;align-items:center;justify-content:center;}
.card{width:${W}px;height:${H}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px;position:relative;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(W*0.64)}px;height:${Math.round(W*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%);}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};font-size:14px;font-weight:700;padding:6px 18px;border:1px solid ${T.badgeBorder};border-radius:30px;margin-bottom:14px;z-index:2;position:relative;}
.main{color:${T.textColor};font-size:36px;font-weight:800;line-height:1.3;z-index:2;position:relative;width:100%;text-align:center;margin-bottom:12px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:15px;font-weight:500;line-height:1.5;z-index:2;position:relative;width:100%;text-align:center;word-break:keep-all;}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${badge}</div>
  <div class="main">${main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${sub}</div>
</div></body></html>`;

  const tmpFile = path.join(__dirname, '..', '_tmp_noc.html');
  fs.writeFileSync(tmpFile, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({ width: W, height: H });
  await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const outPath = path.join(__dirname, '..', outFile);
  await p.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await p.close(); await b.close(); fs.unlinkSync(tmpFile);
  console.log('  ✅ 생성: ' + outFile + ' (' + Math.round(size / 1024) + 'KB)');
}

async function main() {
  // card1 — light_warm, CTA 버튼 제거
  await makeCardNoCta('light_warm',
    '📊 상반기 트렌드',
    '보험 마케팅,\n<em>영상 콘텐츠</em>로\n전환율 2배 차이',
    'FP 브랜딩, 이제 SNS 영상이 결정한다',
    'aicut_blog_fp_card1.png');

  // card2 — dark_purple, CTA 버튼 제거
  await makeCardNoCta('dark_purple',
    '🚀 하반기 전략',
    '하반기 FP 마케팅\n<em>숏폼 영상</em>으로\n준비하는 방법',
    '릴스·쇼츠·틱톡, 채널별 최적화 전략',
    'aicut_blog_fp_card2.png');

  // card3 — light_warm, CTA 버튼 제거
  await makeCardNoCta('light_warm',
    '✅ 실제 사례',
    '보험설계사 A님\n영상 마케팅 도입 후\n<em>예약률 180%</em> 상승',
    '정기 납품으로 꾸준한 콘텐츠 유지',
    'aicut_blog_fp_card3.png');

  // ctaCard — dark_green, CTA 버튼 제거
  await makeCardNoCta('dark_green',
    '지금 시작하세요',
    '보험 마케팅,\n<em>아웃소싱</em>하고\n하반기 준비 끝',
    '월 정기 납품 · 숏폼 전문 · 빠른 턴어라운드',
    'aicut_blog_fp_cta.png');

  console.log('\n✅ 이미지 4장 생성 완료 (CTA 버튼 제거됨)');
}

main().catch(e => console.error('❌', e.message));

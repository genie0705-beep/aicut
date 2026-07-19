const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CDP_PORT = 9224;
const OUT_DIR = __dirname;
const TMP_FILE = path.join(__dirname, '_tmp_blog_img.html');

// 테마 정의
const THEMES = {
  dark_purple: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)', accent: '#a78bfa', textColor: '#FFFFFF', subColor: '#c0c0d0' },
  light_warm: { bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)', accent: '#8b7355', textColor: '#1a1a2e', subColor: '#666680' },
  dark_green: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)', accent: '#34d399', textColor: '#FFFFFF', subColor: '#c0c0d0' },
};

/**
 * 이미지 1장 생성
 */
async function genImage(theme, w, h, badge, main, sub, cta, outFile) {
  const T = THEMES[theme];
  const isDark = theme === 'dark_purple' || theme === 'dark_green';
  const textColor = isDark ? '#FFFFFF' : '#1a1a2e';
  const subColor = isDark ? '#c0c0d0' : '#666680';
  const badgeBg = isDark ? 'rgba(167,139,250,0.2)' : 'rgba(139,115,85,0.15)';
  const badgeColor = isDark ? '#a78bfa' : '#8b7355';

  // CTA 유무
  const ctaHtml = cta
    ? `<div style="background:linear-gradient(135deg,${T.accent},#7c3aed);color:#fff;font-size:${h <= 450 ? 16 : 20}px;font-weight:700;padding:${h <= 450 ? '10px 32px' : '14px 48px'};border-radius:50px;display:inline-block;margin-top:${h <= 450 ? 20 : 28}px;z-index:2;position:relative;">${cta}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${T.bg}}
.card{width:${w}px;height:${h}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${h <= 450 ? 40 : 60}px;position:relative;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(w*0.64)}px;height:${Math.round(w*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%);}
.badge{background:${badgeBg};color:${badgeColor};padding:${h <= 450 ? '6px 18px' : '8px 24px'};border-radius:20px;font-size:${h <= 450 ? 14 : 16}px;font-weight:700;margin-bottom:${h <= 450 ? 14 : 20}px;z-index:2;position:relative;border:1px solid ${badgeColor}33;}
.main{color:${textColor};font-size:${h <= 450 ? 32 : 42}px;font-weight:900;line-height:1.35;margin-bottom:14px;word-break:keep-all;z-index:2;position:relative;width:100%;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${subColor};font-size:${h <= 450 ? 14 : 17}px;font-weight:400;line-height:1.5;word-break:keep-all;z-index:2;position:relative;width:100%;}
</style></head><body>
<div class="card"><div class="glow"></div>
<div class="badge">${badge}</div>
<div class="main">${main.replace(/\n/g, '<br>')}</div>
<div class="sub">${sub}</div>
${ctaHtml}
</div></body></html>`;

  fs.writeFileSync(TMP_FILE, html);
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.goto('file:///' + TMP_FILE.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);
  const outPath = path.join(OUT_DIR, outFile);
  await p.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await p.close();
  await b.close();
  console.log(`  ✅ ${outFile} (${Math.round(size/1024)}KB)`);
}

(async () => {
  console.log('=== 블로그 이미지 5장 생성 ===\n');

  // 1. main (700×700, dark_purple, CTA 유지)
  console.log('1/5. 대표 이미지');
  await genImage('dark_purple', 700, 700,
    '☀️ 보험설계사 마케팅',
    '무더위에 지친\n보험설계사라면?\n<em>하반기 숏폼</em>으로\n승부보세요',
    '7월부터 준비하는 하반기 마케팅 전략',
    'AICUT 무료상담 →',
    'aicut_blog_insurance01.png');

  // 2. card (600×338, light_warm, CTA 제거)
  console.log('2/5. 보험설계사 고민');
  await genImage('light_warm', 600, 338,
    '☀️ 무더위 현실',
    '보험설계사가\n여름에 만나는\n<em>3가지 고민</em>',
    '만남 거절 / 열정 하락 / 경쟁 심화',
    null,
    'aicut_blog_insurance02.png');

  // 3. cardDark (600×338, dark_purple, CTA 제거)
  console.log('3/5. 숏폼 전략');
  await genImage('dark_purple', 600, 338,
    '🎯 숏폼 전략',
    '보험설계사\n<em>숏폼 콘텐츠</em>\n3가지 유형',
    '보장분석 / 고객후기 / 일상브이로그',
    null,
    'aicut_blog_insurance03.png');

  // 4. card (600×338, light_warm, CTA 제거)
  console.log('4/5. 시작 이유');
  await genImage('light_warm', 600, 338,
    '🔥 지금 시작',
    '7월부터 준비해야\n<em>9월부터 성과</em>가\n나타납니다',
    '숏폼은 꾸준함이 생명입니다',
    null,
    'aicut_blog_insurance04.png');

  // 5. ctaCard (600×338, dark_green, CTA 유지)
  console.log('5/5. CTA 카드');
  await genImage('dark_green', 600, 338,
    '💬 지금 상담하세요',
    '첫 달 <em>20% 할인</em>\n이벤트 진행 중',
    '무료 상담 신청은 카카오톡으로',
    '카톡 무료상담 →',
    'aicut_blog_insurance05.png');

  console.log('\n=== 이미지 생성 완료! ===');
})();

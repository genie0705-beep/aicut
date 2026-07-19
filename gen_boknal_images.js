const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const TMP_FILE = path.join(__dirname, '_tmp_bok.html');

const THEMES = {
  dark_purple: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)', accent: '#a78bfa', textColor: '#FFFFFF', subColor: '#c0c0d0' },
  light_warm: { bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)', accent: '#e89040', textColor: '#1a1a2e', subColor: '#666680' },
  dark_green: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)', accent: '#34d399', textColor: '#FFFFFF', subColor: '#c0c0d0' },
};

async function genImage(theme, w, h, badge, main, sub, cta, outFile) {
  const T = THEMES[theme];
  const isDark = theme === 'dark_purple' || theme === 'dark_green';
  const textColor = isDark ? '#FFFFFF' : '#1a1a2e';
  const subColor = isDark ? '#c0c0d0' : '#666680';
  const badgeBg = 'rgba(167,139,250,0.2)';

  const ctaHtml = cta
    ? `<div style="background:linear-gradient(135deg,${T.accent},#7c3aed);color:#fff;font-size:${h <= 450 ? 16 : 20}px;font-weight:700;padding:${h <= 450 ? '10px 32px' : '14px 48px'};border-radius:50px;display:inline-block;margin-top:${h <= 450 ? 20 : 28}px;z-index:2;position:relative;">${cta}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${T.bg}}
.card{width:${w}px;height:${h}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${h <= 450 ? 40 : 60}px;position:relative;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(w*0.64)}px;height:${Math.round(w*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%);}
.badge{background:${badgeBg};color:${T.accent};padding:${h <= 450 ? '6px 18px' : '8px 24px'};border-radius:20px;font-size:${h <= 450 ? 14 : 16}px;font-weight:700;margin-bottom:${h <= 450 ? 14 : 20}px;z-index:2;position:relative;border:1px solid ${T.accent}44;}
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
  await p.screenshot({ path: path.join(__dirname, outFile), fullPage: false });
  await p.close();
  await b.close();
  console.log('  ✅ ' + outFile);
}

(async () => {
  console.log('=== 🍗 복날 이미지 생성 ===\n');

  console.log('1/5. 대표 이미지');
  await genImage('dark_purple', 700, 700,
    '🍗 복날 보양식',
    '2026 중복\n<em>보양식 추천</em>\n인증샷부터 릴스까지',
    '7월 22일 중복, 맛있게 즐기세요',
    'AICUT 무료상담 →',
    'aicut_boknal01.png');

  console.log('2/5. 보양식 TOP5');
  await genImage('light_warm', 600, 338,
    '🍗 보양식 TOP5',
    '중복에 먹는\n<em>보양식 추천</em>',
    '삼계탕 · 장어구이 · 추어탕 · 전복죽 · 소고기',
    null,
    'aicut_boknal02.png');

  console.log('3/5. 인증샷 꿀팁');
  await genImage('dark_purple', 600, 338,
    '📸 인증샷 꿀팁',
    '음식 인증샷\n<em>잘 찍는 법</em>',
    '조명 / 구도 / 앵글 3가지 꿀팁',
    null,
    'aicut_boknal03.png');

  console.log('4/5. 음식 릴스');
  await genImage('light_warm', 600, 338,
    '🎬 음식 릴스',
    '찍은 영상,\n<em>릴스로 만들기</em>',
    '편집은 에이컷에 맡기세요',
    null,
    'aicut_boknal04.png');

  console.log('5/5. CTA 카드');
  await genImage('dark_green', 600, 338,
    '💬 지금 상담',
    '음식 콘텐츠\n<em>편집이 필요하다면?</em>',
    '무료 상담은 카카오톡으로',
    '카톡 무료상담 →',
    'aicut_boknal05.png');

  console.log('\n=== 이미지 생성 완료! ===');
})();

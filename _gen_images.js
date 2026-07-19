// 치과 임플란트 마케팅 블로그 이미지 5장 생성
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

const IMAGES = [
  {
    name: 'aicut_blog_dental_main.png',
    width: 700,
    height: 700,
    theme: 'light_pink',
    badge: '🦷 치과 마케팅',
    main: '치과 임플란트 마케팅,<br><em>하반기 준비</em>는<br>영상 콘텐츠로<br>시작하세요',
    sub: '영상 하나가 병원의 미래를 바꾼다',
    cta: 'AICUT 무료상담 →'
  },
  {
    name: 'aicut_blog_dental_01.png',
    width: 600,
    height: 338,
    theme: 'dark_purple',
    badge: '📋 임플란트 마케팅',
    main: '임플란트 수술 영상이<br><em>주는 신뢰감</em>',
    sub: '환자는 영상을 보며 안심합니다',
    cta: 'AICUT 무료상담 →'
  },
  {
    name: 'aicut_blog_dental_02.png',
    width: 600,
    height: 338,
    theme: 'light_cyan',
    badge: '🎥 편집 아웃소싱',
    main: '촬영은 해도,<br><em>편집이 문제</em>다',
    sub: '바쁜 원장님, 편집은 전문가에게',
    cta: 'AICUT 무료상담 →'
  },
  {
    name: 'aicut_blog_dental_03.png',
    width: 600,
    height: 338,
    theme: 'dark_green',
    badge: '📅 하반기 마케팅',
    main: '하반기 치과 마케팅,<br><em>지금 준비</em>해야<br>하는 이유',
    sub: '9~12월 성수기, 지금 시작하세요',
    cta: 'AICUT 무료상담 →'
  },
  {
    name: 'aicut_blog_dental_cta.png',
    width: 500,
    height: 300,
    theme: 'dark_purple',
    badge: '💬 지금 시작하세요',
    main: '치과 임플란트 마케팅,<br><em>지금 시작</em>하세요',
    sub: '무료상담 → 카카오톡 채널',
    cta: 'AICUT 무료상담 →'
  }
];

async function generateImage(page, imgCfg) {
  const T = THEMES[imgCfg.theme];
  const W = imgCfg.width;
  const H = imgCfg.height;

  // padding calc
  const pad = W <= 500 ? 30 : (W <= 600 ? 40 : 60);
  const badgeSize = H <= 300 ? 13 : (H <= 338 ? 14 : 18);
  const mainSize = H <= 300 ? 24 : (H <= 338 ? 28 : (W <= 600 ? 36 : 48));
  const subSize = H <= 300 ? 13 : (H <= 338 ? 14 : 20);
  const ctaSize = H <= 300 ? 14 : (H <= 338 ? 16 : 20);
  const ctaPad = H <= 300 ? '8px 24px' : (H <= 338 ? '10px 32px' : '14px 48px');
  const badgePad = H <= 300 ? '3px 12px' : (H <= 338 ? '4px 16px' : '8px 24px');
  const mb1 = H <= 300 ? 10 : (H <= 338 ? 12 : 28);
  const mb2 = H <= 300 ? 6 : (H <= 338 ? 8 : 16);
  const mb3 = H <= 300 ? 10 : (H <= 338 ? 12 : 32);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif}
.card{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${pad}px}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);width:${Math.round(W*0.64)}px;height:${Math.round(W*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%)}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};font-size:${badgeSize}px;font-weight:700;padding:${badgePad};border:1px solid ${T.badgeBorder};border-radius:30px;margin-bottom:${mb1}px;z-index:2;position:relative}
.main{color:${T.textColor};font-size:${mainSize}px;font-weight:800;line-height:1.35;z-index:2;position:relative;margin-bottom:${mb2}px;word-break:keep-all;letter-spacing:-1px}
.main em{color:${T.accent};font-style:normal}
.sub{color:${T.subColor};font-size:${subSize}px;font-weight:500;line-height:1.4;z-index:2;position:relative;margin-bottom:${mb3}px;word-break:keep-all}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;font-size:${ctaSize}px;font-weight:700;padding:${ctaPad};border-radius:50px;z-index:2;position:relative;display:inline-block}
</style></head><body>
<div class="card"><div class="glow"></div><div class="badge">${imgCfg.badge}</div><div class="main">${imgCfg.main}</div><div class="sub">${imgCfg.sub}</div><div class="cta">${imgCfg.cta}</div></div>
</body></html>`;

  const tmpFile = path.join(__dirname, '_tmp_gen.html');
  fs.writeFileSync(tmpFile, html);

  await page.setViewportSize({ width: W, height: H });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);

  const outPath = path.join(__dirname, imgCfg.name);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  fs.unlinkSync(tmpFile);

  return { file: imgCfg.name, sizeKB: Math.round(size / 1024), width: W, height: H };
}

(async () => {
  console.log('🖼️ 치과 임플란트 이미지 5장 생성 시작...');
  const cdpPort = process.env.CDP_PORT || 9224;
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + cdpPort);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  try {
    for (let i = 0; i < IMAGES.length; i++) {
      const result = await generateImage(page, IMAGES[i]);
      console.log(`  ✅ [${i + 1}/5] ${result.file} (${result.width}×${result.height}, ${result.sizeKB}KB)`);
    }
    console.log('🎉 모든 이미지 생성 완료!');
  } catch (err) {
    console.error('❌ 이미지 생성 실패:', err.message);
  } finally {
    await page.close();
    await b.disconnect();
    console.log('🔌 브라우저 연결 종료 (브라우저는 열려 있음)');
  }
})();

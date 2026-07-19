// 부동산 블로그 이미지 생성기 (2026-07-10)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = process.env.CDP_PORT || '9224';

const THEMES = {
  dark_purple: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    accent: '#a78bfa',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#5c3de8',
    ctaTo: '#7c5cf6',
  },
  light_warm: {
    bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)',
    accent: '#8b7355',
    subColor: 'rgba(61,48,40,0.5)',
    ctaFrom: '#8b7355',
    ctaTo: '#5c3de8',
  },
  dark_green: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)',
    accent: '#34d399',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#059669',
    ctaTo: '#34d399',
  }
};

function imgHtml(themeName, badge, main, sub, cta, width, height) {
  const T = THEMES[themeName];
  const isDark = themeName === 'dark_purple' || themeName === 'dark_green';
  const textColor = isDark ? '#FFFFFF' : '#1a1a2e';
  const subColor = isDark ? '#c0c0d0' : '#666680';
  const hasCta = cta && cta.trim();
  
  const badgeFont = width <= 450 ? 13 : (width >= 700 ? 16 : 14);
  const mainFont = width <= 450 ? 28 : (width >= 700 ? 42 : 32);
  const subFont = width <= 450 ? 14 : (width >= 700 ? 18 : 15);
  const ctaFont = width <= 450 ? 15 : (width >= 700 ? 20 : 16);
  const padding = width >= 700 ? 60 : 40;
  const badgePadding = width >= 700 ? '8px 24px' : '6px 18px';
  const ctaPadding = width >= 700 ? '14px 48px' : '10px 36px';
  const glowSize = Math.round(width * 0.64);

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${width}px;height:${height}px;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;}
body{display:flex;align-items:center;justify-content:center;background:${T.bg};}
.card{width:${width}px;height:${height}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${padding}px;position:relative;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${glowSize}px;height:${glowSize}px;top:50%;left:50%;transform:translate(-50%,-50%);}
.badge{background:${T.accent};color:#fff;padding:${badgePadding};border-radius:20px;font-size:${badgeFont}px;font-weight:700;margin-bottom:20px;letter-spacing:1px;z-index:2;position:relative;}
.main{color:${textColor};font-size:${mainFont}px;font-weight:900;line-height:1.3;margin-bottom:14px;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;letter-spacing:-0.5px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${subColor};font-size:${subFont}px;font-weight:400;line-height:1.5;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;font-size:${ctaFont}px;font-weight:700;padding:${ctaPadding};border-radius:50px;display:inline-block;margin-top:24px;z-index:2;position:relative;}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${badge}</div>
  <div class="main">${main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${sub}</div>
  ${hasCta ? `<div class="cta">${cta}</div>` : ''}
</div></body></html>`;
}

async function genImage(html, outFile) {
  const tmpFile = path.join(__dirname, '_tmp_img.html');
  fs.writeFileSync(tmpFile, html);
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 700, height: 700 });
  await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const outPath = path.join(__dirname, outFile);
  await p.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await p.close();
  fs.unlinkSync(tmpFile);
  return { file: outFile, sizeKB: Math.round(size / 1024) };
}

(async () => {
  const images = [
    // 1. 대표 이미지 (700×700, CTA 유지)
    {
      file: 'aicut_blog_realestate_main.png',
      html: imgHtml('dark_purple', '🏢 부동산 마케팅',
        '부동산 중개법인·공인중개사\n하반기 분양 마케팅은\n<em>숏폼 영상</em>으로\n준비하세요',
        '전담 에디터가 매월 정기 납품합니다', 'AICUT 무료상담 →',
        700, 700)
    },
    // 2. 본문 카드1 (600×338, CTA 제거, AICUT 제거)
    {
      file: 'aicut_blog_realestate_card1.png',
      html: imgHtml('light_warm', '🏢 부동산 마케팅',
        '왜 지금\n<em>부동산 영상 마케팅</em>이\n필요한가?',
        '매물 영상 하나가 계약까지 연결합니다', '',
        600, 338)
    },
    // 3. 본문 카드2 (600×338, CTA 제거, AICUT 제거)
    {
      file: 'aicut_blog_realestate_card2.png',
      html: imgHtml('light_warm', '📱 숏폼 마케팅',
        '<em>숏폼 매물 영상</em>으로\n바이어의 시선을\n사로잡는 방법',
        '릴스·쇼츠·틱톡, 채널별 최적화 전략', '',
        600, 338)
    },
    // 4. 본문 카드3 (600×338, CTA 제거, AICUT 제거)
    {
      file: 'aicut_blog_realestate_card3.png',
      html: imgHtml('dark_purple', '📈 하반기 전략',
        '2026년 하반기\n<em>분양 마케팅</em>은\n이렇게 준비하세요',
        'D+1 납품, 전담 에디터 배정', '',
        600, 338)
    },
    // 5. CTA 카드 (600×338, CTA 유지, AICUT 유지)
    {
      file: 'aicut_blog_realestate_cta.png',
      html: imgHtml('dark_green', '✨ AICUT',
        '지금 바로\n<em>무료 상담</em>\n신청하세요',
        '월 정기 계약 시 최대 35% 할인', '카카오톡 문의 →',
        600, 338)
    }
  ];

  console.log('=== Generating ' + images.length + ' images ===\n');
  for (const img of images) {
    console.log('Creating ' + img.file + '...');
    const result = await genImage(img.html, img.file);
    console.log('  ✅ ' + result.file + ' (' + result.sizeKB + 'KB)');
  }
  console.log('\n✅ All images generated!');
})();

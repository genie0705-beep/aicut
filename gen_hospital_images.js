// 🏥 병원 블로그 이미지 생성 (5장)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = process.env.CDP_PORT || 9224;
const OUT_DIR = __dirname;

const THEMES = {
  dark_purple: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    textColor: '#fff',
    accent: '#a78bfa',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#5c3de8', ctaTo: '#7c5cf6',
    badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.3)',
  },
  light_warm: {
    bg: 'linear-gradient(160deg, #fef9f0, #f8f4ec, #fdf2f8)',
    glow: 'rgba(244,185,66,0.2)',
    textColor: '#1e1b2e', accent: '#7c3aed',
    subColor: 'rgba(30,27,46,0.5)',
    ctaFrom: '#7c3aed', ctaTo: '#a78bfa',
    badgeBg: 'rgba(124,58,237,0.08)', badgeColor: '#7c3aed', badgeBorder: 'rgba(124,58,237,0.2)',
  },
  dark_green: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)',
    glow: 'rgba(52,211,153,0.35)',
    textColor: '#fff', accent: '#34d399',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#059669', ctaTo: '#34d399',
    badgeBg: 'rgba(52,211,153,0.15)', badgeColor: '#34d399', badgeBorder: 'rgba(52,211,153,0.3)',
  },
};

function makeHtml(theme, badge, main, sub, cta, w, h) {
  const T = THEMES[theme];
  const hasCta = cta && cta.length > 0;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg};display:flex;justify-content:center;align-items:center}
  .card{width:${w}px;height:${h}px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px}
  .glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);width:${Math.round(w*0.64)}px;height:${Math.round(w*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%)}
  .badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};font-size:${h<=450?14:18}px;font-weight:700;padding:${h<=450?'4px 16px':'8px 24px'};border:1px solid ${T.badgeBorder};border-radius:30px;margin-bottom:${h<=450?14:28}px;z-index:2;position:relative}
  .main{color:${T.textColor};font-size:${h<=450?32:48}px;font-weight:800;line-height:1.35;z-index:2;position:relative;margin-bottom:${h<=450?10:16}px;word-break:keep-all;letter-spacing:-1px}
  .main em{color:${T.accent};font-style:normal}
  .sub{color:${T.subColor};font-size:${h<=450?15:20}px;font-weight:500;line-height:1.4;z-index:2;position:relative;margin-bottom:${hasCta?(h<=450?16:32):0}px;word-break:keep-all}
  ${hasCta?`.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;font-size:20px;font-weight:700;padding:14px 48px;border-radius:50px;z-index:2;position:relative;display:inline-block}`:''}
</style></head><body><div class="card"><div class="glow"></div><div class="badge">${badge}</div><div class="main">${main.replace(/\n/g,'<br>')}</div><div class="sub">${sub}</div>${hasCta?`<div class="cta">${cta}</div>`:''}</div></body></html>`;
}

async function capture(html, w, h, outFile) {
  const tmp = path.join(__dirname, '_tmp_' + Date.now() + '.html');
  fs.writeFileSync(tmp, html);
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: w, height: h });
  await page.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  const outPath = path.join(OUT_DIR, outFile);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await page.close();
  fs.unlinkSync(tmp);
  return { file: outFile, sizeKB: Math.round(size / 1024) };
}

(async () => {
  const images = [
    // Image 1: 대표 (700×700, CTA 유지)
    makeHtml('dark_purple', '🏥 의료 마케팅',
      '그냥 영상 올리면 끝?\n병원 마케팅,\n<em>숏폼 편집</em>이\n답이다',
      '여름 시즌, 피부과·의원 영상 마케팅은 에이컷에',
      'AICUT 무료상담 →', 700, 700),

    // Image 2: 본문카드1 (600×338, CTA 제거)
    makeHtml('light_warm', '📸 직접 찍고 직접 편집?',
      '영상 하나 찍어도\n<em>밤샘 편집</em>은\n이제 그만',
      '전문 에디터에게 맡기면 퀄리티는 오르고 시간은 아껴집니다',
      '', 600, 338),

    // Image 3: 본문카드2 (600×338, CTA 제거)
    makeHtml('dark_purple', '✅ 의료광고 규제',
      '영상 하나 올리는데\n<em>규제 걱정</em>은\n에이컷이 해결',
      '식약처 심의·네이버 정책, 전문 에디터가 완벽 체크',
      '', 600, 338),

    // Image 4: 본문카드3 (600×338, CTA 제거)
    makeHtml('light_warm', '🎯 여름 시즌 마케팅',
      '선크림·다이어트\n<em>여름 필수 영상</em>,\n지금 준비하세요',
      '무더위 절정, 피부과·의원에 딱 맞는 시즌 콘텐츠 전략',
      '', 600, 338),

    // Image 5: CTA카드 (600×338, CTA 유지)
    makeHtml('dark_green', '🔥 지금 문의하세요',
      '하반기 병원 마케팅,\n<em>영상 편집 외주</em>로\n준비 완료',
      '직접 찍고, 전문가가 편집하는 가장 효율적인 방법',
      'AICUT 무료상담 →', 600, 338),
  ];

  const files = [
    'aicut_blog_hospital_main.png',
    'aicut_blog_hospital_01.png',
    'aicut_blog_hospital_02.png',
    'aicut_blog_hospital_03.png',
    'aicut_blog_hospital_cta.png',
  ];

  console.log('🚀 이미지 생성 시작...');
  for (let i = 0; i < images.length; i++) {
    const r = await capture(images[i], i === 0 ? 700 : 600, i === 0 ? 700 : 338, files[i]);
    console.log(`  [${i+1}/5] ✅ ${r.file} (${r.sizeKB}KB)`);
  }
  console.log('🎉 모든 이미지 생성 완료!');
})().catch(e => console.error('❌ 실패:', e.message));

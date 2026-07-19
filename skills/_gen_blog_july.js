// 📸 하반기 영상 마케팅 블로그 이미지 (2026-07-06)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const THEMES = {
  dark_purple: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    accent: '#a78bfa', textColor: '#fff', subColor: 'rgba(255,255,255,0.6)',
  },
  light_warm: {
    bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)',
    glow: 'rgba(180,155,120,0.12)',
    accent: '#8b7355', textColor: '#3d3028', subColor: 'rgba(61,48,40,0.5)',
  },
  dark_green: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)',
    glow: 'rgba(52,211,153,0.35)',
    accent: '#34d399', textColor: '#fff', subColor: 'rgba(255,255,255,0.6)',
  },
};

async function generateCard(opt) {
  const T = THEMES[opt.theme];
  const iW = opt.width || 700;
  const iH = opt.height || 700;
  const hasCta = opt.cta && opt.cta.length > 0;
  const pad = iH <= 450 ? 40 : 60;
  const badgeFont = iH <= 450 ? 14 : 16;
  const mainFont = iH <= 450 ? 32 : 42;
  const subFont = iH <= 450 ? 15 : 18;

  const ctaHtml = hasCta ? `<div class="cta">${opt.cta}</div>` : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${T.bg};display:flex;align-items:center;justify-content:center;}
.card{width:${iW}px;height:${iH}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${pad}px;position:relative;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);width:${Math.round(iW*0.64)}px;height:${Math.round(iW*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%);}
.badge{background:${T.accent};color:#fff;padding:8px 24px;border-radius:20px;font-size:${badgeFont}px;font-weight:700;margin-bottom:20px;letter-spacing:1px;z-index:2;position:relative;}
.main{color:${T.textColor};font-size:${mainFont}px;font-weight:900;line-height:1.3;margin-bottom:16px;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${subFont}px;font-weight:400;line-height:1.5;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;}
.cta{background:linear-gradient(135deg,${T.accent},#7c3aed);color:#fff;font-size:18px;font-weight:700;padding:12px 40px;border-radius:50px;display:inline-block;margin-top:28px;z-index:2;position:relative;}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${opt.badge}</div>
  <div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${opt.sub}</div>
  ${ctaHtml}
</div></body></html>`;

  const tmpFile = path.join(__dirname, '..', '_tmp_img.html');
  fs.writeFileSync(tmpFile, html);
  
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({width:iW, height:iH});
  await p.goto('file:///'+tmpFile.replace(/\\/g,'/'), {waitUntil:'networkidle', timeout:15000});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  
  const outPath = path.join(__dirname, '..', opt.out);
  await p.screenshot({path: outPath, fullPage: false});
  const size = fs.statSync(outPath).size;
  await p.close(); await b.close(); fs.unlinkSync(tmpFile);
  return { file: opt.out, sizeKB: Math.round(size / 1024) };
}

async function main() {
  console.log('📸 하반기 영상 마케팅 블로그 이미지 생성\n');

  // 1️⃣ 대표 이미지 (700×700) — CTA 유지
  console.log('1️⃣ 대표 이미지...');
  const r1 = await generateCard({
    theme: 'dark_purple', width: 700, height: 700,
    badge: '🔥 2026 하반기 마케팅',
    main: '7월부터 시작하는\n하반기 영상 마케팅,\n<em>월 20편 숏폼</em>으로',
    sub: 'FP·부동산·병원·프랜차이즈를 위한 정기 납품 전략',
    cta: 'AICUT 무료상담 →',
    out: 'aicut_blog_july_main.png'
  });
  console.log(`  ✅ ${r1.file} (${r1.sizeKB}KB)`);

  // 2️⃣ 카드1 (600×338) — CTA 제거
  console.log('2️⃣ 카드1...');
  const r2 = await generateCard({
    theme: 'light_warm', width: 600, height: 338,
    badge: '☀️ 7월에 시작해야 하는 이유',
    main: '하반기 마케팅\n<em>골든타임</em>은 지금',
    sub: '8월 휴가철 대비, 지금 준비해야 9월부터 결과',
    cta: '',
    out: 'aicut_blog_july_card1.png'
  });
  console.log(`  ✅ ${r2.file} (${r2.sizeKB}KB)`);

  // 3️⃣ 카드2 (600×338) — CTA 제거
  console.log('3️⃣ 카드2...');
  const r3 = await generateCard({
    theme: 'light_warm', width: 600, height: 338,
    badge: '📋 업종별 전략',
    main: '보험·부동산·병원·프랜차이즈\n<em>하반기 숏폼</em>\n이렇게 준비하세요',
    sub: '업종별로 다른 하반기 이슈와 영상 전략',
    cta: '',
    out: 'aicut_blog_july_card2.png'
  });
  console.log(`  ✅ ${r3.file} (${r3.sizeKB}KB)`);

  // 4️⃣ 카드3 (600×338) — CTA 제거
  console.log('4️⃣ 카드3...');
  const r4 = await generateCard({
    theme: 'dark_purple', width: 600, height: 338,
    badge: '🎯 꾸준함이 답이다',
    main: '숏폼 마케팅은 <em>누적</em>입니다\n1편으로 안 터져도\n20편이면 반응이 옵니다',
    sub: '정기 납품으로 매주 꾸준히, 번아웃 없이',
    cta: '',
    out: 'aicut_blog_july_card3.png'
  });
  console.log(`  ✅ ${r4.file} (${r4.sizeKB}KB)`);

  // 5️⃣ CTA 카드 (600×338) — CTA 유지
  console.log('5️⃣ CTA 카드...');
  const r5 = await generateCard({
    theme: 'dark_green', width: 600, height: 338,
    badge: '💬 지금 상담하세요',
    main: '영상 편집 아웃소싱,\n<em>에이컷</em>에 맡기고\n본업에 집중하세요',
    sub: '월 정기 납품 · 숏폼 전문 · 업종별 맞춤',
    cta: '카카오톡 무료상담 →',
    out: 'aicut_blog_july_cta.png'
  });
  console.log(`  ✅ ${r5.file} (${r5.sizeKB}KB)`);

  console.log('\n✅ 전체 이미지 생성 완료!');
  console.log('  - aicut_blog_july_main.png (700×700, 대표, CTA 유지)');
  console.log('  - aicut_blog_july_card1.png (600×338, 카드1, CTA 제거)');
  console.log('  - aicut_blog_july_card2.png (600×338, 카드2, CTA 제거)');
  console.log('  - aicut_blog_july_card3.png (600×338, 카드3, CTA 제거)');
  console.log('  - aicut_blog_july_cta.png (600×338, CTA 카드, CTA 유지)');
}

main().catch(e => console.error('❌', e.message));

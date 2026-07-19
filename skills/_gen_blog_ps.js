// 📸 성형외과 영상 마케팅 블로그 이미지 (2026-07-07)
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
  console.log('📸 성형외과 블로그 이미지 생성\n');

  const r1 = await generateCard({
    theme: 'dark_purple', width: 700, height: 700,
    badge: '🏥 성형외과 마케팅',
    main: '비포에프터 영상\n<em>숏폼</em> 하나로\n예약률이 달라집니다',
    sub: '성형외과·피부과·치과를 위한 릴스 마케팅 전략',
    cta: 'AICUT 무료상담 →',
    out: 'aicut_blog_ps_main.png'
  });
  console.log(`  ✅ ${r1.file} (${r1.sizeKB}KB)`);

  const r2 = await generateCard({
    theme: 'light_warm', width: 600, height: 338,
    badge: '📱 왜 숏폼인가',
    main: '환자는 긴 글을 안 읽습니다\n<em>영상 3초</em>가\n브로셔 10장보다 강력합니다',
    sub: '인스타 릴스·유튜브 쇼츠 중심 마케팅 트렌드',
    cta: '',
    out: 'aicut_blog_ps_card1.png'
  });
  console.log(`  ✅ ${r2.file} (${r2.sizeKB}KB)`);

  const r3 = await generateCard({
    theme: 'light_warm', width: 600, height: 338,
    badge: '🎬 촬영 부담 제로',
    main: '원장님은 수술만 하세요\n<em>촬영과 편집은</em>\n저희가 합니다',
    sub: '직원 촬영 부담 없이 매주 정기 납품',
    cta: '',
    out: 'aicut_blog_ps_card2.png'
  });
  console.log(`  ✅ ${r3.file} (${r3.sizeKB}KB)`);

  const r4 = await generateCard({
    theme: 'dark_purple', width: 600, height: 338,
    badge: '📈 실제 사례',
    main: '릴스 도입 3개월 만에\n<em>상담 예약 2배</em>\n증가한 성형외과',
    sub: '비포에프터 + 시술 소개 = 검증된 공식',
    cta: '',
    out: 'aicut_blog_ps_card3.png'
  });
  console.log(`  ✅ ${r4.file} (${r4.sizeKB}KB)`);

  const r5 = await generateCard({
    theme: 'dark_green', width: 600, height: 338,
    badge: '💬 지금 상담하세요',
    main: '병원 영상 편집,\n<em>에이컷</em>에 맡기고\n진료에 집중하세요',
    sub: '월 정기 납품 · 숏폼 전문 · 의료 마케팅 맞춤',
    cta: '카카오톡 무료상담 →',
    out: 'aicut_blog_ps_cta.png'
  });
  console.log(`  ✅ ${r5.file} (${r5.sizeKB}KB)`);

  console.log('\n✅ 전체 이미지 생성 완료!');
}

main().catch(e => console.error('❌', e.message));

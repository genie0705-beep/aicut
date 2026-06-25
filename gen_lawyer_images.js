// 변호사 포스트 이미지 5장 생성 (확정 방식)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = 'C:/Users/paul/.openclaw/workspace';

const images = [
  // 1. 대표 이미지 (700x700)
  {
    out: 'blog_img_lawyer.png', W: 700, H: 700,
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.3)',
    textColor: '#fff',
    badge: '⚖️ 전문직 마케팅',
    main: '변호사·세무사·<br>보험설계사라면<br><em>영상 마케팅</em>을<br>고민해야 하는 이유',
    sub: '신뢰는 텍스트가 아니라 영상으로 쌓인다',
    cta: 'AICUT 무료상담 →',
    pad: 60
  },
  // 2. 신규 의뢰인 40% (700x400)
  {
    out: 'body_lawyer_new_stat1.png', W: 700, H: 400,
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.3)',
    textColor: '#fff',
    badge: '📊 전문직 데이터',
    main: '<span class="num">40%</span><br>신규 의뢰인 유입',
    sub: '1위 변호사는 유튜브 채널로<br>신규 의뢰인의 40%를 유입시킵니다',
    cta: '',
    pad: 40,
    noCTA: true
  },
  // 3. 블로그 6개월 vs 숏폼 3일 (700x400)
  {
    out: 'body_lawyer_new_stat2.png', W: 700, H: 400,
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.3)',
    textColor: '#fff',
    badge: '⏱ 텍스트 vs 영상',
    main: '블로그 SEO <em>6개월</em><br>vs 숏폼 <em>3일</em>',
    sub: '숏폼은 3일 만에 조회수 1만을 넘깁니다',
    cta: '',
    pad: 40,
    noCTA: true
  },
  // 4. 체크리스트 (700x400) — light theme with custom HTML
  {
    out: 'body_lawyer_new_check.png', W: 700, H: 400,
    bg: 'linear-gradient(160deg, #f9fafb, #f0f2f5, #fce7f3)',
    glow: 'rgba(92,61,232,0.15)',
    badgeBg: 'rgba(92,61,232,0.1)', badgeColor: '#7c3aed', badgeBorder: 'rgba(92,61,232,0.25)',
    textColor: '#0f172a',
    badge: '🔍 전문직 영상 체크리스트',
    main: '',
    sub: '',
    cta: '',
    pad: 40,
    noCTA: true,
    isChecklist: true
  },
  // 5. 지금 시작해야 하는 이유 (700x400)
  {
    out: 'body_lawyer_new_reason.png', W: 700, H: 400,
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.3)',
    textColor: '#fff',
    badge: '🚀 지금 시작해야 하는 이유',
    main: '네이버·카카오<br><em>숏폼 가중치</em> 상승 중',
    sub: '지금 시작하는 사람과 1년 후 시작하는 사람의 차이는<br>채널 규모가 아니라 콘텐츠 누적량입니다',
    cta: '',
    pad: 40,
    noCTA: true
  }
];

function makeHTML(img) {
  const W = img.W, H = img.H;
  const pad = img.pad + 'px';
  const subColor = img.textColor === '#fff' ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.5)';
  const glowW = Math.round(W * 0.64);
  const glowH = Math.round(W * 0.64);

  let mainHtml = '';
  if (img.isChecklist) {
    mainHtml = `
  <div class="checklist">
    <div class="item"><span class="num">①</span> 신뢰도 — <span class="desc">영상이 텍스트보다 3배 빠름</span></div>
    <div class="item"><span class="num">②</span> 도달 — <span class="desc">숏폼 3일 = 블로그 6개월</span></div>
    <div class="item"><span class="num">③</span> 유지 — <span class="desc">월 정기 편집이 꾸준함을 만든다</span></div>
  </div>`;
  } else {
    mainHtml = `<div class="main">${img.main}</div>${img.sub ? '<div class="sub">' + img.sub + '</div>' : ''}`;
  }

  const ctaHtml = img.noCTA ? '' : '<div class="cta">' + (img.cta || 'AICUT 무료상담 →') + '</div>';
  const badgeHtml = img.badge ? '<div class="badge">' + img.badge + '</div>' : '';

  const styleExtra = img.isChecklist ? `
  .checklist { z-index:2; position:relative; text-align:left; width:100%; max-width:480px; }
  .item { color:${img.textColor}; font-size:20px; font-weight:700; line-height:1.6; padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.08); }
  .item:last-child { border-bottom:none; }
  .num { color:#7c3aed; font-weight:800; margin-right:10px; }
  .desc { color:rgba(15,23,42,0.5); font-weight:400; font-size:17px; }` : `
  .num { color:${img.textColor}; font-size:64px; font-weight:900; display:block; line-height:1; margin-bottom:4px; }`;

  const ctaStyle = img.noCTA ? '' : `
  .cta { background:linear-gradient(135deg, #5c3de8, #7c5cf6); color:#fff; font-size:20px; font-weight:700;
    padding:14px 48px; border-radius:50px; display:inline-block; z-index:2; position:relative; margin-top:14px; }`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:${W}px; height:${H}px; overflow:hidden; margin:0 auto; font-family:'Noto Sans KR', sans-serif; }
.card { width:${W}px; height:${H}px; position:relative; overflow:hidden; background:${img.bg};
  display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:${pad}; }
.glow { position:absolute; border-radius:50%;
  background:radial-gradient(circle, ${img.glow} 0%, transparent 60%);
  width:${glowW}px; height:${glowH}px; top:50%; left:50%; transform:translate(-50%,-50%); }
.badge { display:inline-block; background:${img.badgeBg}; color:${img.badgeColor}; font-size:16px; font-weight:700;
  padding:6px 20px; border:1px solid ${img.badgeBorder}; border-radius:30px; margin-bottom:18px; z-index:2; position:relative; }
.main { color:${img.textColor}; font-size:36px; font-weight:800; line-height:1.35; z-index:2; position:relative;
  margin-bottom:10px; word-break:keep-all; letter-spacing:-1px; }
.main em { color:#a78bfa; font-style:normal; }
.sub { color:${subColor}; font-size:18px; font-weight:500; line-height:1.5; z-index:2; position:relative; word-break:keep-all; }
${ctaStyle}
${styleExtra}
</style></head>
<body><div class="card"><div class="glow"></div>${badgeHtml}${mainHtml}${ctaHtml}</div></body></html>`;
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  for (const img of images) {
    const html = makeHTML(img);
    const tmpFile = path.join(DIR, '_gen_temp.html');
    fs.writeFileSync(tmpFile, html, 'utf8');

    const W = img.W, H = img.H;
    await page.setViewportSize({ width: W, height: H });
    await page.goto('file:///' + DIR + '/_gen_temp.html', { waitUntil: 'networkidle', timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2000);

    const outPath = path.join(DIR, img.out);
    await page.screenshot({ path: outPath, fullPage: false });
    const size = fs.statSync(outPath).size;
    console.log('✅ ' + img.out + ' (' + Math.round(size/1024) + 'KB)');
    fs.unlinkSync(tmpFile);
  }

  await page.close();
  await b.close();
  console.log('\n🎉 변호사 포스트 이미지 5장 생성 완료!');
})();

// 학원 여름방학 특강 영상 마케팅 — 이미지 5장 생성
// card1~card3: CTA 버튼 + AICUT 문구 제거
// main + cta: CTA 버튼 유지
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const W = 700, H = 700, CW = 600, CH = 338;

function render(opt) {
  const isMain = opt.type === 'main';
  const isCta = opt.type === 'cta';
  const isDark = opt.theme === 'dark_purple' || opt.theme === 'dark_green';
  const textColor = isDark ? '#FFFFFF' : '#1a1a2e';
  const subColor = isDark ? '#c0c0d0' : '#666680';
  const iW = isMain ? W : CW;
  const iH = isMain ? H : CH;
  const pad = isMain ? 60 : 40;
  const mainFont = isMain ? 42 : 36;
  const badgeFont = isMain ? 16 : 14;
  const subFont = isMain ? 18 : 16;
  const ctaFont = isMain ? 20 : 18;

  let ctaHtml = '';
  if (isMain || isCta) {
    ctaHtml = `<div class="cta">${opt.cta || 'AICUT →'}</div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${opt.bg};display:flex;align-items:center;justify-content:center;}
.card{width:${iW}px;height:${iH}px;overflow:hidden;background:${opt.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${pad}px;position:relative;}
.card .glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(iW*0.64)}px;height:${Math.round(iW*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%);}
.badge{background:${opt.accent};color:#fff;padding:${isMain?'8px 24px':'6px 18px'};border-radius:20px;font-size:${badgeFont}px;font-weight:700;margin-bottom:20px;letter-spacing:1px;z-index:2;position:relative;}
.main{color:${textColor};font-size:${mainFont}px;font-weight:900;line-height:1.3;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;}
.main em{color:${opt.accent};font-style:normal;}
.sub{color:${subColor};font-size:${subFont}px;font-weight:400;line-height:1.5;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center;margin-top:12px;}
.cta{background:linear-gradient(135deg,${opt.accent},#7c3aed);color:#fff;font-size:${ctaFont}px;font-weight:700;padding:${isMain?'14px 48px':'10px 36px'};border-radius:50px;display:inline-block;margin-top:20px;z-index:2;position:relative;}
</style></head><body>
<div class="card"><div class="glow"></div>
<div class="badge">${opt.badge}</div>
<div class="main">${opt.main.replace(/\n/g, '<br>')}</div>
<div class="sub">${opt.sub}</div>${ctaHtml}
</div></body></html>`;
}

async function main() {
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];

  const images = [
    // 1. 대표 이미지 (700×700, light_cyan, CTA 유지)
    {
      out: 'aicut_blog_academy_main.png', type: 'main',
      bg: 'linear-gradient(160deg, #f0f7ff, #e0edfa, #d0e3f5)',
      accent: '#0284c7',
      badge: '📚 학원 영상 마케팅',
      main: '여름방학 특강\n<em>숏폼 영상</em>으로\n홍보하세요',
      sub: '전단지·문자 대신 영상으로\n학원 분위기를 전달하는 법',
      cta: 'AICUT 무료상담 →',
    },
    // 2. 문제 공감 (600×338, light_warm, CTA 제거)
    {
      out: 'aicut_blog_academy_card1.png', type: 'card',
      bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)',
      accent: '#b8860b',
      badge: '방학 홍보 고민',
      main: '"또 전단지 뿌리고\n문자 돌릴 건가요?"',
      sub: '효과는 점점 떨어지는데\n방법은 똑같은 학원 홍보의 현실',
    },
    // 3. 해결책 (600×338, light_cyan, CTA 제거)
    {
      out: 'aicut_blog_academy_card2.png', type: 'card',
      bg: 'linear-gradient(160deg, #f0f7ff, #e0edfa, #d0e3f5)',
      accent: '#0284c7',
      badge: '숏폼 마케팅',
      main: '수업 분위기를\n30초 안에 보여주면?',
      sub: '학원의 진짜 매력은\n영상으로 전달할 수 있습니다',
    },
    // 4. 실제 사례 (600×338, light_warm, CTA 제거)
    {
      out: 'aicut_blog_academy_card3.png', type: 'card',
      bg: 'linear-gradient(160deg, #fdfaf2, #f8f3ea, #f0eadc)',
      accent: '#b8860b',
      badge: '도입 후기',
      main: '"숏폼 하나 올렸는데\n문의가 3배 늘었어요"',
      sub: '전단지 3,000장보다\n영상 하나가 더 효과적이었던 이유',
    },
    // 5. CTA (600×338, light_cyan, CTA 유지)
    {
      out: 'aicut_blog_academy_cta.png', type: 'cta',
      bg: 'linear-gradient(160deg, #f0f7ff, #e0edfa, #d0e3f5)',
      accent: '#0284c7',
      badge: '지금 시작하세요',
      main: '편집 걱정은\n<em>에이컷</em>에 맡기세요',
      sub: '촬영만 하면 편집은 다 해드립니다',
      cta: 'AICUT 무료상담 →',
    },
  ];

  for (const img of images) {
    const html = render(img);
    const tmpFile = path.join(__dirname, '..', '_tmp_' + img.out.replace('.png', '.html'));
    fs.writeFileSync(tmpFile, html);
    const iW = img.type === 'main' ? W : CW;
    const iH = img.type === 'main' ? H : CH;
    const p = await ctx.newPage();
    await p.setViewportSize({ width: iW, height: iH });
    await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(2000);
    const outPath = path.join(__dirname, '..', img.out);
    await p.screenshot({ path: outPath, fullPage: false });
    const size = fs.statSync(outPath).size;
    console.log(`✅ ${img.out}  (${Math.round(size/1024)}KB)`);
    await p.close();
    fs.unlinkSync(tmpFile);
  }

  await b.close();
  console.log('🎉 이미지 5장 생성 완료');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

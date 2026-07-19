const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

const THEMES = {
  dark_purple: { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.55)', badgeBg:'rgba(167,139,250,0.15)', badgeColor:'#a78bfa', badgeBorder:'rgba(167,139,250,0.3)', textColor:'#fff', accent:'#a78bfa', subColor:'rgba(255,255,255,0.6)', ctaFrom:'#5c3de8', ctaTo:'#7c5cf6' },
  light_cyan: { bg:'linear-gradient(160deg,#f0f4f8,#e8ecf5,#dce5f5)', glow:'rgba(6,182,212,0.18)', badgeBg:'rgba(6,182,212,0.1)', badgeColor:'#0891b2', badgeBorder:'rgba(6,182,212,0.25)', textColor:'#0f172a', accent:'#0891b2', subColor:'rgba(15,23,42,0.5)', ctaFrom:'#0891b2', ctaTo:'#5c3de8' },
  light_pink: { bg:'linear-gradient(160deg,#faf5f7,#f8edf5,#fce7f3)', glow:'rgba(236,72,153,0.16)', badgeBg:'rgba(236,72,153,0.1)', badgeColor:'#db2777', badgeBorder:'rgba(236,72,153,0.25)', textColor:'#0f172a', accent:'#db2777', subColor:'rgba(15,23,42,0.5)', ctaFrom:'#db2777', ctaTo:'#5c3de8' },
  dark_green: { bg:'linear-gradient(160deg,#0a1628,#0f2847,#064e3b)', glow:'rgba(52,211,153,0.3)', badgeBg:'rgba(52,211,153,0.15)', badgeColor:'#34d399', badgeBorder:'rgba(52,211,153,0.3)', textColor:'#fff', accent:'#34d399', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#059669', ctaTo:'#34d399' }
};

async function measureWithRef(refFile, ourConfigs) {
  // First, measure REF image
  const refData = await analyzeImage(refFile);
  console.log(`REF ${refFile}: badge=${refData.badgeCenter}%, ctaTop=${refData.ctaTop}%, ctaBot=${refData.ctaBot}%, ctaCenter=${refData.ctaCenter}%, padBottom=${refData.padBottom}%`);
  
  // Generate and measure our images
  const results = [];
  for (const cfg of ourConfigs) {
    const { distances, image } = await generateAndMeasure(cfg, refData);
    console.log(`${cfg.label}: 배지차이=${distances.badgeDelta}%p, CTA차이=${distances.ctaDelta}%p, 하단여백차이=${distances.padDelta}%p`);
    results.push({ cfg, distances, image });
  }
  return results;
}

async function analyzeImage(filePath) {
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  const fullPath = path.join(W, filePath);
  await page.goto('file:///' + fullPath.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(500);
  
  const data = await page.evaluate(() => {
    const img = document.querySelector('img');
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    const g = (x,y) => { const i=(y*W+x)*4; return {r:d[i],g:d[i+1],b:d[i+2]}; };
    
    // Find the CTA button by scanning for the purple gradient rectangle
    let ctaTop = -1, ctaBottom = -1;
    for (let y = Math.floor(H*0.5); y < H; y++) {
      let px = 0;
      for (let x = Math.floor(W*0.25); x < Math.floor(W*0.75); x++) {
        const p = g(x, y);
        if (p.b > 160 && p.r > 40 && p.r < 180) px++;
      }
      if (px > 30) { if (ctaTop === -1) ctaTop = y; ctaBottom = y; }
    }
    
    // Find badge (purple text at top)
    let badgeY = -1;
    for (let y = Math.floor(H*0.05); y < Math.floor(H*0.35); y++) {
      let px = 0;
      for (let x = Math.floor(W*0.3); x < Math.floor(W*0.7); x++) {
        const p = g(x, y);
        if (p.b > 150 && p.r > 100 && p.r < 190 && p.g > 90 && p.g < 190) px++;
      }
      if (px > 10) { badgeY = y; break; }
    }
    
    // Find bottom padding (last non-bg row)
    let lastContent = H - 1;
    for (let y = H-1; y >= Math.floor(H*0.5); y--) {
      let px = 0;
      for (let x = Math.floor(W*0.25); x < Math.floor(W*0.75); x++) {
        const p = g(x, y);
        const avg = (p.r+p.g+p.b)/3;
        if (avg > 40) px++;
      }
      if (px > 30) { lastContent = y; break; }
    }
    
    return {
      W, H,
      badgeCenter: badgeY >= 0 ? Math.round((badgeY + 12) / H * 100) : -1,
      ctaTop: ctaTop >= 0 ? Math.round(ctaTop / H * 100) : -1,
      ctaBot: ctaBottom >= 0 ? Math.round(ctaBottom / H * 100) : -1,
      ctaCenter: ctaTop >= 0 ? Math.round((ctaTop + ctaBottom) / 2 / H * 100) : -1,
      ctaHeight: ctaTop >= 0 ? Math.round((ctaBottom - ctaTop) / H * 100) : -1,
      padBottom: Math.round((H - 1 - lastContent) / H * 100),
    };
  });
  
  await page.close();
  await b.close();
  return data;
}

async function generateAndMeasure(cfg, ref) {
  // Generate image
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  const iW = cfg.width || 700;
  const iH = cfg.height || 700;
  const isCard = iW > iH;
  const T = THEMES[cfg.theme] || THEMES.dark_purple;
  
  const badgeMt = isCard ? Math.round(iH * (cfg.badgeMT || 0.10)) : Math.round(iH * (cfg.badgeMT || 0.13));
  const mainFont = cfg.mainFont || (isCard ? 34 : 40);
  const mainMt = Math.round(iH * (cfg.mainMT || 0.06));
  const mainMb = Math.round(iH * (cfg.mainMB || 0.03));
  const subFont = cfg.subFont || (isCard ? 14 : 16);
  const subMb = Math.round(iH * (cfg.subMB || 0.05));
  const ctaFont = cfg.ctaFont || (isCard ? 14 : 16);
  const ctaMb = Math.round(iH * (cfg.ctaMB || 0.15));

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${iW}px;height:${iH}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg}}
.card{width:${iW}px;height:${iH}px;position:relative;overflow:hidden;background:${T.bg};
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:0;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);
  width:${iW}px;height:${Math.round(iH*1.1)}px;top:32%;left:50%;transform:translate(-50%,-50%);}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};
  font-size:${isCard?14:15}px;font-weight:700;padding:${isCard?'5px 18px':'6px 20px'};
  border:1px solid ${T.badgeBorder};border-radius:30px;z-index:2;position:relative;
  margin-top:${badgeMt}px;letter-spacing:-0.3px;backdrop-filter:blur(1px);}
.main{color:${T.textColor};font-size:${mainFont}px;font-weight:800;line-height:1.35;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.5px;max-width:90%;
  margin-top:${mainMt}px;margin-bottom:${mainMb}px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${subFont}px;font-weight:400;line-height:1.4;
  z-index:2;position:relative;word-break:keep-all;letter-spacing:-0.2px;max-width:85%;
  margin-bottom:${subMb}px;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;
  font-size:${ctaFont}px;font-weight:700;padding:${isCard?'9px 32px':'11px 38px'};
  border-radius:50px;z-index:2;position:relative;display:inline-block;
  letter-spacing:-0.3px;margin-bottom:${ctaMb}px;
  box-shadow:0 2px 16px rgba(92,61,232,0.25);}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${cfg.badge}</div>
  <div class="main">${cfg.main.replace(/\n/g, '<br>')}</div>
  <div class="sub">${cfg.sub}</div>
  <div class="cta">${cfg.cta||'AICUT →'}</div>
</div></body></html>`;

  const tmpFile = path.join(W, '_tmp_measure.html');
  fs.writeFileSync(tmpFile, html);
  await page.setViewportSize({ width: iW, height: iH });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  
  const outFile = 'aicut_blog_estate_' + cfg.label + '.png';
  const outPath = path.join(W, outFile);
  await page.screenshot({ path: outPath, fullPage: false });
  
  await page.close();
  await b.close();
  fs.unlinkSync(tmpFile);

  // Now analyze the generated image
  const imgData = await analyzeImage(outFile);
  
  return {
    distances: {
      badgeDelta: ref.badgeCenter >= 0 && imgData.badgeCenter >= 0 ? imgData.badgeCenter - ref.badgeCenter : 0,
      ctaDelta: ref.ctaCenter >= 0 && imgData.ctaCenter >= 0 ? imgData.ctaCenter - ref.ctaCenter : 0,
      padDelta: ref.padBottom >= 0 && imgData.padBottom >= 0 ? imgData.padBottom - ref.padBottom : 0,
    },
    image: imgData
  };
}

async function main() {
  // REF target values from previous runs
  const REF = {
    main: { badgeCenter: 19, ctaCenter: 70, padBottom: 17 },
    card: { badgeCenter: 18, ctaCenter: 62, padBottom: 15 }
  };
  
  // Iteration 1: current best guess params
  const configs = [
    { label:'main', theme:'dark_purple', badge:'🏢 분양 마케팅', width:700, height:700,
      main:'분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
      sub:'직접 부딪힌 3개월, 솔직한 후기', cta:'AICUT 무료상담 →',
      badgeMT:0.13, mainFont:40, mainMT:0.06, mainMB:0.03, subFont:16, subMB:0.05, ctaFont:16, ctaMB:0.15
    },
    { label:'cycle', theme:'light_cyan', badge:'🔄 3개월의 기록', width:700, height:400,
      main:'1달 차: 자신감\n2달 차: 좌절\n<em>3달 차: 현타</em>',
      sub:'이 패턴, 공감되시나요? 😅', cta:'AICUT 해결 →',
      badgeMT:0.10, mainFont:34, mainMT:0.06, mainMB:0.03, subFont:14, subMB:0.05, ctaFont:14, ctaMB:0.15
    },
    { label:'cost', theme:'dark_green', badge:'💰 현실 계산', width:700, height:400,
      main:'인력 1명 300만원\n<em>외주는 절반</em>\n퀄리티는 더 높은데',
      sub:'직접 하는 게 오히려 손해였다 🤯', cta:'AICUT 견적 →',
      badgeMT:0.10, mainFont:34, mainMT:0.06, mainMB:0.03, subFont:14, subMB:0.05, ctaFont:14, ctaMB:0.15
    },
  ];
  
  console.log('=== Iteration 1 ===');
  for (const cfg of configs) {
    const ref = cfg.label === 'main' ? REF.main : REF.card;
    const result = await generateAndMeasure(cfg, ref);
    console.log(`${cfg.label}: badge=${ref.badgeCenter}(goal) vs ${result.image.badgeCenter}(actual) delta=${result.distances.badgeDelta}`);
    console.log(`${cfg.label}: cta=${ref.ctaCenter}(goal) vs ${result.image.ctaCenter}(actual) delta=${result.distances.ctaDelta}`);
    console.log(`${cfg.label}: padBot=${ref.padBottom}(goal) vs ${result.image.padBottom}(actual) delta=${result.distances.padDelta}`);
  }
  console.log('\n=== 완료 ===');
}

main().catch(e => console.error(e));

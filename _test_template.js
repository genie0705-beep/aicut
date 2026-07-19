const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

// === THEMES (색상만 고정) ===
const THEMES = {
  dark_purple: { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.55)', badgeBg:'rgba(167,139,250,0.15)', badgeColor:'#a78bfa', badgeBorder:'rgba(167,139,250,0.3)', textColor:'#fff', accent:'#a78bfa', subColor:'rgba(255,255,255,0.6)', ctaFrom:'#5c3de8', ctaTo:'#7c5cf6' },
  light_warm: { bg:'linear-gradient(160deg,#fdfaf2,#f8f3ea,#f0eadc)', glow:'rgba(180,155,120,0.12)', badgeBg:'rgba(180,155,120,0.12)', badgeColor:'#8b7355', badgeBorder:'rgba(180,155,120,0.25)', textColor:'#3d3028', accent:'#8b7355', subColor:'rgba(61,48,40,0.5)', ctaFrom:'#8b7355', ctaTo:'#5c3de8' },
  dark_green: { bg:'linear-gradient(160deg,#0a1628,#0f2847,#064e3b)', glow:'rgba(52,211,153,0.3)', badgeBg:'rgba(52,211,153,0.15)', badgeColor:'#34d399', badgeBorder:'rgba(52,211,153,0.3)', textColor:'#fff', accent:'#34d399', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#059669', ctaTo:'#34d399' },
};

// === TEMPLATES: 모든 수치 px 고정 (절대 변경 안 됨) ===
const TEMPLATES = {
  main: {
    width: 700, height: 700, theme: 'dark_purple',
    badgeFont: 14, badgePadding: '6px 20px',
    mainFont: 38, mainLineHeight: 1.35,
    subFont: 15, subLineHeight: 1.4,
    ctaFont: 15, ctaPadding: '11px 38px',
    gap: 42,  // 요소 간 간격 (px, 고정!)
    glowWidth: 700, glowHeight: 700,
    contentMaxWidth: '88%',
  },
  card: {
    width: 800, height: 450, theme: 'light_warm',
    badgeFont: 13, badgePadding: '5px 18px',
    mainFont: 32, mainLineHeight: 1.35,
    subFont: 13, subLineHeight: 1.4,
    ctaFont: 13, ctaPadding: '9px 32px',
    gap: 27,
    glowWidth: 800, glowHeight: 450,
    contentMaxWidth: '88%',
  },
  cardDark: {
    width: 800, height: 450, theme: 'dark_purple',
    badgeFont: 13, badgePadding: '5px 18px',
    mainFont: 32, mainLineHeight: 1.35,
    subFont: 13, subLineHeight: 1.4,
    ctaFont: 13, ctaPadding: '9px 32px',
    gap: 27,
    glowWidth: 800, glowHeight: 450,
    contentMaxWidth: '88%',
  },
  ctaCard: {
    width: 800, height: 450, theme: 'dark_green',
    badgeFont: 13, badgePadding: '5px 18px',
    mainFont: 32, mainLineHeight: 1.35,
    subFont: 13, subLineHeight: 1.4,
    ctaFont: 13, ctaPadding: '9px 32px',
    gap: 27,
    glowWidth: 800, glowHeight: 450,
    contentMaxWidth: '88%',
  }
};

/**
 * 템플릿 기반 이미지 생성 — 모든 수치 고정, 텍스트만 변경 가능
 */
async function makeTemplateImage(tplName, badge, main, sub, cta, outFile) {
  const TPL = TEMPLATES[tplName];
  if (!TPL) throw new Error(`Unknown template: ${tplName}`);
  
  const T = THEMES[TPL.theme];
  const iW = TPL.width, iH = TPL.height;
  const GAP = TPL.gap;
  const F = TPL;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${iW}px;height:${iH}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;background:${T.bg}}
.card{width:${iW}px;height:${iH}px;position:relative;overflow:hidden;background:${T.bg};display:flex;align-items:center;justify-content:center;}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${T.glow} 0%,transparent 60%);width:${F.glowWidth}px;height:${F.glowHeight}px;top:35%;left:50%;transform:translate(-50%,-50%);}
.content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;gap:${GAP}px;max-width:${F.contentMaxWidth};}
.badge{display:inline-block;background:${T.badgeBg};color:${T.badgeColor};font-size:${F.badgeFont}px;font-weight:700;padding:${F.badgePadding};border:1px solid ${T.badgeBorder};border-radius:30px;letter-spacing:-0.3px;backdrop-filter:blur(1px);}
.main{color:${T.textColor};font-size:${F.mainFont}px;font-weight:800;line-height:${F.mainLineHeight};word-break:keep-all;letter-spacing:-0.5px;}
.main em{color:${T.accent};font-style:normal;}
.sub{color:${T.subColor};font-size:${F.subFont}px;font-weight:400;line-height:${F.subLineHeight};word-break:keep-all;letter-spacing:-0.2px;}
.cta{background:linear-gradient(135deg,${T.ctaFrom},${T.ctaTo});color:#fff;font-size:${F.ctaFont}px;font-weight:700;padding:${F.ctaPadding};border-radius:50px;display:inline-block;letter-spacing:-0.3px;box-shadow:0 2px 16px rgba(92,61,232,0.25);}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="content">
    <div class="badge">${badge.replace(/\n/g, '<br>')}</div>
    <div class="main">${main.replace(/\n/g, '<br>')}</div>
    <div class="sub">${sub.replace(/\n/g, '<br>')}</div>
    <div class="cta">${cta || 'AICUT →'}</div>
  </div>
</div></body></html>`;

  const tmp = path.join(W, '_tmp_tpl.html');
  fs.writeFileSync(tmp, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const c = b.contexts()[0];
  const p = await c.newPage();
  await p.setViewportSize({width:iW, height:iH});
  await p.goto('file:///'+tmp.replace(/\\/g,'/'), {waitUntil:'networkidle', timeout:15000});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const out = path.join(W, outFile || '_test_tpl.png');
  await p.screenshot({path: out, fullPage: false});
  await p.close(); await b.close(); fs.unlinkSync(tmp);
  return out;
}

// === 테스트 ===
async function runTest() {
  console.log('=== 템플릿 고정값 테스트 ===\n');
  
  // 첫 번째 실행
  const optOut = '_test_template.png';
  const r1 = await makeTemplateImage('main',
    '🏢 분양 마케팅',
    '분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
    '직접 부딪힌 3개월, 솔직한 후기',
    'AICUT 무료상담 →',
    '_test_a.png'
  );
  const hash1 = crypto.createHash('sha256').update(fs.readFileSync(r1)).digest('hex');
  console.log(`1회차: ${path.basename(r1)} → SHA256: ${hash1.substring(0, 16)}...`);
  
  // 두 번째 실행 (완전히 동일한 입력)
  const r2 = await makeTemplateImage('main',
    '🏢 분양 마케팅',
    '분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배 올린 썰',
    '직접 부딪힌 3개월, 솔직한 후기',
    'AICUT 무료상담 →',
    '_test_b.png'
  );
  const hash2 = crypto.createHash('sha256').update(fs.readFileSync(r2)).digest('hex');
  console.log(`2회차: ${path.basename(r2)} → SHA256: ${hash2.substring(0, 16)}...`);
  
  // 결과 비교
  const match = hash1 === hash2;
  console.log(`\n✅ 해시 일치: ${match ? 'YES (100% 동일!)' : 'NO'}`);
  console.log(`SHA256: ${hash1}`);
  console.log(`SHA256: ${hash2}`);
  
  // 모든 템플릿 타입 테스트
  console.log('\n=== 모든 템플릿 테스트 ===');
  const templates = [
    ['main', '🏢 분양', '대표\n테스트', '설명', 'CTA'],
    ['card', '🔄 기록', '1달 차\n2달 차\n3달 차', '패턴', 'CTA'],
    ['cardDark', '💰 계산', '300만원\n<em>절반</em>', '손해', 'CTA'],
    ['ctaCard', '🚀 시작', '준비\n<em>에이컷</em>', '문의', '상담'],
  ];
  
  let idx = 0;
  for (const [tpl, badge, main, sub, cta] of templates) {
    const f1 = await makeTemplateImage(tpl, badge, main, sub, cta, `_test_tpl_${idx}a.png`);
    const f2 = await makeTemplateImage(tpl, badge, main, sub, cta, `_test_tpl_${idx}b.png`);
    idx++;
    const h1 = crypto.createHash('sha256').update(fs.readFileSync(f1)).digest('hex');
    const h2 = crypto.createHash('sha256').update(fs.readFileSync(f2)).digest('hex');
    console.log(`${tpl}: ${h1 === h2 ? '✅' : '❌'} (${h1 === h2 ? '' : '불일치!'})`);
  }
  
  console.log('\n=== 완료 ===');
}

runTest().catch(e => console.error('ERROR:', e));

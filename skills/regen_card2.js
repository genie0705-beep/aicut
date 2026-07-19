const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function makeCard(theme, badge, main, sub, outFile) {
  const W = 600, H = 338;
  const THEMES = {
    dark_purple: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)', glow: 'rgba(92,61,232,0.5)', textColor: '#fff', accent: '#a78bfa', subColor: 'rgba(255,255,255,0.6)' }
  };
  const T = THEMES[theme];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${T.bg};display:flex;align-items:center;justify-content:center}
.card{width:${W}px;height:${H}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px;position:relative}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(W*0.64)}px;height:${Math.round(W*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%)}
.badge{display:inline-block;background:rgba(167,139,250,0.15);color:#a78bfa;font-size:14px;font-weight:700;padding:6px 18px;border:1px solid rgba(167,139,250,0.3);border-radius:30px;margin-bottom:14px;z-index:2;position:relative}
.main{color:#fff;font-size:36px;font-weight:800;line-height:1.3;z-index:2;position:relative;width:100%;text-align:center;margin-bottom:12px}
.main em{color:${T.accent};font-style:normal}
.sub{color:${T.subColor};font-size:15px;font-weight:500;line-height:1.5;z-index:2;position:relative;width:100%;text-align:center;word-break:keep-all}
</style></head><body>
<div class="card"><div class="glow"></div><div class="badge">${badge}</div><div class="main">${main.replace(/\n/g, '<br>')}</div><div class="sub">${sub}</div></div>
</body></html>`;

  const tmpFile = path.join(__dirname, '..', '_tmp_fp2.html');
  fs.writeFileSync(tmpFile, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const p = await b.contexts()[0].newPage();
  await p.setViewportSize({ width: W, height: H });
  await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const outPath = path.join(__dirname, '..', outFile);
  await p.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await p.close(); await b.close(); fs.unlinkSync(tmpFile);
  console.log('✅ ' + outFile + ' (' + Math.round(size/1024) + 'KB)');
}

async function main() {
  console.log('card2 이미지 재생성 (FP → 보험 영업)...');
  await makeCard(
    'dark_purple',
    '🚀 하반기 전략',
    '하반기 보험 영업\n<em>숏폼 영상</em>으로\n준비하는 방법',
    '릴스·쇼츠·틱톡, 채널별 최적화 전략',
    'aicut_blog_fp_card2.png'
  );
  console.log('✅ card2 FP 제거 완료');
}
main().catch(e => console.error('❌', e.message));

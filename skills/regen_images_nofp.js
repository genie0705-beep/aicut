const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { makeCardNoCta } = require('./gen_noc.js');

async function makeMainImage(badge, main, sub, cta, outFile) {
  const w = 700, h = 700;
  const bg = 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)';
  const accent = '#a78bfa';
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${bg};display:flex;align-items:center;justify-content:center}
.card{width:${w}px;height:${h}px;overflow:hidden;background:${bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;position:relative}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(w*0.64)}px;height:${Math.round(w*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%)}
.badge{background:${accent};color:#fff;padding:8px 24px;border-radius:20px;font-size:16px;font-weight:700;margin-bottom:20px;z-index:2;position:relative}
.main{color:#fff;font-size:42px;font-weight:900;line-height:1.3;margin-bottom:16px;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center}
.main em{color:${accent};font-style:normal}
.sub{color:rgba(255,255,255,0.6);font-size:18px;font-weight:400;line-height:1.5;margin-bottom:0;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center}
.cta{background:linear-gradient(135deg,${accent},#7c3aed);color:#fff;font-size:20px;font-weight:700;padding:14px 48px;border-radius:50px;display:inline-block;margin-top:28px;z-index:2;position:relative}
</style></head><body>
<div class="card"><div class="glow"></div><div class="badge">${badge}</div><div class="main">${main.replace(/\n/g, '<br>')}</div><div class="sub">${sub}</div><div class="cta">${cta}</div></div>
</body></html>`;

  const tmpFile = path.join(__dirname, '..', '_tmp_fp.html');
  fs.writeFileSync(tmpFile, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const p = await b.contexts()[0].newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const outPath = path.join(__dirname, '..', outFile);
  await p.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await p.close(); await b.close(); fs.unlinkSync(tmpFile);
  console.log('  ✅ ' + outFile + ' (' + Math.round(size/1024) + 'KB)');
}

async function main() {
  console.log('main 이미지 재생성 (FP 제거)...');
  await makeMainImage(
    '보험 영업',
    '보험 영업,\n사회 초년생이라면\n<em>숏폼 마케팅</em>으로\n시작하세요',
    'SNS에서 신뢰를 쌓는 시대, 지금 시작하세요',
    'AICUT 무료상담 →',
    'aicut_blog_fp_main.png'
  );

  console.log('card2 이미지 재생성 (FP 제거)...');
  await makeCardNoCta(
    'dark_purple',
    '🚀 하반기 전략',
    '하반기 보험 영업\n<em>숏폼 영상</em>으로\n준비하는 방법',
    '릴스·쇼츠·틱톡, 채널별 최적화 전략',
    'aicut_blog_fp_card2.png'
  );

  console.log('\n✅ 이미지 재생성 완료 (FP 제거됨)');
}
main().catch(e => console.error('❌', e.message));

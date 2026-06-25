const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const W = 700;
const H = 700;

async function makeCard() {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif}
.card{width:${W}px;height:${H}px;position:relative;overflow:hidden;
  background:linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69);
  display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:50px}
.glow{position:absolute;border-radius:50%;
  background:radial-gradient(circle,rgba(92,61,232,0.4) 0%,transparent 60%);
  width:420px;height:420px;top:50%;left:50%;transform:translate(-50%,-50%)}
.badge{display:inline-block;background:rgba(167,139,250,0.15);color:#a78bfa;
  font-size:16px;font-weight:700;padding:8px 20px;border:1px solid rgba(167,139,250,0.3);
  border-radius:30px;margin-bottom:24px;z-index:2;position:relative}
.main{color:#fff;font-size:34px;font-weight:800;line-height:1.35;
  z-index:2;position:relative;margin-bottom:14px;word-break:keep-all;letter-spacing:-1px}
.main em{color:#a78bfa;font-style:normal}
.sub{color:rgba(255,255,255,0.65);font-size:16px;font-weight:500;line-height:1.5;
  z-index:2;position:relative;margin-bottom:24px;word-break:keep-all}
.cta{background:linear-gradient(135deg,#5c3de8,#7c5cf6);color:#fff;
  font-size:17px;font-weight:700;padding:12px 40px;border-radius:50px;
  z-index:2;position:relative;display:inline-block}
.brand{position:absolute;bottom:22px;right:28px;color:rgba(255,255,255,0.2);
  font-size:12px;font-weight:700;z-index:2;letter-spacing:2px}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">📅 하반기 마케팅 전략</div>
  <div class="main">하반기 마케팅,<br>지금 <em>영상 편집 외주</em>를<br>정해야 하는 이유</div>
  <div class="sub">6월이 완벽한 타이밍인 3가지 이유</div>
  <div class="cta">🔗 프로필 링크에서 확인</div>
  <div class="brand">AICUT</div>
</div></body></html>`;

  const tmpFile = path.join(__dirname, '_tmp_card700.html');
  fs.writeFileSync(tmpFile, html);

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(function() { return document.fonts.ready; });
  await page.waitForTimeout(3000);

  const outPath = path.join(__dirname, 'insta_card_h2_700.png');
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await page.close();
  await b.close();
  fs.unlinkSync(tmpFile);

  return { file: 'insta_card_h2_700.png', sizeKB: Math.round(size / 1024) };
}

(async () => {
  console.log('700x700 이미지 생성...');
  var r = await makeCard();
  console.log('✅ 생성 완료:', r.file, '(' + r.sizeKB + 'KB)');
})();

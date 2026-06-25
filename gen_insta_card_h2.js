const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const W = 1080;
const H = 1080;

async function makeCard(badge, mainLines, subLines, cta, outFile, isDark) {
  const bg = isDark
    ? 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)'
    : 'linear-gradient(160deg, #f9fafb, #f0f2f5, #e8ecf5)';
  const textColor = isDark ? '#fff' : '#0f172a';
  const subColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.5)';
  const accent = isDark ? '#a78bfa' : '#06b6d4';
  const badgeBg = isDark ? 'rgba(167,139,250,0.15)' : 'rgba(6,182,212,0.1)';
  const badgeColor = isDark ? '#a78bfa' : '#0891b2';
  const badgeBorder = isDark ? 'rgba(167,139,250,0.3)' : 'rgba(6,182,212,0.25)';
  const ctaFrom = isDark ? '#5c3de8' : '#06b6d4';
  const ctaTo = isDark ? '#7c5cf6' : '#5c3de8';
  const glow = isDark ? 'rgba(92,61,232,0.4)' : 'rgba(6,182,212,0.2)';

  const mainHtml = mainLines.map(function(l) { return l; }).join('<br>');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif}
.card{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:${bg};
  display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:70px}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,${glow} 0%,transparent 60%);
  width:640px;height:640px;top:50%;left:50%;transform:translate(-50%,-50%)}
.badge{display:inline-block;background:${badgeBg};color:${badgeColor};
  font-size:20px;font-weight:700;padding:10px 26px;border:1px solid ${badgeBorder};
  border-radius:30px;margin-bottom:30px;z-index:2;position:relative}
.main{color:${textColor};font-size:52px;font-weight:800;line-height:1.35;
  z-index:2;position:relative;margin-bottom:16px;word-break:keep-all;letter-spacing:-1.5px}
.main em{color:${accent};font-style:normal}
.sub{color:${subColor};font-size:22px;font-weight:500;line-height:1.5;
  z-index:2;position:relative;margin-bottom:36px;word-break:keep-all}
.cta{background:linear-gradient(135deg,${ctaFrom},${ctaTo});color:#fff;
  font-size:22px;font-weight:700;padding:16px 52px;border-radius:50px;
  z-index:2;position:relative;display:inline-block}
.brand{position:absolute;bottom:32px;right:38px;color:${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'};
  font-size:15px;font-weight:700;z-index:2;letter-spacing:2.5px}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${badge}</div>
  <div class="main">${mainHtml}</div>
  <div class="sub">${subLines}</div>
  <div class="cta">${cta}</div>
  <div class="brand">AICUT</div>
</div></body></html>`;

  const tmpFile = path.join(__dirname, '_tmp_card.html');
  fs.writeFileSync(tmpFile, html);

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(function() { return document.fonts.ready; });
  await page.waitForTimeout(3000);

  const outPath = path.join(__dirname, outFile);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await page.close();
  await b.close();
  fs.unlinkSync(tmpFile);

  return { file: outFile, sizeKB: Math.round(size / 1024) };
}

(async () => {
  console.log('=== 인스타 카드뉴스 이미지 생성 ===\n');

  // 카드 1: 다크퍼플 (메인) - 1080x1080
  var r1 = await makeCard(
    '📅 하반기 마케팅 전략',
    ['하반기 마케팅,', '지금 <em>영상 편집 외주</em>를', '정해야 하는 이유'],
    '6월이 완벽한 타이밍인 3가지 이유',
    '🔗 프로필 링크에서 확인',
    'insta_card_h2_01.png',
    true
  );
  console.log('1/1 ✅', r1.file, '(' + r1.sizeKB + 'KB)');

  console.log('\n✅ 모든 이미지 생성 완료');
})();

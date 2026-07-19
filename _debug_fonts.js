const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
body{width:700px;height:700px;margin:0;overflow:hidden;background:linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69);display:flex;align-items:center;justify-content:center;color:white;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;font-size:48px;font-weight:800;flex-direction:column;text-align:center;padding:60px}
.badge{background:rgba(167,139,250,0.15);color:#a78bfa;font-size:18px;font-weight:700;padding:8px 24px;border-radius:30px;margin-bottom:28px}
.main{font-size:48px;line-height:1.35;margin-bottom:16px}
.sub{font-size:20px;color:rgba(255,255,255,0.6);margin-bottom:32px}
.cta{background:linear-gradient(135deg,#5c3de8,#7c5cf6);color:#fff;font-size:20px;font-weight:700;padding:14px 48px;border-radius:50px;display:inline-block}
</style></head><body>
<div class="badge">☀️ 2026년 장마기간</div>
<div class="main">장마가 끝나면<br><em style="color:#a78bfa;font-style:normal">하반기</em>가 시작됩니다</div>
<div class="sub">하반기 영상 마케팅, 장마철이 골든타임입니다</div>
<div class="cta">AICUT 무료상담 →</div>
</body></html>`;

  const tmpFile = path.join(__dirname, '_tmp_debug.html');
  fs.writeFileSync(tmpFile, html);
  
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(3000);
  
  // Check font loading
  const fontStatus = await page.evaluate(() => {
    return document.fonts.ready.then(() => {
      const items = [];
      document.fonts.forEach(f => items.push(f.family + ' (' + f.status + ')'));
      return items;
    });
  });
  console.log('Font status:', fontStatus);
  
  // Check page dimensions
  const dims = await page.evaluate(() => ({
    w: document.body.scrollWidth,
    h: document.body.scrollHeight,
    bodyHTML: document.body.innerHTML.substring(0, 100)
  }));
  console.log('Dims:', dims);
  
  const outPath = path.join(__dirname, '_debug_test.png');
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  console.log('Screenshot size:', size, 'bytes');
  
  await page.close();
  b.close();
  fs.unlinkSync(tmpFile);
  console.log('Done');
})().catch(e => console.error('FATAL:', e.message));

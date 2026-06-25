const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 400 });

  // 결과 이미지 (700x400) - 도입 전후 비교
  const statHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '*{margin:0;padding:0;box-sizing:border-box;}' +
    'body{width:700px;height:400px;overflow:hidden;margin:0 auto;font-family:"Noto Sans KR",sans-serif;}' +
    '.card{width:700px;height:400px;position:relative;overflow:hidden;' +
    'background:linear-gradient(160deg,#f9fafb,#f0f2f5,#fce7f3);' +
    'display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px 60px;}' +
    '.glow{position:absolute;border-radius:50%;' +
    'background:radial-gradient(circle,rgba(236,72,153,0.2) 0%,transparent 60%);' +
    'width:400px;height:400px;top:50%;left:50%;transform:translate(-50%,-50%);}' +
    '.badge{display:inline-block;background:rgba(236,72,153,0.1);color:#db2777;' +
    'font-size:16px;font-weight:700;padding:6px 20px;' +
    'border:1px solid rgba(236,72,153,0.25);border-radius:30px;margin-bottom:14px;' +
    'z-index:2;position:relative;}' +
    '.stat{color:#0f172a;font-size:52px;font-weight:900;line-height:1;z-index:2;position:relative;margin-bottom:4px;}' +
    '.stat em{color:#db2777;font-style:normal;}' +
    '.label{color:rgba(15,23,42,0.6);font-size:18px;font-weight:500;z-index:2;position:relative;word-break:keep-all;}' +
    '.row{display:flex;gap:40px;z-index:2;position:relative;margin-top:10px;}' +
    '.col{text-align:center;}' +
    '</style></head><body><div class="card"><div class="glow"></div>' +
    '<div class="badge">🏥 성형외과 K원장님 도입 결과</div>' +
    '<div class="row">' +
    '<div class="col"><div class="stat">300→<em>2,100</em></div><div class="label">팔로워 7배↑</div></div>' +
    '<div class="col"><div class="stat">3→<em>30</em></div><div class="label">월 문의 6배↑</div></div>' +
    '</div></div></body></html>';

  const statFile = DIR + '/_gen_hosp_stat.html';
  fs.writeFileSync(statFile, statHtml);

  await page.goto('file:///' + statFile.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: DIR + '/body_hospital_result.png', fullPage: false });
  const size = fs.statSync(DIR + '/body_hospital_result.png').size;
  console.log('✅ body_hospital_result.png (' + Math.round(size/1024) + 'KB)');
  fs.unlinkSync(statFile);

  await page.close();
  await b.close();
})();

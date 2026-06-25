// 포토 스타일 이미지 3장 생성
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  var configs = [
    { bg: 'linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)', badge: 'STUDIO', sub: '크리에이터를 위한\n프로페셔널 작업 환경' },
    { bg: 'linear-gradient(160deg, #2d1b4e, #1a1a2e, #16213e)', badge: 'EDITING', sub: '전문 에디터가\n완성하는 당신의 영상' },
    { bg: 'linear-gradient(160deg, #0d1630, #1a1f4e, #2d1b69)', badge: 'CONTENT', sub: '숏폼부터 프리미엄까지\n모든 플랫폼 대응' },
  ];

  for (var i = 0; i < configs.length; i++) {
    var c = configs[i];
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>';
    html += '*{margin:0;padding:0;box-sizing:border-box}';
    html += 'body{width:700px;height:700px;overflow:hidden;font-family:"Noto Sans KR",sans-serif}';
    html += '.card{width:700px;height:700px;background:' + c.bg + ';display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;position:relative}';
    html += '.glow{position:absolute;width:450px;height:450px;border-radius:50%;background:radial-gradient(circle,rgba(100,100,255,0.15) 0%,transparent 60%);top:50%;left:50%;transform:translate(-50%,-50%)}';
    html += '.badge{background:rgba(255,255,255,0.08);color:#a78bfa;font-size:15px;font-weight:700;padding:6px 20px;border:1px solid rgba(167,139,250,0.25);border-radius:30px;margin-bottom:50px;z-index:2;position:relative;letter-spacing:2px}';
    html += '.sub{color:rgba(255,255,255,0.88);font-size:30px;font-weight:700;line-height:1.5;z-index:2;position:relative;word-break:keep-all}';
    html += '</style></head><body>';
    html += '<div class="card"><div class="glow"></div>';
    html += '<div class="badge">' + c.badge + '</div>';
    html += '<div class="sub">' + c.sub.replace(/\n/g,'<br>') + '</div>';
    html += '</div></body></html>';

    var tmpFile = '_tmp_photo_' + i + '.html';
    fs.writeFileSync(tmpFile, html);

    var page = await ctx.newPage();
    await page.setViewportSize({ width: 700, height: 700 });
    var absPath = 'file:///C:/Users/paul/.openclaw/workspace/' + tmpFile;
    await page.goto(absPath, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await page.evaluate(function() { return document.fonts.ready; });
    await sleep(2000);

    var outFile = 'aicut_ai_photo_' + (i+1) + '.jpg';
    await page.screenshot({ path: outFile, fullPage: false });
    await page.close();
    fs.unlinkSync(tmpFile);

    var s = Math.round(fs.statSync(outFile).size / 1024);
    console.log('✅ ' + outFile + ' (' + s + 'KB)');
  }

  console.log('\n✅ 3장 생성 완료');
  await b.close();
})();

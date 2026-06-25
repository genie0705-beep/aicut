const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>\
* { margin: 0; padding: 0; box-sizing: border-box; }\
body { width: 700px; height: 400px; overflow: hidden; font-family: "Noto Sans KR", "Nanum Gothic", sans-serif; background: #f5f0eb; }\
.cut { width: 700px; height: 400px; position: relative; background: linear-gradient(135deg, #1a1a2e 30%, #16213e 70%, #0f3460); overflow: hidden; }\
.moon { position: absolute; top: 20px; right: 30px; width: 40px; height: 40px; background: #ffd700; border-radius: 50%; box-shadow: 0 0 20px rgba(255,215,0,0.3); }\
.clock { position: absolute; top: 12px; left: 16px; color: rgba(255,255,255,0.35); font-size: 11px; letter-spacing: 1px; }\
.char { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); font-size: 64px; }\
.monitor { position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); width: 160px; height: 100px; background: #1e1e32; border-radius: 6px; border: 2px solid #3a3a5e; display: flex; align-items: center; justify-content: center; flex-direction: column; }\
.monitor .time { position: absolute; top: 6px; right: 8px; color: #ff6b6b; font-size: 10px; font-weight: 700; }\
.monitor .txt { color: #00ff88; font-size: 12px; font-weight: 700; }\
.bubble { position: absolute; padding: 10px 14px; border-radius: 14px; font-size: 13px; font-weight: 700; line-height: 1.4; max-width: 180px; word-break: keep-all; }\
.b1 { top: 55px; left: 20px; background: #fff; color: #333; border: 2px solid #ddd; }\
.b1:after { content: ""; position: absolute; bottom: -10px; left: 24px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #fff; }\
.b2 { bottom: 115px; right: 30px; background: #ffd700; color: #333; }\
.b2:after { content: ""; position: absolute; bottom: -10px; right: 24px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #ffd700; }\
.bar { position: absolute; bottom: 0; left: 0; width: 100%; padding: 10px 16px; background: linear-gradient(90deg, #5c3de8, #7c5cf6); display: flex; justify-content: space-between; align-items: center; }\
.bar .s { color: rgba(255,255,255,0.7); font-size: 11px; }\
.bar .b { color: #fff; font-size: 12px; font-weight: 800; }\
</style></head><body>\
<div class="cut">\
  <div class="moon"></div>\
  <div class="clock">AM 03:00</div>\
  <div class="bubble b1">"자막 넣다가<br>새벽 2시...<br>효과 넣다가 3시..."</div>\
  <div class="monitor"><span class="time">03:00</span><span class="txt">편집 중...</span></div>\
  <div class="bubble b2">"이건 외주<br>맡기는 게<br>낫겠다 💡"</div>\
  <div class="char">😵</div>\
  <div class="bar"><span class="s">영상빡침일기 #1</span><span class="b">AICUT ✂️</span></div>\
</div></body></html>';

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  var page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 400 });
  
  var tmpFile = DIR + '/_w2.html';
  fs.writeFileSync(tmpFile, HTML);
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(function() { return document.fonts.ready; });
  await sleep(2000);
  
  var out = DIR + '/aicut_webtoon_v2.png';
  await page.screenshot({ path: out, fullPage: false });
  var size = fs.statSync(out).size;
  console.log('웹툰 v2 완료! (' + Math.round(size/1024) + 'KB, 700x400)');
  
  await page.close();
  await b.close();
  try { fs.unlinkSync(tmpFile); } catch(e) {}
})();

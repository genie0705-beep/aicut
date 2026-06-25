const { chromium } = require('playwright');
const path = require('path');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var WEBTOON_HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>\
* { margin: 0; padding: 0; box-sizing: border-box; }\
body { width: 700px; height: 700px; overflow: hidden; font-family: "Noto Sans KR", "Nanum Gothic", sans-serif; }\
.card { width: 700px; height: 700px; background: #f5f0eb; position: relative; padding: 20px; }\
\
/* 웹툰 스타일 컷 */\
.cut { position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }\
\
/* 배경 */\
.bg { position: absolute; width: 100%; height: 100%; background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }\
.bg-stars { position: absolute; width: 100%; height: 100%; }\
.star { position: absolute; width: 3px; height: 3px; background: #fff; border-radius: 50%; opacity: 0.6; }\
/* 달 */\
.moon { position: absolute; top: 30px; right: 40px; width: 60px; height: 60px; background: #ffd700; border-radius: 50%; box-shadow: 0 0 30px rgba(255,215,0,0.3); }\
\
/* 캐릭터 영역 - 이모지로 표현 */\
.character-area { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); display: flex; gap: 40px; align-items: flex-end; }\
.char { text-align: center; }\
.char-emoji { font-size: 72px; line-height: 1; }\
.char-label { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px; }\
\
/* 모니터 */\
.monitor { position: absolute; bottom: 160px; left: 50%; transform: translateX(-50%); width: 200px; height: 140px; background: #2a2a3e; border-radius: 8px; border: 3px solid #4a4a6e; display: flex; align-items: center; justify-content: center; }\
.monitor-text { color: #00ff88; font-size: 13px; font-weight: 700; text-align: center; line-height: 1.5; }\
.monitor-time { position: absolute; top: 8px; right: 10px; color: #ff6b6b; font-size: 11px; font-weight: 700; }\
\
/* 말풍선 */\
.bubble { position: absolute; padding: 14px 18px; border-radius: 16px; font-size: 15px; font-weight: 700; line-height: 1.4; max-width: 220px; word-break: keep-all; }\
.bubble1 { top: 100px; left: 40px; background: #fff; color: #333; border: 2px solid #ddd; }\
.bubble1:after { content: ""; position: absolute; bottom: -12px; left: 30px; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 12px solid #fff; }\
.bubble2 { bottom: 220px; right: 40px; background: #ffd700; color: #333; }\
.bubble2:after { content: ""; position: absolute; bottom: -12px; right: 30px; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 12px solid #ffd700; }\
\
/* 하단 타이틀 바 */\
.title-bar { position: absolute; bottom: 0; left: 0; width: 100%; padding: 14px 20px; background: linear-gradient(90deg, #5c3de8, #7c5cf6); display: flex; justify-content: space-between; align-items: center; }\
.title-bar .series { color: rgba(255,255,255,0.8); font-size: 12px; }\
.title-bar .brand { color: #fff; font-size: 14px; font-weight: 800; }\
\
/* 시계 */\
.clock { position: absolute; top: 15px; left: 20px; color: rgba(255,255,255,0.4); font-size: 11px; }\
</style></head><body>\
<div class="card">\
  <div class="cut">\
    <div class="bg">\
      <div class="moon"></div>\
      <div class="clock">AM 03:00</div>\
      <div class="bg-stars">\
        <div class="star" style="top:10%;left:20%;"></div>\
        <div class="star" style="top:15%;left:70%;width:2px;height:2px;"></div>\
        <div class="star" style="top:25%;left:45%;"></div>\
        <div class="star" style="top:35%;left:80%;width:2px;height:2px;"></div>\
        <div class="star" style="top:8%;left:55%;"></div>\
        <div class="star" style="top:20%;left:10%;width:2px;height:2px;"></div>\
      </div>\
    </div>\
    \
    <div class="bubble bubble1">\
      "자막 넣다가<br>새벽 2시...<br>효과 넣다가 3시..."\
    </div>\
    \
    <div class="monitor">\
      <div class="monitor-time">03:00</div>\
      <div class="monitor-text">편집 중...<br>저장▼</div>\
    </div>\
    \
    <div class="bubble bubble2">\
      "이건<br>외주 맡기는 게<br>낫겠다 💡"\
    </div>\
    \
    <div class="character-area">\
      <div class="char">\
        <div class="char-emoji">😵</div>\
        <div class="char-label">직장인</div>\
      </div>\
    </div>\
    \
    <div class="title-bar">\
      <span class="series">영상빡침일기 #1</span>\
      <span class="brand">AICUT ✂️</span>\
    </div>\
  </div>\
</div></body></html>';

(async () => {
  // Connect to CDP browser
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  var page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  
  // Write HTML to temp file
  var tmpFile = DIR + '/_webtoon_sample.html';
  require('fs').writeFileSync(tmpFile, WEBTOON_HTML);
  
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(function() { return document.fonts.ready; });
  await sleep(2000);
  
  var outPath = DIR + '/aicut_webtoon_sample.png';
  await page.screenshot({ path: outPath, fullPage: false });
  
  var size = require('fs').statSync(outPath).size;
  console.log('웹툰 샘플 생성 완료! (' + Math.round(size/1024) + 'KB)');
  
  await page.close();
  await b.close();
  
  // Cleanup
  try { require('fs').unlinkSync(tmpFile); } catch(e) {}
})();

const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 에이컷 브랜드 컬러: 퍼플 계열 (#5c3de8, #a78bfa, #7c5cf6)
var HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>\
*{margin:0;padding:0;box-sizing:border-box}\
body{width:700px;height:700px;overflow:hidden;font-family:"Noto Sans KR",sans-serif;background:linear-gradient(160deg,#0d1630,#1a1f4e,#2d1b69);display:flex;align-items:center;justify-content:center}\
.card{text-align:center;position:relative}\
\
/* 캐릭터 SVG - 편집하는 사람 */\
.char-wrap{position:relative;width:200px;height:240px;margin:0 auto 20px}\
.circle-bg{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.2),transparent)}\
/* 머리 */\
.head{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#7c5cf6);box-shadow:0 4px 20px rgba(167,139,250,0.4);z-index:2}\
/* 머리에 작은 원 (헤드셋/악세서리) */\
.head-accent{position:absolute;top:35px;right:55px;width:20px;height:8px;background:#ffd700;border-radius:4px;z-index:3}\
/* 눈 */\
.eyes{position:absolute;top:48px;left:50%;transform:translateX(-50%);display:flex;gap:14px;z-index:3}\
.eye{width:8px;height:8px;background:#0d1630;border-radius:50%}\
/* 미소 */\
.mouth{position:absolute;top:62px;left:50%;transform:translateX(-50%);width:16px;height:8px;border-bottom:3px solid #0d1630;border-radius:0 0 50% 50%;z-index:3}\
/* 몸통 */\
.body{position:absolute;top:90px;left:50%;transform:translateX(-50%);width:90px;height:100px;background:linear-gradient(180deg,#5c3de8,#4530b5);border-radius:16px 16px 30px 30px;z-index:1}\
/* 팔 - 왼쪽 (컴퓨터) */\
.arm-left{position:absolute;top:100px;left:50%;transform:translateX(-70px);width:14px;height:50px;background:#5c3de8;border-radius:7px;transform-origin:top center;rotate:20deg}\
/* 팔 - 오른쪽 (마우스) */\
.arm-right{position:absolute;top:100px;right:50%;transform:translateX(70px);width:14px;height:50px;background:#5c3de8;border-radius:7px;transform-origin:top center;rotate:-20deg}\
/* 모니터 */\
.mon{position:absolute;top:190px;left:50%;transform:translateX(-30px);width:60px;height:40px;background:#1a1a2e;border:3px solid #7c5cf6;border-radius:4px;z-index:0}\
.mon:after{content:"";position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:30px;height:4px;background:#7c5cf6;border-radius:2px}\
.mon .screen{position:absolute;top:4px;left:4px;width:46px;height:26px;background:rgba(52,211,153,0.15);border-radius:2px}\
.mon .screen:after{content:"▶";position:absolute;top:4px;left:4px;color:#34d399;font-size:8px}\
\
/* 브랜드 */\
.brand{font-size:14px;color:#a78bfa;font-weight:700;letter-spacing:3px;margin-top:30px}\
.name{font-size:24px;color:#fff;font-weight:900;margin-top:8px}\
.role{font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px}\
.divider{width:40px;height:3px;background:linear-gradient(90deg,#5c3de8,#a78bfa);margin:16px auto;border-radius:2px}\
.slogan{font-size:15px;color:rgba(255,255,255,0.7);font-weight:500;line-height:1.6}\
</style></head><body>\
<div class="card">\
<div class="char-wrap">\
<div class="circle-bg"></div>\
<div class="head"></div>\
<div class="head-accent"></div>\
<div class="eyes"><div class="eye"></div><div class="eye"></div></div>\
<div class="mouth"></div>\
<div class="body"></div>\
<div class="arm-left"></div>\
<div class="arm-right"></div>\
<div class="mon"><div class="screen"></div></div>\
</div>\
<div class="brand">AICUT</div>\
<div class="name">AI 에디터</div>\
<div class="role">영상 편집 전문 스튜디오</div>\
<div class="divider"></div>\
<div class="slogan">당신은 찍기만 하세요<br>편집은 에이컷이</div>\
</div></body></html>';

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  var page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  
  var tmp = DIR + '/_char.html';
  fs.writeFileSync(tmp, HTML);
  await page.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(function() { return document.fonts.ready; });
  await sleep(2000);
  
  var out = DIR + '/aicut_character_sample.png';
  await page.screenshot({ path: out, fullPage: false });
  var sz = fs.statSync(out).size;
  console.log('캐릭터 샘플 완료! (' + Math.round(sz/1024) + 'KB)');
  
  await page.close();
  await b.close();
  try { fs.unlinkSync(tmp); } catch(e) {}
})();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CDP_PORT = 9224;

async function makeImage(theme, w, h, badge, mainLines, sub, cta, outFile) {
  var T = theme === 'dark_purple'
    ? { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.5)', badgeBg:'rgba(167,139,250,0.15)', badgeColor:'#a78bfa', badgeBorder:'rgba(167,139,250,0.3)', textColor:'#fff', accent:'#a78bfa', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#5c3de8', ctaTo:'#7c5cf6' }
    : { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#064e3b)', glow:'rgba(52,211,153,0.35)', badgeBg:'rgba(52,211,153,0.15)', badgeColor:'#34d399', badgeBorder:'rgba(52,211,153,0.3)', textColor:'#fff', accent:'#34d399', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#059669', ctaTo:'#34d399' };

  var mainHtml = mainLines.join('<br>');
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{width:' + w + 'px;height:' + h + 'px;overflow:hidden;font-family:\'Noto Sans KR\',\'Malgun Gothic\',sans-serif}' +
    '.card{width:' + w + 'px;height:' + h + 'px;position:relative;overflow:hidden;background:' + T.bg + ';' +
    'display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:50px}' +
    '.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,' + T.glow + ' 0%,transparent 60%);' +
    'width:420px;height:420px;top:50%;left:50%;transform:translate(-50%,-50%)}' +
    '.badge{display:inline-block;background:' + T.badgeBg + ';color:' + T.badgeColor + ';font-size:16px;font-weight:700;padding:8px 22px;border:1px solid ' + T.badgeBorder + ';border-radius:30px;margin-bottom:20px;z-index:2;position:relative}' +
    '.main{color:' + T.textColor + ';font-size:36px;font-weight:800;line-height:1.35;z-index:2;position:relative;margin-bottom:12px;word-break:keep-all;letter-spacing:-1px}' +
    '.main em{color:' + T.accent + ';font-style:normal}' +
    '.sub{color:' + T.subColor + ';font-size:17px;font-weight:500;line-height:1.5;z-index:2;position:relative;margin-bottom:26px;word-break:keep-all}' +
    '.cta{background:linear-gradient(135deg,' + T.ctaFrom + ',' + T.ctaTo + ');color:#fff;font-size:19px;font-weight:700;padding:14px 48px;border-radius:50px;z-index:2;position:relative;display:inline-block}' +
    '</style></head><body><div class="card"><div class="glow"></div><div class="badge">' + badge + '</div><div class="main">' + mainHtml + '</div><div class="sub">' + sub + '</div><div class="cta">' + cta + '</div></div></body></html>';

  var tmp = path.join(__dirname, '_tmp2.html');
  fs.writeFileSync(tmp, html);
  var b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  var ctx = b.contexts()[0];
  var pg = await ctx.newPage();
  await pg.setViewportSize({ width: w, height: h });
  await pg.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await pg.evaluate(function() { return document.fonts.ready; });
  await pg.waitForTimeout(3000);
  var out = path.join(__dirname, outFile);
  await pg.screenshot({ path: out, fullPage: false });
  var size = fs.statSync(out).size;
  await pg.close();
  await b.close();
  fs.unlinkSync(tmp);
  return { file: outFile, sizeKB: Math.round(size / 1024) };
}

(async () => {
  console.log('=== 다크테마로 이미지 재생성 ===\n');

  // 1. check: light_cyan → dark_purple
  var r1 = await makeImage('dark_purple', 800, 450, '☕ 상반기 마케팅 결산',
    ['커피 한 잔의 시간,', '<em>상반기 마케팅</em>을', '점검하는 법'],
    '3가지 체크리스트로 10분이면 충분', '자세히 보기 →', 'aicut_commute_check.png');
  console.log('1/2 ✅', r1.file, '(' + r1.sizeKB + 'KB)');

  // 2. ai: light_pink → dark_green
  var r2 = await makeImage('dark_green', 800, 450, '🤖 AI 시대 전략',
    ['AI로 다 하려다', '지치지 마세요', '<em>하이브리드</em>가 답입니다'],
    'AI 툴 + 전문 에디터의 시너지 효과', '에이컷에 물어보기 →', 'aicut_commute_ai.png');
  console.log('2/2 ✅', r2.file, '(' + r2.sizeKB + 'KB)');

  console.log('\n✅ 재생성 완료');
})();

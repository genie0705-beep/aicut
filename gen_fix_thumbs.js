const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CDP_PORT = 9224;

async function makeThumb(theme, badge, mainLines, sub, cta, outFile) {
  var T = theme === 'purple'
    ? { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow:'rgba(92,61,232,0.5)', badgeBg:'rgba(167,139,250,0.15)', badgeColor:'#a78bfa', badgeBorder:'rgba(167,139,250,0.3)', textColor:'#fff', accent:'#a78bfa', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#5c3de8', ctaTo:'#7c5cf6' }
    : { bg:'linear-gradient(160deg,#0D1630,#1a1f4e,#064e3b)', glow:'rgba(52,211,153,0.35)', badgeBg:'rgba(52,211,153,0.15)', badgeColor:'#34d399', badgeBorder:'rgba(52,211,153,0.3)', textColor:'#fff', accent:'#34d399', subColor:'rgba(255,255,255,0.65)', ctaFrom:'#059669', ctaTo:'#34d399' };

  var W = 700, H = 700;
  var mainHtml = mainLines.join('<br>');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{width:' + W + 'px;height:' + H + 'px;overflow:hidden;font-family:\'Noto Sans KR\',\'Malgun Gothic\',sans-serif}' +
    '.card{width:' + W + 'px;height:' + H + 'px;position:relative;overflow:hidden;background:' + T.bg + ';' +
    'display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:55px}' +
    '.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,' + T.glow + ' 0%,transparent 60%);' +
    'width:460px;height:460px;top:50%;left:50%;transform:translate(-50%,-50%)}' +
    '.badge{display:inline-block;background:' + T.badgeBg + ';color:' + T.badgeColor + ';font-size:17px;font-weight:700;padding:9px 22px;border:1px solid ' + T.badgeBorder + ';border-radius:30px;margin-bottom:22px;z-index:2;position:relative}' +
    '.main{color:' + T.textColor + ';font-size:46px;font-weight:800;line-height:1.35;z-index:2;position:relative;margin-bottom:14px;word-break:keep-all;letter-spacing:-1.5px}' +
    '.main em{color:' + T.accent + ';font-style:normal}' +
    '.sub{color:' + T.subColor + ';font-size:17px;font-weight:500;line-height:1.5;z-index:2;position:relative;margin-bottom:26px;word-break:keep-all}' +
    '.cta{background:linear-gradient(135deg,' + T.ctaFrom + ',' + T.ctaTo + ');color:#fff;font-size:19px;font-weight:700;padding:14px 48px;border-radius:50px;z-index:2;position:relative;display:inline-block}' +
    '</style></head><body><div class="card"><div class="glow"></div><div class="badge">' + badge + '</div><div class="main">' + mainHtml + '</div><div class="sub">' + sub + '</div><div class="cta">' + cta + '</div></div></body></html>';

  var tmp = path.join(__dirname, '_tmp_thumb.html');
  fs.writeFileSync(tmp, html);
  var b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  var ctx = b.contexts()[0];
  var pg = await ctx.newPage();
  await pg.setViewportSize({ width: W, height: H });
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
  console.log('=== 대표 이미지 폰트 크게 재생성 ===\n');

  // 1. 첫 번째 블로그 대표 이미지 (하반기 마케팅)
  var r1 = await makeThumb('purple',
    '📅 하반기 마케팅 전략',
    ['하반기 마케팅,', '지금 <em>영상 편집 외주</em>를', '정해야 하는 이유'],
    '6월이 완벽한 타이밍인 3가지 이유',
    'AICUT 무료상담 →',
    'aicut_blog_h2_thumb.png'
  );
  console.log('1/2 ✅', r1.file, '(' + r1.sizeKB + 'KB)');

  // 2. 두 번째 블로그 대표 이미지 (출근길 30분)
  var r2 = await makeThumb('purple',
    '🚇 출근길 30분',
    ['출근길 30분,', '바쁜 대표가', '<em>영상 마케팅</em>으로', '하루를 시작하는 법'],
    '아이디어만 보내세요, 편집은 에이컷이',
    'AICUT 무료상담 →',
    'aicut_commute_thumb.png'
  );
  console.log('2/2 ✅', r2.file, '(' + r2.sizeKB + 'KB)');

  console.log('\n✅ 완료 (폰트 34px → 46px로 확대)');
})();

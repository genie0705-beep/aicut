const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;

async function makeImage(theme, width, height, badge, mainLines, sub, cta, outFile) {
  var T;
  if (theme === 'dark_purple') {
    T = { bg: 'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow: 'rgba(92,61,232,0.5)', badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', badgeBorder: 'rgba(167,139,250,0.3)', textColor: '#fff', accent: '#a78bfa', subColor: 'rgba(255,255,255,0.6)', ctaFrom: '#5c3de8', ctaTo: '#7c5cf6' };
  } else if (theme === 'light_cyan') {
    T = { bg: 'linear-gradient(160deg,#f9fafb,#f0f2f5,#e8ecf5)', glow: 'rgba(6,182,212,0.25)', badgeBg: 'rgba(6,182,212,0.1)', badgeColor: '#0891b2', badgeBorder: 'rgba(6,182,212,0.25)', textColor: '#0f172a', accent: '#06b6d4', subColor: 'rgba(15,23,42,0.5)', ctaFrom: '#06b6d4', ctaTo: '#5c3de8' };
  } else if (theme === 'light_pink') {
    T = { bg: 'linear-gradient(160deg,#f9fafb,#f0f2f5,#fce7f3)', glow: 'rgba(236,72,153,0.2)', badgeBg: 'rgba(236,72,153,0.1)', badgeColor: '#db2777', badgeBorder: 'rgba(236,72,153,0.25)', textColor: '#0f172a', accent: '#db2777', subColor: 'rgba(15,23,42,0.5)', ctaFrom: '#db2777', ctaTo: '#5c3de8' };
  } else if (theme === 'dark_green') {
    T = { bg: 'linear-gradient(160deg,#0D1630,#1a1f4e,#064e3b)', glow: 'rgba(52,211,153,0.35)', badgeBg: 'rgba(52,211,153,0.15)', badgeColor: '#34d399', badgeBorder: 'rgba(52,211,153,0.3)', textColor: '#fff', accent: '#34d399', subColor: 'rgba(255,255,255,0.6)', ctaFrom: '#059669', ctaTo: '#34d399' };
  }

  var mainHtml = mainLines.join('<br>');
  var fontSize = height <= 450 ? 28 : (width <= 700 ? 38 : 42);
  var fsSub = height <= 450 ? 14 : 18;
  var pd = height <= 450 ? 36 : 56;
  var mbBadge = height <= 450 ? 10 : 20;
  var mbMain = height <= 450 ? 6 : 12;
  var mbSub = height <= 450 ? 12 : 24;
  var ctaPad = height <= 450 ? '10px 32px' : '14px 48px';
  var ctaFs = height <= 450 ? 15 : 20;

  var html = '<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{width:' + width + 'px;height:' + height + 'px;overflow:hidden;font-family:\'Noto Sans KR\',\'Malgun Gothic\',sans-serif}' +
    '.card{width:' + width + 'px;height:' + height + 'px;position:relative;overflow:hidden;background:' + T.bg + ';' +
    'display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:' + pd + 'px}' +
    '.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,' + T.glow + ' 0%,transparent 60%);' +
    'width:' + Math.round(width * 0.6) + 'px;height:' + Math.round(width * 0.6) + 'px;' +
    'top:50%;left:50%;transform:translate(-50%,-50%)}' +
    '.badge{display:inline-block;background:' + T.badgeBg + ';color:' + T.badgeColor + ';' +
    'font-size:16px;font-weight:700;padding:8px 22px;border:1px solid ' + T.badgeBorder + ';' +
    'border-radius:30px;margin-bottom:' + mbBadge + 'px;z-index:2;position:relative}' +
    '.main{color:' + T.textColor + ';font-size:' + fontSize + 'px;font-weight:800;line-height:1.35;"' +
    'z-index:2;position:relative;margin-bottom:' + mbMain + 'px;word-break:keep-all;letter-spacing:-1px}' +
    '.main em{color:' + T.accent + ';font-style:normal}' +
    '.sub{color:' + T.subColor + ';font-size:' + fsSub + 'px;font-weight:500;line-height:1.5;' +
    'z-index:2;position:relative;margin-bottom:' + mbSub + 'px;word-break:keep-all}' +
    '.cta{background:linear-gradient(135deg,' + T.ctaFrom + ',' + T.ctaTo + ');color:#fff;' +
    'font-size:' + ctaFs + 'px;font-weight:700;padding:' + ctaPad + ';border-radius:50px;' +
    'z-index:2;position:relative;display:inline-block}' +
    '</style></head><body><div class="card"><div class="glow"></div>' +
    '<div class="badge">' + badge + '</div>' +
    '<div class="main">' + mainHtml + '</div>' +
    '<div class="sub">' + sub + '</div>' +
    '<div class="cta">' + cta + '</div></div></body></html>';

  var tmpFile = path.join(__dirname, '_tmp_blog.html');
  fs.writeFileSync(tmpFile, html);

  var b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  var ctx = b.contexts()[0];
  var page = await ctx.newPage();
  await page.setViewportSize({ width: width, height: height });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(function() { return document.fonts.ready; });
  await page.waitForTimeout(3000);

  var outPath = path.join(__dirname, outFile);
  await page.screenshot({ path: outPath, fullPage: false });
  var size = fs.statSync(outPath).size;

  await page.close();
  await b.close();
  fs.unlinkSync(tmpFile);

  return { file: outFile, sizeKB: Math.round(size / 1024) };
}

(async () => {
  console.log('=== 블로그 이미지 5장 생성 ===\n');
  
  var images = [
    { theme: 'dark_purple', w: 700, h: 700, badge: '🚇 출근길 30분', main: ['출근길 30분,', '바쁜 대표가', '<em>영상 마케팅</em>으로', '하루를 시작하는 법'], sub: '아이디어만 보내세요, 편집은 에이컷이', cta: 'AICUT 무료상담 →', out: 'aicut_commute_thumb.png' },
    { theme: 'light_cyan', w: 800, h: 450, badge: '☕ 상반기 마케팅 결산', main: ['커피 한 잔의 시간,', '<em>상반기 마케팅</em>을', '점검하는 법'], sub: '3가지 체크리스트로 10분이면 충분', cta: '자세히 보기 →', out: 'aicut_commute_check.png' },
    { theme: 'dark_green', w: 800, h: 450, badge: '⏰ 30분 루틴', main: ['출근길 <em>30분</em>,', '이렇게 쓰면', '하반기가 바뀐다'], sub: '인사이트 수집 → 아이디어 → 실행 의뢰', cta: '시작하기 →', out: 'aicut_commute_routine.png' },
    { theme: 'light_pink', w: 800, h: 450, badge: '🤖 AI 시대 전략', main: ['AI로 다 하려다', '지치지 마세요', '<em>하이브리드</em>가 답입니다'], sub: 'AI 툴 + 전문 에디터의 시너지 효과', cta: '에이컷에 물어보기 →', out: 'aicut_commute_ai.png' },
    { theme: 'dark_purple', w: 800, h: 450, badge: '💡 하루 30분의 가치', main: ['30분 아이디어,', '에이컷이 <em>영상</em>으로', '만들어 드립니다'], sub: '주 2~3편 꾸준히, 약정 부담 없이', cta: '카카오톡 무료상담 →', out: 'aicut_commute_cta.png' }
  ];

  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    process.stdout.write('[' + (i+1) + '/5] ' + img.out + '... ');
    var r = await makeImage(img.theme, img.w, img.h, img.badge, img.main, img.sub, img.cta, img.out);
    console.log('✅ ' + r.sizeKB + 'KB');
  }

  console.log('\n✅ 모든 이미지 생성 완료');
})();

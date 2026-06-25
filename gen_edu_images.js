const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function gen(html, out, W, H) {
  const tmp = DIR + '/_tmp.html';
  fs.writeFileSync(tmp, html);
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({ width: W, height: H });
  await p.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: DIR + '/' + out, fullPage: false });
  const s = fs.statSync(DIR + '/' + out).size;
  console.log('✅ ' + out + ' (' + Math.round(s/1024) + 'KB)');
  fs.unlinkSync(tmp);
  await p.close();
  await b.close();
}

function css(W,H,T) {
  return '<style>*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{width:'+W+'px;height:'+H+'px;overflow:hidden;margin:0 auto;font-family:"Noto Sans KR",sans-serif;}'
    + '.c{width:'+W+'px;height:'+H+'px;position:relative;overflow:hidden;background:'+T.bg+';'
    + 'display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:'+(H===700?'60':'40 60')+'px;}'
    + '.g{position:absolute;border-radius:50%;background:radial-gradient(circle,'+T.gc+' 0%,transparent 60%);'
    + 'width:'+Math.round(W*0.57)+'px;height:'+Math.round(W*0.57)+'px;top:50%;left:50%;transform:translate(-50%,-50%);}'
    + '.b{display:inline-block;background:'+T.bb+';color:'+T.bc+';font-size:16px;font-weight:700;padding:6px 20px;border:1px solid '+T.bdr+';border-radius:30px;margin-bottom:'+(H===700?'28':'14')+'px;z-index:2;position:relative;}'
    + '.m{color:'+T.tc+';font-size:'+(H===700?'48':'36')+'px;font-weight:800;line-height:1.35;z-index:2;position:relative;margin-bottom:'+(H===700?'16':'8')+'px;word-break:keep-all;letter-spacing:-1px;}'
    + '.m em{color:'+T.ac+';font-style:normal;}'
    + '.s{color:'+T.sc+';font-size:'+(H===700?'22':'18')+'px;font-weight:500;line-height:1.5;z-index:2;position:relative;word-break:keep-all;}'
    + '.n{color:'+T.ac+';font-size:52px;font-weight:900;line-height:1;display:block;margin-bottom:2px;}'
    + '.rw{display:flex;gap:30px;z-index:2;position:relative;margin-top:6px;}'
    + '.cl{text-align:center;}'
    + '</style>';
}

const THEMES = {
  dark_green: { bg: 'linear-gradient(160deg,#0D1630,#1a1f4e,#064e3b)', gc: 'rgba(52,211,153,0.35)', bb: 'rgba(52,211,153,0.15)', bc: '#34d399', bdr: 'rgba(52,211,153,0.3)', tc: '#fff', ac: '#34d399', sc: 'rgba(255,255,255,0.6)' },
  light_green: { bg: 'linear-gradient(160deg,#f9fafb,#f0f2f5,#ecfdf5)', gc: 'rgba(52,211,153,0.2)', bb: 'rgba(52,211,153,0.1)', bc: '#059669', bdr: 'rgba(52,211,153,0.25)', tc: '#0f172a', ac: '#34d399', sc: 'rgba(15,23,42,0.5)' }
};

(async () => {
  var T = THEMES.dark_green;
  var TL = THEMES.light_green;

  // 1. 제작시간70% (본문)
  await gen(
    '<html><head><meta charset="UTF-8">'+css(700,400,T)
    +'</head><body><div class="c"><div class="g"></div>'
    +'<div class="b">⏰ 강사 시간 절감</div>'
    +'<div class="rw"><div class="cl"><div class="n"><em>70</em><span style="font-size:36px;">%</span></div><div class="s">제작시간 단축</div></div></div>'
    +'<div class="s">강의 편집을 아웃소싱하면<br>제작 시간이 70% 줄어듭니다</div>'
    +'</div></body></html>',
    'body_edu_stat1.png', 700, 400
  );

  // 2. 체크리스트 (본문)
  await gen(
    '<html><head><meta charset="UTF-8">'+css(700,400,TL)
    +'</head><body><div class="c"><div class="g"></div>'
    +'<div class="b">✅ 편집 파트너 체크리스트</div>'
    +'<div style="text-align:left;max-width:420px;z-index:2;position:relative;width:100%;">'
    +'<div style="font-size:20px;font-weight:600;color:#0f172a;padding:10px 0;border-bottom:1px solid #d1fae5;"><span style="color:#059669;">①</span> 강의 콘텐츠를 이해하는가</div>'
    +'<div style="font-size:20px;font-weight:600;color:#0f172a;padding:10px 0;border-bottom:1px solid #d1fae5;"><span style="color:#059669;">②</span> 정기 납품이 가능한가</div>'
    +'<div style="font-size:20px;font-weight:600;color:#0f172a;padding:10px 0;"><span style="color:#059669;">③</span> 빠른 수정 대응이 가능한가</div>'
    +'</div></div></body></html>',
    'body_edu_check.png', 700, 400
  );

  // 3. 숏폼 채널 성장 (본문 신규)
  await gen(
    '<html><head><meta charset="UTF-8">'+css(700,400,T)
    +'</head><body><div class="c"><div class="g"></div>'
    +'<div class="b">📱 숏폼 채널 성장</div>'
    +'<div class="m">릴스·쇼츠 2편으로<br><em>구독자 2배</em></div>'
    +'<div class="s">"쇼츠 매주 2편 올린 후<br>구독자 3개월 만에 2배 증가"</div>'
    +'</div></body></html>',
    'body_edu_stat2.png', 700, 400
  );

  // 4. 교육 콘텐츠 CTA (본문 신규)
  await gen(
    '<html><head><meta charset="UTF-8">'+css(700,400,TL)
    +'</head><body><div class="c"><div class="g"></div>'
    +'<div class="b">📚 온라인 교육 시장</div>'
    +'<div class="rw"><div class="cl"><div class="n"><em>70</em><span style="font-size:28px;">%</span></div><div class="s">제작시간 단축</div></div>'
    +'<div class="cl"><div class="n"><em>2</em><span style="font-size:28px;">배</span></div><div class="s">구독자 증가</div></div></div>'
    +'<div class="s">강의는 기획하고, 편집은 에이컷에</div>'
    +'</div></body></html>',
    'body_edu_stat3.png', 700, 400
  );

  console.log('\n🎉 교육 포스트 이미지 5장 생성 완료!');
})();

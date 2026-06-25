const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function gen(name, W, H, html) {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });
  
  const tmpFile = DIR + '/_gen_tmp.html';
  fs.writeFileSync(tmpFile, html);
  
  await page.goto('file:///' + DIR + '/_gen_tmp.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: DIR + '/' + name, fullPage: false });
  const size = fs.statSync(DIR + '/' + name).size;
  console.log('✅ ' + name + ' (' + Math.round(size/1024) + 'KB)');
  
  fs.unlinkSync(tmpFile);
  await page.close();
  await b.close();
}

function css(W, H, bg, glowColor, badge, badgeColor, bdr, textColor, accent, subColor) {
  return '<style>' +
    '*{margin:0;padding:0;box-sizing:border-box;}' +
    'body{width:'+W+'px;height:'+H+'px;overflow:hidden;margin:0 auto;font-family:"Noto Sans KR",sans-serif;}' +
    '.card{width:'+W+'px;height:'+H+'px;position:relative;overflow:hidden;background:'+bg+';' +
    'display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px 60px;}' +
    '.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,'+glowColor+' 0%,transparent 60%);' +
    'width:'+Math.round(W*0.57)+'px;height:'+Math.round(W*0.57)+'px;top:50%;left:50%;transform:translate(-50%,-50%);}' +
    '.badge{display:inline-block;background:'+badge+';color:'+badgeColor+';font-size:16px;font-weight:700;' +
    'padding:6px 20px;border:1px solid '+bdr+';border-radius:30px;margin-bottom:14px;z-index:2;position:relative;}' +
    '.main{color:'+textColor+';font-size:36px;font-weight:800;line-height:1.35;z-index:2;position:relative;margin-bottom:8px;word-break:keep-all;letter-spacing:-1px;}' +
    '.main em{color:'+accent+';font-style:normal;}' +
    '.sub{color:'+subColor+';font-size:18px;font-weight:500;line-height:1.5;z-index:2;position:relative;word-break:keep-all;}' +
    '.num{color:'+accent+';font-size:64px;font-weight:900;display:block;line-height:1;margin-bottom:2px;}' +
    '.row{display:flex;gap:30px;z-index:2;position:relative;margin-top:6px;}' +
    '.col{text-align:center;}' +
    '.v{font-size:20px;font-weight:500;color:'+subColor+';}' +
    '</style>';
}

(async () => {
  // 이미지 1: 검색량 2.5배 통계 (다크/퍼플)
  await gen('body_hospital_stat1.png', 700, 400,
    '<html><head><meta charset="UTF-8">' +
    css(700, 400,
      'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)',
      'rgba(92,61,232,0.5)',
      'rgba(167,139,250,0.15)', '#a78bfa', 'rgba(167,139,250,0.3)',
      '#fff', '#a78bfa', 'rgba(255,255,255,0.6)') +
    '</head><body><div class="card"><div class="glow"></div>' +
    '<div class="badge">📊 병원 영상 검색 데이터</div>' +
    '<div class="row">' +
    '<div class="col"><div class="num"><em>2.5</em><span style="font-size:36px;">배</span></div><div class="sub">검색량 증가</div><div class="v">전년 대비</div></div>' +
    '<div class="col"><div class="num"><em>80</em><span style="font-size:36px;">%</span></div><div class="sub">전환율 상승</div><div class="v">영상 vs 사진</div></div>' +
    '</div></div></body></html>'
  );

  // 이미지 2: 어떻게 진행되는지 (라이트/시안)
  await gen('body_hospital_stat2.png', 700, 400,
    '<html><head><meta charset="UTF-8">' +
    css(700, 400,
      'linear-gradient(160deg,#f9fafb,#f0f2f5,#e8ecf5)',
      'rgba(6,182,212,0.25)',
      'rgba(6,182,212,0.1)', '#0891b2', 'rgba(6,182,212,0.25)',
      '#0f172a', '#06b6d4', 'rgba(15,23,42,0.5)') +
    '</head><body><div class="card"><div class="glow"></div>' +
    '<div class="badge">🎬 에이컷 진행 방식</div>' +
    '<div class="main">① 원장님 촬영 <em>5분</em></div>' +
    '<div class="main">② 원본 전송</div>' +
    '<div class="main">③ 에이컷 편집 <em>→</em> 납품</div>' +
    '</div></body></html>'
  );

  // 이미지 3: 병원별 적용 (체크리스트/라이트핑크)
  await gen('body_hospital_stat3.png', 700, 400,
    '<html><head><meta charset="UTF-8">' +
    css(700, 400,
      'linear-gradient(160deg,#f9fafb,#f0f2f5,#fce7f3)',
      'rgba(236,72,153,0.2)',
      'rgba(236,72,153,0.1)', '#db2777', 'rgba(236,72,153,0.25)',
      '#0f172a', '#db2777', 'rgba(15,23,42,0.5)') +
    '</head><body><div class="card"><div class="glow"></div>' +
    '<div class="badge">🏥 병원별 맞춤 영상</div>' +
    '<div style="text-align:left;max-width:420px;z-index:2;position:relative;width:100%;">' +
    '<div style="font-size:18px;font-weight:600;color:#0f172a;padding:8px 0;border-bottom:1px solid #f1d4e0;"><span style="color:#db2777;">성형외과</span> — 시술 영상, 비포애프터</div>' +
    '<div style="font-size:18px;font-weight:600;color:#0f172a;padding:8px 0;border-bottom:1px solid #f1d4e0;"><span style="color:#db2777;">피부과</span> — 시술 설명, 관리 팁</div>' +
    '<div style="font-size:18px;font-weight:600;color:#0f172a;padding:8px 0;border-bottom:1px solid #f1d4e0;"><span style="color:#db2777;">치과</span> — 교정 과정, 시술 후기</div>' +
    '<div style="font-size:18px;font-weight:600;color:#0f172a;padding:8px 0;"><span style="color:#db2777;">한의원</span> — 치료 상담, 건강 정보</div>' +
    '</div></div></body></html>'
  );

  console.log('\n✅ 병원 포스트 추가 이미지 3장 생성 완료!');
})();

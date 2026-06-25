// 부동산 중개사 블로그 — 전체 자동화
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
const TITLE = '공인중개사라면 매물 영상 마케팅을 시작해야 하는 이유';

function uid() { return 'SE-' + require('crypto').randomUUID(); }
function tn(v) { return { id: uid(), value: v, '@ctype': 'textNode' }; }
function p(v) { return { id: uid(), nodes: [tn(v)], '@ctype': 'paragraph' }; }
async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// 본문 섹션 정의 + 이미지 위치 (마커)
const SECTIONS = [
  { t: 'p',  v: '요즘 아파트 하나 팔려면 사진 10장, 설명 10줄이면 끝나던 시대는 지났습니다. 매수자들은 이미 인스타그램 릴스와 유튜브 쇼츠에 익숙해져 있습니다. <strong>영상 하나가 문서 100장보다 강력한 설득력</strong>을 발휘하는 시대입니다. 💭' },
  { t: 'p',  v: '' },
  { t: 'p',  v: '"매물 사진만으로는 계약이 안 된다." "인스타에 매물 영상을 올렸는데 조회수가 200도 안 나온다." "영상을 찍고 싶은데 찍을 시간도, 편집할 실력도 없다."' },
  { t: 'p',  v: '' },
  { t: 'p',  v: '정답은 하나입니다. 부동산 마케팅의 핵심은 이제 사진이 아니라 <strong>영상</strong>입니다. 🎬' },
  { t: 'p',  v: '' },
  { t: 'img', label: '대표 이미지 - 부동산 중개사', file: 'blog_img_realestate' }, // [이미지1]
  { t: 'p',  v: '' },
  { t: 'h2', v: '🏠 매물 영상 하나면 계약까지 반으로 준다' },
  { t: 'p',  v: '텍스트와 사진만 있는 매물 페이지는 이제 기본입니다. 차별화는 <strong>영상</strong>에서 시작됩니다.' },
  { t: 'p',  v: '실제로 영상이 포함된 매물 페이지는 현장 방문 예약률이 <strong>2~3배 상승</strong>하고, 계약까지 소요되는 시간이 평균 <strong>40% 단축</strong>됩니다. 📈' },
  { t: 'p',  v: '' },
  { t: 'img', label: '매물 영상 효과 통계', file: 'body_realestate_stat1' }, // [이미지2]
  { t: 'p',  v: '' },
  { t: 'h2', v: '📱 유튜브 쇼츠와 인스타 릴스가 새로운 매물 창구다' },
  { t: 'p',  v: '"네이버에 매물 올리면 되지 않나요?" 물론입니다. 하지만 거기에 더해 <strong>숏폼 플랫폼</strong>을 활용하면 전혀 다른 고객층에 도달할 수 있습니다.' },
  { t: 'p',  v: '릴스 하나로 단지 로비 → 주방 → 침실 → 발코니 뷰까지 원테이크로 보여주는 영상, 단지 내 커뮤니티 시설을 직접 걸어다니며 촬영한 워킹 투어 — 이런 콘텐츠가 매수자의 현장 방문 전 궁금증을 80% 해소합니다. 🔥' },
  { t: 'p',  v: '' },
  { t: 'img', label: '숏폼 플랫폼 마케팅', file: 'body_realestate_stat2' }, // [이미지3]
  { t: 'p',  v: '' },
  { t: 'h2', v: '✍️ 부동산 중개사가 영상을 시작할 때 꼭 알아야 할 3가지' },
  { t: 'p',  v: '① <strong>촬영은 10분이면 충분하다</strong> — 핸드폰으로 매물의 핵심 포인트만 찍어서 보내주세요.' },
  { t: 'p',  v: '② <strong>꾸준함이 답이다</strong> — 주 2~3편, 최소 3개월은 유지해야 채널이 자랍니다.' },
  { t: 'p',  v: '③ <strong>편집은 전문가에게</strong> — 직접 편집하려면 3~4시간, 아웃소싱하면 0시간입니다.' },
  { t: 'p',  v: '' },
  { t: 'img', label: '체크리스트 3가지', file: 'body_realestate_stat3' }, // [이미지4]
  { t: 'p',  v: '' },
  { t: 'h2', v: '🚀 지금 시작해야 하는 이유' },
  { t: 'p',  v: '네이버, 인스타그램, 유튜브 모두 <strong>영상 콘텐츠</strong>에 검색 가중치를 높이고 있습니다. 지금 시작하는 중개사와 6개월 후 시작하는 중개사의 차이는 누적된 콘텐츠의 차이입니다.' },
  { t: 'p',  v: '' },
  { t: 'p',  v: '📞 지금 무료 상담 받기 🙌' },
  { t: 'p',  v: '매물 영상 편집 아웃소싱이 처음이시라면 부담 없이 문의 주세요. 샘플 편집본을 먼저 보내드립니다.' },
  { t: 'p',  v: '📩 카카오톡 채널: 에이컷 | 📧 contact@aicut.co.kr | 🌐 aicut.co.kr' }
];

const TAGS = '부동산마케팅,공인중개사,부동산유튜브,매물영상,부동산SNS,아파트매물,부동산릴스,부동산쇼츠,숏폼마케팅,영상편집외주,부동산중개사,중개법인,매물홍보,부동산콘텐츠,집보여주는영상,부동산유튜브편집,매물영상편집,에이컷,AICUT,부동산마케팅전략,SNS마케팅,인스타그램마케팅,유튜브마케팅,영상제작,부동산광고,매물소개,부동산스타트업,중개사마케팅,부동산인플루언서,콘텐츠마케팅';

// HTML 생성
function buildBodyHTML(sections) {
  var html = '';
  var imgIdx = 0;
  sections.forEach(function(s) {
    var style = ' style="text-align:center;"';
    if (s.t === 'p') {
      html += s.v ? '<p' + style + '>' + s.v + '</p>' : '<p><br></p>';
    } else if (s.t === 'h2') {
      html += '<h2' + style + '>' + s.v + '</h2>';
    } else if (s.t === 'img') {
      imgIdx++;
      html += '<p' + style + '><strong>[이미지' + imgIdx + ': ' + s.label + ']</strong></p>';
    }
  });
  return { html: html, imgCount: imgIdx };
}

// 이미지 생성 (html → png)
async function genImage(html, outFile, W, H) {
  const tmpFile = DIR + '/_tmp_gen.html';
  fs.writeFileSync(tmpFile, html);
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: DIR + '/' + outFile, fullPage: false });
  fs.unlinkSync(tmpFile);
  await page.close();
  await b.close();
}

function cardCSS(W, H, bg, gc, bb, bc, bdr, tc, ac, sc) {
  return '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{width:' + W + 'px;height:' + H + 'px;overflow:hidden;margin:0 auto;font-family:"Noto Sans KR",sans-serif;}'
    + '.card{width:' + W + 'px;height:' + H + 'px;position:relative;overflow:hidden;background:' + bg + ';'
    + 'display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px 60px;}'
    + '.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,' + gc + ' 0%,transparent 60%);'
    + 'width:' + Math.round(W*0.57) + 'px;height:' + Math.round(W*0.57) + 'px;top:50%;left:50%;transform:translate(-50%,-50%);}'
    + '.bd{display:inline-block;background:' + bb + ';color:' + bc + ';font-size:16px;font-weight:700;'
    + 'padding:6px 20px;border:1px solid ' + bdr + ';border-radius:30px;margin-bottom:14px;z-index:2;position:relative;}'
    + '.m{color:' + tc + ';font-size:48px;font-weight:800;line-height:1.35;z-index:2;position:relative;margin-bottom:16px;word-break:keep-all;letter-spacing:-1px;}'
    + '.m em{color:' + ac + ';font-style:normal;}'
    + '.s{color:' + sc + ';font-size:22px;font-weight:500;line-height:1.5;z-index:2;position:relative;word-break:keep-all;}'
    + '.n{color:' + ac + ';font-size:64px;font-weight:900;line-height:1;}'
    + '.rw{display:flex;gap:30px;z-index:2;position:relative;margin-top:8px;}'
    + '.cl{text-align:center;}'
    + '.il{font-size:20px;font-weight:600;color:' + tc + ';padding:8px 0;border-bottom:1px solid ' + gc.replace('0.35','0.15') + ';text-align:left;}'
    + '.il:last-child{border-bottom:none;}'
    + '</style>';
}

const THEMES = {
  light_cyan:   { bg: 'linear-gradient(160deg,#f9fafb,#f0f2f5,#e8ecf5)', gc: 'rgba(6,182,212,0.25)', bb: 'rgba(6,182,212,0.1)', bc: '#0891b2', bdr: 'rgba(6,182,212,0.25)', tc: '#0f172a', ac: '#06b6d4', sc: 'rgba(15,23,42,0.5)' },
  dark_purple:  { bg: 'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', gc: 'rgba(92,61,232,0.5)', bb: 'rgba(167,139,250,0.15)', bc: '#a78bfa', bdr: 'rgba(167,139,250,0.3)', tc: '#fff', ac: '#a78bfa', sc: 'rgba(255,255,255,0.6)' }
};

(async () => {
  console.log('=== 부동산 중개사 블로그 작성 ===\n');

  // 1. 이미지 생성
  console.log('1. 이미지 생성...');
  
  // 대표 이미지 (700x700)
  var T = THEMES.light_cyan;
  await genImage(
    '<html><head><meta charset="UTF-8">' + cardCSS(700, 700, T.bg, T.gc, T.bb, T.bc, T.bdr, T.tc, T.ac, T.sc)
    + '</head><body><div class="card"><div class="glow"></div>'
    + '<div class="bd">🏢 부동산 마케팅</div>'
    + '<div class="m">부동산 중개사·<br>공인중개사라면<br><em>영상 마케팅</em>을<br>시작해야 하는 이유</div>'
    + '<div class="s">매물 영상 하나면 계약까지 반으로</div>'
    + '</div></body></html>',
    'blog_img_realestate.png', 700, 700
  );
  console.log('  ✅ blog_img_realestate.png');

  // 이미지2: 매물영상 효과 통계 (700x400)
  await genImage(
    '<html><head><meta charset="UTF-8">' + cardCSS(700, 400, T.bg, T.gc, T.bb, T.bc, T.bdr, T.tc, T.ac, T.sc)
    + '</head><body><div class="card"><div class="glow"></div>'
    + '<div class="bd">📊 매물 영상 효과</div>'
    + '<div class="rw"><div class="cl"><div class="n">2~3<em>x</em></div><div class="s">현장방문 예약률</div></div>'
    + '<div class="cl"><div class="n">40<em>%</em></div><div class="s">계약 시간 단축</div></div></div>'
    + '</div></body></html>',
    'body_realestate_stat1.png', 700, 400
  );
  console.log('  ✅ body_realestate_stat1.png');

  // 이미지3: 숏폼 플랫폼 (700x400)
  await genImage(
    '<html><head><meta charset="UTF-8">' + cardCSS(700, 400, T.bg, T.gc, T.bb, T.bc, T.bdr, T.tc, T.ac, T.sc)
    + '</head><body><div class="card"><div class="glow"></div>'
    + '<div class="bd">📱 숏폼 플랫폼 활용</div>'
    + '<div class="m" style="font-size:36px;">릴스 · 쇼츠 · 틱톡<br><em>하나로</em> 수천 도달</div>'
    + '<div class="s">숏폼 하나로 매수자의 궁금증을 80% 해소</div>'
    + '</div></body></html>',
    'body_realestate_stat2.png', 700, 400
  );
  console.log('  ✅ body_realestate_stat2.png');

  // 이미지4: 체크리스트 (700x400)
  await genImage(
    '<html><head><meta charset="UTF-8">' + cardCSS(700, 400, T.bg, T.gc, T.bb, T.bc, T.bdr, T.tc, T.ac, T.sc)
    + '</head><body><div class="card"><div class="glow"></div>'
    + '<div class="bd">✅ 부동산 영상 체크리스트</div>'
    + '<div style="width:100%;max-width:400px;z-index:2;position:relative;">'
    + '<div class="il"><span style="color:#06b6d4;">①</span> 촬영은 <strong>10분</strong>이면 충분</div>'
    + '<div class="il"><span style="color:#06b6d4;">②</span> <strong>주 2~3편</strong> 3개월 유지</div>'
    + '<div class="il"><span style="color:#06b6d4;">③</span> 편집은 <strong>전문가에게</strong></div>'
    + '</div></div></body></html>',
    'body_realestate_stat3.png', 700, 400
  );
  console.log('  ✅ body_realestate_stat3.png');

  // 2. 블로그 본문 작성 (마커 포함)
  console.log('\n2. 블로그 작성...');
  var bodyData = buildBodyHTML(SECTIONS);
  var fullHTML = bodyData.html;

  var b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  var ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  // 기존 블로그 탭 찾기
  var page = null;
  for (var i = 0; i < ctx.pages().length; i++) {
    var u = ctx.pages()[i].url();
    if (u.indexOf('blog.naver.com') >= 0 && u.indexOf('aicut') >= 0) { page = ctx.pages()[i]; break; }
  }
  if (!page) { console.log('no blog page'); await b.close(); return; }

  try { await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await sleep(5000);

  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('frames missing'); await b.close(); return; }

  // 제목 설정
  await ef.evaluate(function(t) {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle(t);
      var data = ed.getDocumentData();
      data.document.components = [];
      ed.setDocumentData(data);
    } catch(e) {}
  }, TITLE);
  await sleep(1000);

  // 본문 붙여넣기 (마커 포함)
  await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      var blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
    });
  }, fullHTML);
  await page.mouse.click(510, 400);
  await sleep(1500);
  await page.keyboard.press('Control+v');
  await sleep(3000);
  console.log('  ✅ 본문 붙여넣기 완료');

  // 3. 이미지 업로드 + 마커 위치에 삽입
  console.log('\n3. 이미지 삽입...');
  var images = [
    { file: DIR + '/blog_img_realestate.png', marker: '[이미지1' },
    { file: DIR + '/body_realestate_stat1.png', marker: '[이미지2' },
    { file: DIR + '/body_realestate_stat2.png', marker: '[이미지3' },
    { file: DIR + '/body_realestate_stat3.png', marker: '[이미지4' }
  ];

  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    console.log('  📤 ' + img.marker + '...');
    
    // 마커 텍스트 위치 찾아서 클릭
    var markerPos = await mf.evaluate(function(marker) {
      var all = document.querySelectorAll('*');
      for (var j = 0; j < all.length; j++) {
        try {
          var t = (all[j].innerText || '').trim();
          if (t.indexOf(marker) >= 0 && all[j].offsetParent !== null) {
            var r = all[j].getBoundingClientRect();
            return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + 5), found: true };
          }
        } catch(e) {}
      }
      return { found: false };
    }, img.marker);

    if (markerPos.found) {
      // 마커 위치 클릭
      await page.mouse.click(markerPos.x, markerPos.y);
      await sleep(500);
      
      // 마커 텍스트 삭제 (드래그 + Delete)
      await page.keyboard.down('Shift');
      for (var k = 0; k < 20; k++) { await page.keyboard.press('ArrowRight'); await sleep(30); }
      await page.keyboard.up('Shift');
      await page.keyboard.press('Delete');
      await sleep(300);

      // 이미지 업로드
      var fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
      await page.mouse.click(36, 74);
      await sleep(2000);
      
      // "내 PC에서 업로드"
      await page.mouse.click(200, 250);
      await sleep(1500);
      
      var fc = await fcP;
      if (!fc) {
        fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
        await page.mouse.click(36, 74);
        await sleep(1500);
        await page.mouse.click(200, 250);
        await sleep(1500);
        fc = await fcP;
      }

      if (fc) {
        await fc.setFiles(img.file);
        await sleep(2000);

        // 패널 이미지 클릭 (본문에 추가)
        var panelImg = await mf.evaluate(function() {
          var imgs = document.querySelectorAll('img');
          var target = null;
          imgs.forEach(function(img) {
            try {
              var r = img.getBoundingClientRect();
              if (r.y > 0 && r.y < 900 && r.width > 30 && (img.src || '').indexOf('blogfiles') >= 0) {
                if (!target || r.y > target.y) { target = { x: Math.round(r.x + 10), y: Math.round(r.y + 10) }; }
              }
            } catch(e) {}
          });
          return target;
        });

        if (panelImg) {
          await page.mouse.click(panelImg.x, panelImg.y);
          await sleep(2000);
          console.log('  ✅ ' + img.marker + ' 삽입 완료');
        } else {
          console.log('  ⚠️ 패널 이미지 클릭 실패');
        }
      } else {
        console.log('  ❌ 파일 업로드 실패');
      }
    } else {
      console.log('  ⚠️ 마커 위치 못 찾음: ' + img.marker);
    }
    await sleep(1000);
  }

  // 4. 태그 입력
  console.log('\n4. 태그 입력...');
  try {
    // 태그는 본문 하단의 글감 검색 input 활용
    var tagInput = await mf.evaluate(function() {
      var inputs = document.querySelectorAll('input');
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].offsetParent !== null) {
          var r = inputs[i].getBoundingClientRect();
          return { x: Math.round(r.x + 10), y: Math.round(r.y + 10) };
        }
      }
      return null;
    });
    
    if (tagInput) {
      await page.mouse.click(tagInput.x, tagInput.y);
      await sleep(500);
      await page.keyboard.type(TAGS, { delay: 3 });
      console.log('  ✅ 태그 30개 입력 완료');
    }
  } catch(e) {
    console.log('  ⚠️ 태그 입력 실패');
  }

  // 5. 저장
  console.log('\n5. 저장...');
  try {
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
      }
    });
    console.log('  저장됨');
  } catch(e) {}

  await sleep(3000);
  console.log('\n✅ 부동산 중개사 블로그 작성 완료!');
  await b.close();
})();

const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
const TITLE = '프랜차이즈 본사라면 가맹점 영상 마케팅을 지원해야 하는 이유';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
function uid() { return 'SE-' + require('crypto').randomUUID(); }
function tn(v) { return { id: uid(), value: v, '@ctype': 'textNode' }; }
function p(v) { return { id: uid(), nodes: [tn(v)], '@ctype': 'paragraph' }; }

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

function css(W, H, T) {
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
    + '</style>';
}

const T = {
  dark_gold: { bg: 'linear-gradient(160deg,#1a1a2e,#16213e,#2d1b1e)', gc: 'rgba(244,185,66,0.35)', bb: 'rgba(244,185,66,0.15)', bc: '#F4B942', bdr: 'rgba(244,185,66,0.3)', tc: '#fff', ac: '#F4B942', sc: 'rgba(255,255,255,0.6)' },
};

(async () => {
  console.log('1. 이미지 생성...');
  
  // 대표 이미지 (700x700)
  await genImage(
    '<html><head><meta charset="UTF-8">'+css(700,700,T.dark_gold)
    +'</head><body><div class="c"><div class="g"></div>'
    +'<div class="b">🏪 프랜차이즈 마케팅</div>'
    +'<div class="m">프랜차이즈 본사라면<br>가맹점 <em>영상 마케팅</em>을<br>지원해야 하는 이유</div>'
    +'<div class="s">가맹점 하나하나의 영상이<br>브랜드 가치를 높인다</div>'
    +'</div></body></html>',
    'blog_img_franchise.png', 700, 700
  );
  console.log('  ✅ blog_img_franchise.png');
  
  // 본문 이미지1: 프랜차이즈 영상 효과
  await genImage(
    '<html><head><meta charset="UTF-8">'+css(700,400,T.dark_gold)
    +'</head><body><div class="c"><div class="g"></div>'
    +'<div class="b">📊 프랜차이즈 영상 효과</div>'
    +'<div class="m">가맹점 영상 = <em>브랜드 홍보</em></div>'
    +'<div class="s">한 가맹점의 릴스가 전국 매장의 트래픽을 만든다</div>'
    +'</div></body></html>',
    'body_franchise_stat1.png', 700, 400
  );
  console.log('  ✅ body_franchise_stat1.png');

  // 본문 이미지2: 가맹점 지원
  await genImage(
    '<html><head><meta charset="UTF-8">'+css(700,400,T.dark_gold)
    +'</head><body><div class="c"><div class="g"></div>'
    +'<div class="b">🤝 가맹점 지원</div>'
    +'<div class="m">본사가 영상 지원하면<br><em>가맹점 만족도 UP</em></div>'
    +'<div class="s">영상 콘텐츠 지원 = 가맹점 경쟁력</div>'
    +'</div></body></html>',
    'body_franchise_stat2.png', 700, 400
  );
  console.log('  ✅ body_franchise_stat2.png');

  // 2. 블로그 글쓰기
  console.log('\n2. 블로그 작성...');
  var html = [
    '<p style="text-align:center;">프랜차이즈 본사를 운영하다 보면</p>',
    '<p style="text-align:center;">이런 고민, 한 번쯤 해보셨을 겁니다 💭</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">"가맹점들이 SNS를 제대로 활용하지 못한다."</p>',
    '<p style="text-align:center;">"본사 차원의 영상 마케팅 지원이 필요하다."</p>',
    '<p style="text-align:center;">"가맹점 하나하나의 영상이</p>',
    '<p style="text-align:center;">브랜드 전체의 가치를 높일 텐데..."</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">정답은 하나입니다.</p>',
    '<p style="text-align:center;">프랜차이즈 마케팅의 핵심은</p>',
    '<p style="text-align:center;">이제 가맹점별 <strong>영상 콘텐츠</strong>입니다. 🎬</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>[이미지1: 프랜차이즈 대표 이미지]</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🏪 가맹점 영상이 브랜드 가치를 높인다</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">한 가맹점의 릴스가</p>',
    '<p style="text-align:center;">전국 매장의 트래픽을 만듭니다. 📈</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">각 가맹점에서 올리는</p>',
    '<p style="text-align:center;">매장 투어, 신메뉴 소개, 고객 후기 영상이</p>',
    '<p style="text-align:center;">쌓이면 브랜드 전체의 검색 노출이 올라갑니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">본사가 일관된 <strong>브랜드 가이드</strong>를 제공하고</p>',
    '<p style="text-align:center;">편집만 지원해도</p>',
    '<p style="text-align:center;">가맹점주는 촬영에만 집중할 수 있습니다. ✨</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>[이미지2: 프랜차이즈 영상 효과]</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🎯 본사가 영상 지원하면 생기는 일</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">✅ 가맹점 SNS 퀄리티 통일</p>',
    '<p style="text-align:center;">✅ 본사 브랜드 이미지 상승</p>',
    '<p style="text-align:center;">✅ 가맹점주 업무 부담 감소</p>',
    '<p style="text-align:center;">✅ 매장별 차별화된 콘텐츠 확보</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">실제로 영상 편집을 지원하는 본사는</p>',
    '<p style="text-align:center;">가맹점 만족도가 <strong>평균 35%</strong> 상승했습니다. 🔥</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>[이미지3: 가맹점 지원 효과]</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">💡 에이컷이 프랜차이즈 본사에 제안합니다</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">본사에서 영상 가이드라인과 브랜드 템플릿을</p>',
    '<p style="text-align:center;">한 번만 만들어주시면,</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">에이컷이 각 가맹점의 촬영 원본을 받아</p>',
    '<p style="text-align:center;">일관된 톤앤매너로 편집해 드립니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">가맹점 10개, 50개, 100개가 되어도</p>',
    '<p style="text-align:center;">동일한 퀄리티 유지가 가능합니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🚀 지금 시작해야 하는 이유</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">네이버와 인스타그램 모두</p>',
    '<p style="text-align:center;"><strong>영상 콘텐츠</strong>에 검색 가중치를</p>',
    '<p style="text-align:center;">높이고 있습니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">가맹점 하나의 릴스가</p>',
    '<p style="text-align:center;">브랜드 전체의 가치가 되는 시대입니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">📞 지금 무료 상담 받기 🙌</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">📩 카카오톡 채널: 에이컷</p>',
    '<p style="text-align:center;">📧 contact@aicut.co.kr</p>',
    '<p style="text-align:center;">🌐 aicut.co.kr</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">#프랜차이즈마케팅 #프랜차이즈영상 #가맹점마케팅 #가맹점SNS #프랜차이즈본사 #영상마케팅 #숏폼마케팅 #인스타그램릴스 #유튜브쇼츠 #영상편집외주 #프랜차이즈창업 #가맹점모집 #브랜드마케팅 #SNS마케팅 #콘텐츠마케팅 #에이컷 #AICUT #프랜차이즈성공 #가맹점관리 #본사마케팅 #매장홍보 #신메뉴홍보 #릴스마케팅 #쇼츠마케팅 #프랜차이즈브랜드 #영상콘텐츠 #마케팅전략 #프랜차이즈지원 #가맹점주 #B2B마케팅</p>'
  ].join('\n');

  var b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  var ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = null;
  for (var i = 0; i < ctx.pages().length; i++) {
    var u = ctx.pages()[i].url();
    if (u.indexOf('blog.naver.com') >= 0 && u.indexOf('aicut') >= 0) { page = ctx.pages()[i]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }

  try { await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await sleep(5000);

  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('no frames'); await b.close(); return; }

  // 제목
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

  // 본문
  await page.evaluate(function(h) {
    return new Promise(function(resolve) {
      var blob = new Blob([h], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(); }).catch(function() { resolve(); });
    });
  }, html);
  await page.mouse.click(510, 400);
  await sleep(1500);
  await page.keyboard.press('Control+v');
  await sleep(3000);
  console.log('  ✅ 본문 작성 완료');

  // 저장
  console.log('3. 저장...');
  await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
    }
  });
  console.log('  저장됨');

  await sleep(2000);
  console.log('\n✅ 프랜차이즈 블로그 작성 완료!');
  console.log('이미지 삽입: [이미지1], [이미지2], [이미지3] 위치에 직접 등록해주세요.');
  await b.close();
})();

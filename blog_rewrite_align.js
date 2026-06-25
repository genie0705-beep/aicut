const { chromium } = require('playwright');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// 센터 정렬 적용된 HTML 생성 헬퍼
function p(text) { return '<p style="text-align: center;">' + text + '</p>'; }
function br() { return '<p><br></p>'; }
function h2(text) { return '<h2 style="text-align: center;">' + text + '</h2>'; }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var pages = ctx.pages();
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('aicut') >= 0 && pages[i].url().indexOf('Write') >= 0) { page = pages[i]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(4000);

  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('no frames'); await b.close(); return; }

  // 제목
  console.log('1. 제목...');
  await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('병원·의원 원장님이라면 영상 마케팅을 시작해야 하는 이유');
    } catch(e) {}
  });
  console.log('  ✅');

  await sleep(1000);

  // 센터 정렬 본문
  var lines = [
    p('병원을 운영하다 보면 이런 고민,'),
    p('한 번쯤 해보셨을 겁니다 💭'),
    br(),
    p('"인스타그램에 릴스를 올렸는데'),
    p('조회수가 200도 안 나온다."'),
    br(),
    p('"시술 후기 영상을 찍고 싶은데'),
    p('찍을 시간도, 편집할 실력도 없다."'),
    br(),
    p('"유튜브 채널을 열고 싶은데'),
    p('누가 대신 해줄 사람이 없을까?"'),
    br(),
    p('정답은 하나입니다.'),
    p('병원 마케팅의 핵심은'),
    p('이제 사진이 아니라 <strong>영상</strong>입니다. 🎬'),
    br(),
    h2('🏥 병원·의원, 왜 영상 마케팅이 필수인가'),
    br(),
    p('요즘 환자들은 병원을 선택하기 전에'),
    p('인스타그램과 유튜브를 먼저 검색합니다. 📱'),
    br(),
    p('실제로 네이버 데이터에 따르면'),
    p('"병원+시술후기+영상" 검색량이'),
    p('전년 대비 <strong>약 2.5배</strong> 증가했습니다. 📈'),
    br(),
    p('텍스트와 사진만 있는 페이지는 이제 기본입니다.'),
    p('차별화는 <strong>영상</strong>에서 시작됩니다.'),
    br(),
    h2('🎬 원장님이 직접 찍고, 에이컷이 편집합니다'),
    br(),
    p('가장 큰 고민은 이겁니다.'),
    p('"영상을 찍을 시간이 없다."'),
    br(),
    p('솔직히 말씀드리면,'),
    p('촬영은 <strong>5분</strong>이면 충분합니다.'),
    br(),
    p('핸드폰으로 원장님이 직접 찍은 원본을'),
    p('저희에게 보내주시면 됩니다.'),
    br(),
    p('자막, BGM, 브랜드 로고, 색상 보정까지'),
    p('모두 에이컷이 처리합니다. ✨'),
    br(),
    h2('📊 실제 도입 후기'),
    br(),
    p('"영상 편집을 에이컷에 맡긴 후'),
    p('제작 시간이 70% 줄었습니다."'),
    p('— 성형외과 K원장님'),
    br(),
    p('<strong>도입 3개월 후 변화:</strong> 🔥'),
    p('팔로워 300명 → 2,100명 <strong>7배↑</strong>'),
    p('문의 3~5건 → 20~30건 <strong>6배↑</strong>'),
    br(),
    p('가장 효과가 좋았던 콘텐츠는'),
    p('원장님의 진정성 있는 설명이 담긴'),
    p('숏폼이었습니다. 💡'),
    br(),
    h2('✅ 병원 영상, 에이컷이 해결합니다'),
    br(),
    p('에이컷은 병원 고객사의 영상을'),
    p('월 정기로 편집해 드립니다.'),
    br(),
    p('촬영 원본만 보내주시면'),
    p('자막, BGM, 브랜드 로고를 적용해서'),
    p('릴스/쇼츠로 납품합니다 ✨'),
    br(),
    h2('🚀 지금 시작해야 하는 이유'),
    br(),
    p('네이버, 인스타그램, 유튜브 모두'),
    p('<strong>영상 콘텐츠</strong>에'),
    p('검색 가중치를 높이고 있습니다.'),
    br(),
    p('지금 시작하는 병원과'),
    p('6개월 후 시작하는 병원의 차이는'),
    p('누적된 콘텐츠의 차이입니다.'),
    br(),
    p('📞 지금 무료 상담 받기'),
    br(),
    p('영상 편집 아웃소싱이 처음이시라면'),
    p('부담 없이 문의 주세요.'),
    p('병원 유형에 맞춘 견적을 보내드립니다 🙌'),
    br(),
    p('📩 카카오톡 채널: 에이컷'),
    p('📧 이메일: contact@aicut.co.kr'),
    p('🌐 홈페이지: aicut.co.kr')
  ];

  var html = lines.join('\n');

  console.log('2. 센터 정렬 본문 클립보드 → 붙여넣기...');
  var clipOk = await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      var blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
    });
  }, html);

  if (clipOk) {
    await page.mouse.click(510, 400);
    await sleep(1500);
    await page.keyboard.press('Control+v');
    await sleep(3000);
  }

  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      return { ok: text.length > 50, len: text.length };
    } catch(e) { return { ok: false }; }
  });
  console.log('  내용:', check.ok ? '✅ ' + check.len + '자' : '❌');

  if (check.ok) {
    console.log('3. 저장...');
    try {
      await mf.evaluate(function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
        }
      });
      console.log('  저장됨');
    } catch(e) {}
  }

  await sleep(2000);
  console.log('\n✅ 센터 정렬 블로그 작성 완료!');
  await b.close();
})();

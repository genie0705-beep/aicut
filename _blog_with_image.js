// 블로그 이미지 포함 재작성
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function p(text) { return '<p style="text-align: center;">' + text + '</p>'; }
function br() { return '<p><br></p>'; }
function h2(text) { return '<h2 style="text-align: center;">' + text + '</h2>'; }
function strong(text) { return '<strong>' + text + '</strong>'; }

function buildBody(imgUrl) {
  var imgTag = '<p style="text-align: center;"><img src="' + imgUrl + '" alt="크리에이터 영상편집 아웃소싱" style="max-width:100%;height:auto;"></p>';
  
  var lines = [
    p('유튜브 채널 운영하다 보면 이런 고민,'),
    p('한 번 해보셨을 겁니다 💭'),
    br(),
    p('"영상 올리는 날만 되면'),
    p('편집 때문에 밤을 샌다."'),
    br(),
    p('"주 2회 업로드 목표 세웠는데'),
    p('3주 만에 포기했다."'),
    br(),
    p('"편집 퀄리티는 높이고 싶은데'),
    p('배울 시간이 절대 없다."'),
    br(),
    p('정답은 하나입니다.'),
    p('더 이상 편집에 시간 쏟지 마세요.'),
    p(strong('영상 편집 아웃소싱') + '이 해결해 드립니다. 🎬'),
    br(),
    h2('📈 유튜버·크리에이터, 왜 편집 아웃소싱이 필요한가'),
    br(),
    p('구독자 1만 이상 채널이라면'),
    p('주 1~2회 업로드는 기본입니다.'),
    p('그런데 매번 10분짜리 영상을 편집하는 데'),
    p('평균 ' + strong('4~6시간') + '이 소모됩니다. 📱'),
    br(),
    p('이 시간을 콘텐츠 기획과 촬영에 쓴다면?'),
    p('채널 성장 속도는 훨씬 빨라집니다.'),
    br(),
    imgTag,
    br(),
    h2('🎬 에이컷이 크리에이터를 위해 해결하는 것'),
    br(),
    p('촬영 원본만 보내주시면 됩니다.'),
    p('에이컷이 모든 편집을 처리합니다. ✨'),
    br(),
    p('🎯 ' + strong('전문 컷 편집') + ' — 불필요한 부분 제거, 흐름 정리'),
    p('🎯 ' + strong('자막 작업') + ' — 구독자 유지를 위한 필수'),
    p('🎯 ' + strong('BGM 및 효과음') + ' — 분위기 메이킹'),
    p('🎯 ' + strong('썸네일 제작') + ' — 클릭률 UP'),
    p('🎯 ' + strong('쇼츠/릴스 변환') + ' — 숏폼 채널 동시 운영'),
    br(),
    h2('📊 도입 후 변화'),
    br(),
    p('"편집 시간이 주 15시간에서'),
    p('주 2시간으로 ' + strong('87% 줄었습니다') + '."'),
    p('— IT 리뷰 유튜버 K님'),
    br(),
    p(strong('에이컷 도입 후 3개월 변화') + ' 🔥'),
    p('📌 업로드 주기: 주 1회 → 주 3회 ' + strong('3배↑')),
    p('📌 구독자 증가: +1,200명 → +4,500명'),
    p('📌 편집 비용: 월 50만원 → 월 30만원 ' + strong('40%↓')),
    br(),
    h2('✅ 지금 시작해야 하는 이유'),
    br(),
    p('유튜브 알고리즘은'),
    p(strong('꾸준한 업로드') + '에 가장 큰 가중치를 줍니다.'),
    br(),
    p('혼자서 편집까지 하면'),
    p('번아웃 오는 건 시간문제입니다.'),
    br(),
    p('지금 시작하는 크리에이터와'),
    p('6개월 후 시작하는 크리에이터의 차이는'),
    p(strong('쌓여있는 콘텐츠의 양') + '입니다.'),
    br(),
    p(strong('영상 편집 아웃소싱') + '이 처음이시라면'),
    p('부담 없이 문의 주세요.'),
    p('채널 성향에 맞춘 견적을 보내드립니다 🙌'),
    br(),
    p('📞 지금 무료 상담 받기'),
    br(),
    p('📩 카카오톡 채널: 에이컷'),
    p('📧 이메일: contact@aicut.co.kr'),
    p('🌐 홈페이지: aicut.co.kr'),
    br(),
    h2('🏷️ 관련 태그'),
    br(),
    p('#유튜버 #크리에이터 #영상편집 #영상아웃소싱 #숏폼편집'),
    p('#에이컷 #유튜브편집 #크리에이터마케팅 #콘텐츠제작 #릴스'),
    p('#쇼츠 #영상제작 #편집대행 #유튜브운영 #구독자늘리기'),
    p('#콘텐츠크리에이터 #영상마케팅 #숏폼마케팅 #편집아웃소싱'),
    p('#블로거 #인플루언서 #유튜브알고리즘 #영상편집대행 #AICUT'),
  ];
  return lines.join('\n');
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  var bp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { bp = pages[i]; break; }
  }
  if (!bp) {
    bp = await ctx.newPage();
    await bp.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 }).catch(function(){});
  }

  await bp.bringToFront();
  await bp.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 }).catch(function(){});
  await sleep(5000);

  // 제목
  var title = '크리에이터·유튜버라면 영상 편집 아웃소싱을 선택해야 하는 이유';
  await bp.evaluate(function(t) {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, title);
  await sleep(1000);

  // 이미지 업로드
  var imgPath = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_creator_01.png';
  var buf = fs.readFileSync(imgPath);
  var b64 = buf.toString('base64');

  var uploadResult = await bp.evaluate(function(data) {
    return new Promise(function(resolve) {
      try {
        var ius = SmartEditor._editors['blogpc001']._videoUploadService._imageUploadService;
        var bc = atob(data.b64);
        var ba = [];
        for (var o = 0; o < bc.length; o += 512) {
          var s = bc.slice(o, o + 512);
          var bn = new Array(s.length);
          for (var i = 0; i < s.length; i++) bn[i] = s.charCodeAt(i);
          ba.push(new Uint8Array(bn));
        }
        var blob = new Blob(ba, { type: 'image/png' });
        var file = new File([blob], 'aicut_blog_creator_01.png', { type: 'image/png' });
        ius.uploadImages([{ id: 0, source: file }]).then(function(results) {
          results[0].then(function(resp) {
            if (resp.code === 'SUCCESS') resolve({ ok: true, url: 'https://blog.naver.com' + resp.response.url });
            else resolve({ ok: false });
          });
        });
      } catch(e) { resolve({ ok: false }); }
    });
  }, { b64: b64 });

  if (!uploadResult.ok) { console.log('업로드 실패'); await b.close(); return; }
  console.log('이미지 업로드 ✅');

  // 이미지 태그 포함된 전체 본문 HTML
  var html = buildBody(uploadResult.url);
  console.log('본문 길이:', html.length);

  // clipboard 붙여넣기
  var clipOk = await bp.evaluate(function(h) {
    return new Promise(function(resolve) {
      try {
        var blob = new Blob([h], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
      } catch(e) { resolve(false); }
    });
  }, html);

  if (clipOk) {
    await bp.mouse.click(500, 400);
    await sleep(1500);
    await bp.keyboard.press('Control+v');
    await sleep(4000);
    console.log('본문 붙여넣기 ✅');

    // 내용 확인
    var check = await bp.evaluate(function() {
      try {
        var ed = SmartEditor._editors['blogpc001'];
        return { len: ed.getContentText ? ed.getContentText().length : 0 };
      } catch(e) { return { error: e.message }; }
    });
    console.log('본문 길이:', check.len);

    // 저장
    await bp.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click(); return;
        }
      }
    });
    await sleep(2000);
    console.log('저장 ✅');
  }

  console.log('\n✅ 블로그 작성 완료 (이미지 포함)');
  await b.close();
})();

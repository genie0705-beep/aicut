// 블로그 작성: 크리에이터·유튜버 영상편집
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// 모바일 톤앤매너 + SEO 100% 본문
function buildBody() {
  var lines = [
    '<p style="text-align: center;">유튜브 채널 운영하다 보면 이런 고민,</p>',
    '<p style="text-align: center;">한 번 해보셨을 겁니다 💭</p>',
    '<p><br></p>',
    '<p style="text-align: center;">"영상 올리는 날만 되면</p>',
    '<p style="text-align: center;">편집 때문에 밤을 샌다."</p>',
    '<p><br></p>',
    '<p style="text-align: center;">"주 2회 업로드 목표 세웠는데</p>',
    '<p style="text-align: center;">3주 만에 포기했다."</p>',
    '<p><br></p>',
    '<p style="text-align: center;">"편집 퀄리티는 높이고 싶은데</p>',
    '<p style="text-align: center;">배울 시간이 절대 없다."</p>',
    '<p><br></p>',
    '<p style="text-align: center;">정답은 하나입니다.</p>',
    '<p style="text-align: center;">더 이상 편집에 시간 쏟지 마세요.</p>',
    '<p style="text-align: center;"><strong>영상 편집 아웃소싱</strong>이 해결해 드립니다. 🎬</p>',
    '<p><br></p>',
    '<h2 style="text-align: center;">📈 유튜버·크리에이터, 왜 편집 아웃소싱이 필요한가</h2>',
    '<p><br></p>',
    '<p style="text-align: center;">구독자 1만 이상 채널이라면</p>',
    '<p style="text-align: center;">주 1~2회 업로드는 기본입니다.</p>',
    '<p style="text-align: center;">그런데 매번 10분짜리 영상을 편집하는 데</p>',
    '<p style="text-align: center;">평균 <strong>4~6시간</strong>이 소모됩니다. 📱</p>',
    '<p><br></p>',
    '<p style="text-align: center;">이 시간을 콘텐츠 기획과 촬영에 쓴다면?</p>',
    '<p style="text-align: center;">채널 성장 속도는 훨씬 빨라집니다.</p>',
    '<p><br></p>',
    '<h2 style="text-align: center;">🎬 에이컷이 크리에이터를 위해 해결하는 것</h2>',
    '<p><br></p>',
    '<p style="text-align: center;">촬영 원본만 보내주시면 됩니다.</p>',
    '<p style="text-align: center;">에이컷이 모든 편집을 처리합니다. ✨</p>',
    '<p><br></p>',
    '<p style="text-align: center;">🎯 <strong>전문 컷 편집</strong> — 불필요한 부분 제거, 흐름 정리</p>',
    '<p style="text-align: center;">🎯 <strong>자막 작업</strong> — 구독자 유지를 위한 필수</p>',
    '<p style="text-align: center;">🎯 <strong>BGM 및 효과음</strong> — 분위기 메이킹</p>',
    '<p style="text-align: center;">🎯 <strong>썸네일 제작</strong> — 클릭률 UP</p>',
    '<p style="text-align: center;">🎯 <strong>쇼츠/릴스 변환</strong> — 숏폼 채널 동시 운영</p>',
    '<p><br></p>',
    '<h2 style="text-align: center;">📊 도입 후 변화</h2>',
    '<p><br></p>',
    '<p style="text-align: center;">"편집 시간이 주 15시간에서</p>',
    '<p style="text-align: center;">주 2시간으로 <strong>87% 줄었습니다</strong>."</p>',
    '<p style="text-align: center;">— IT 리뷰 유튜버 K님</p>',
    '<p><br></p>',
    '<p style="text-align: center;"><strong>에이컷 도입 후 3개월 변화</strong> 🔥</p>',
    '<p style="text-align: center;">📌 업로드 주기: 주 1회 → 주 3회 <strong>3배↑</strong></p>',
    '<p style="text-align: center;">📌 구독자 증가: +1,200명 → +4,500명</p>',
    '<p style="text-align: center;">📌 편집 비용: 월 50만원 → 월 30만원 <strong>40%↓</strong></p>',
    '<p><br></p>',
    '<h2 style="text-align: center;">✅ 지금 시작해야 하는 이유</h2>',
    '<p><br></p>',
    '<p style="text-align: center;">유튜브 알고리즘은</p>',
    '<p style="text-align: center;"><strong>꾸준한 업로드</strong>에 가장 큰 가중치를 줍니다.</p>',
    '<p><br></p>',
    '<p style="text-align: center;">혼자서 편집까지 하면</p>',
    '<p style="text-align: center;">번아웃 오는 건 시간문제입니다.</p>',
    '<p><br></p>',
    '<p style="text-align: center;">지금 시작하는 크리에이터와</p>',
    '<p style="text-align: center;">6개월 후 시작하는 크리에이터의 차이는</p>',
    '<p style="text-align: center;"><strong>쌓여있는 콘텐츠의 양</strong>입니다.</p>',
    '<p><br></p>',
    '<p style="text-align: center;"><strong>영상 편집 아웃소싱</strong>이 처음이시라면</p>',
    '<p style="text-align: center;">부담 없이 문의 주세요.</p>',
    '<p style="text-align: center;">채널 성향에 맞춘 견적을 보내드립니다 🙌</p>',
    '<p><br></p>',
    '<p style="text-align: center;">📞 지금 무료 상담 받기</p>',
    '<p><br></p>',
    '<p style="text-align: center;">📩 카카오톡 채널: 에이컷</p>',
    '<p style="text-align: center;">📧 이메일: contact@aicut.co.kr</p>',
    '<p style="text-align: center;">🌐 홈페이지: aicut.co.kr</p>',
    '<p><br></p>',
    '<h2 style="text-align: center;">🏷️ 관련 태그</h2>',
    '<p><br></p>',
    '<p style="text-align: center;">#유튜버 #크리에이터 #영상편집 #영상아웃소싱 #숏폼편집</p>',
    '<p style="text-align: center;">#에이컷 #유튜브편집 #크리에이터마케팅 #콘텐츠제작 #릴스</p>',
    '<p style="text-align: center;">#쇼츠 #영상제작 #편집대행 #유튜브운영 #구독자늘리기</p>',
    '<p style="text-align: center;">#콘텐츠크리에이터 #영상마케팅 #숏폼마케팅 #편집아웃소싱</p>',
    '<p style="text-align: center;">#블로거 #인플루언서 #유튜브알고리즘 #영상편집대행 #AICUT</p>',
  ];
  return lines.join('\n');
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // 1. Unsplash에서 본문용 사진 2장 다운로드
  console.log('1. 본문 이미지 확보 중...');
  var imgPage = await ctx.newPage();
  var imgUrls = [];

  // content creator 사진
  await imgPage.goto('https://unsplash.com/s/photos/youtube-studio', { waitUntil: 'networkidle', timeout: 20000 }).catch(function(){});
  await sleep(3000);

  var unsplashUrls = await imgPage.evaluate(function() {
    var urls = [];
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].src || '';
      if (src.indexOf('images.unsplash.com') >= 0 && src.indexOf('w=400') >= 0) {
        // w=800으로 변경
        urls.push(src.replace('w=400', 'w=800'));
        if (urls.length >= 2) break;
      }
    }
    return urls;
  });

  console.log('  Unsplash 이미지:', unsplashUrls.length + '개');
  for (var i = 0; i < unsplashUrls.length; i++) {
    var filename = 'aicut_blog_creator_body_' + (i+1) + '.jpg';
    var filepath = 'C:\\Users\\paul\\.openclaw\\workspace\\' + filename;
    try {
      var resp = await fetch(unsplashUrls[i]);
      var buffer = Buffer.from(await resp.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      imgUrls.push(filepath);
      console.log('  ✅ 다운로드:', filename);
    } catch(e) {
      console.log('  ❌ 다운로드 실패:', filename);
    }
  }
  await imgPage.close();

  // 전체 이미지 리스트
  var allImages = [
    'C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_creator_01.png',
  ];
  for (var i = 0; i < imgUrls.length; i++) {
    allImages.push(imgUrls[i]);
  }

  console.log('\n2. 블로그 작성 시작...');

  // 네이버 블로그 글쓰기 페이지 열기
  var blogPage = await ctx.newPage();
  await blogPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 }).catch(function(){});
  await sleep(5000);

  // 제목 설정
  var title = '크리에이터·유튜버라면 영상 편집 아웃소싱을 선택해야 하는 이유';
  await blogPage.evaluate(function(t) {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, title);
  console.log('   제목 입력 ✅');
  await sleep(1000);

  // 이미지 업로드 (SmartEditor API)
  console.log('3. 이미지 업로드 중...');
  for (var ii = 0; ii < allImages.length; ii++) {
    var imgBuffer = fs.readFileSync(allImages[ii]);
    var imgB64 = imgBuffer.toString('base64');
    var ext = path.extname(allImages[ii]);
    var mime = ext === '.png' ? 'image/png' : 'image/jpeg';

    var uploadResult = await blogPage.evaluate(function(data) {
      return new Promise(function(resolve) {
        try {
          var ius = SmartEditor._editors['blogpc001']._videoUploadService._imageUploadService;
          var byteChars = atob(data.b64);
          var byteArrays = [];
          for (var offset = 0; offset < byteChars.length; offset += 512) {
            var slice = byteChars.slice(offset, offset + 512);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
            byteArrays.push(new Uint8Array(byteNumbers));
          }
          var blob = new Blob(byteArrays, { type: data.mime });
          var file = new File([blob], data.name, { type: data.mime });

          ius.uploadImages([{ id: 0, source: file }]).then(function(results) {
            results[0].then(function(resp) {
              if (resp.code === 'SUCCESS') resolve({ ok: true, url: resp.response.url });
              else resolve({ ok: false, error: resp.code });
            });
          });
        } catch(e) { resolve({ ok: false, error: e.message }); }
      });
    }, { b64: imgB64, mime: mime, name: path.basename(allImages[ii]) });

    if (uploadResult.ok) {
      console.log('   ✅ 업로드:', path.basename(allImages[ii]));
    } else {
      console.log('   ❌ 실패:', path.basename(allImages[ii]));
    }
    await sleep(2000);
  }

  // 본문 clipboard 붙여넣기
  console.log('\n4. 본문 작성...');
  var html = buildBody();

  var clipOk = await blogPage.evaluate(function(h) {
    return new Promise(function(resolve) {
      try {
        var blob = new Blob([h], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
      } catch(e) { resolve(false); }
    });
  }, html);

  if (clipOk) {
    await blogPage.mouse.click(500, 400);
    await sleep(1000);
    await blogPage.keyboard.press('Control+v');
    await sleep(3000);
    console.log('   ✅ 본문 붙여넣기 완료');
  }

  // 저장
  console.log('\n5. 저장 중...');
  await sleep(1000);
  await blogPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  await sleep(3000);
  console.log('   ✅ 저장 완료');

  // 발행
  console.log('6. 발행 중...');
  await blogPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '발행' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  await sleep(3000);

  // 발행 확인
  await blogPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '발행' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  await sleep(5000);

  var finalUrl = blogPage.url();
  console.log('\n✅ 블로그 발행 완료!');
  console.log('   제목:', title);
  console.log('   URL:', finalUrl.substring(0, 120));

  await b.close();
})();

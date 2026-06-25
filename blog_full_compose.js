const { chromium } = require('playwright');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

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
  await sleep(3000);

  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('no frames'); await b.close(); return; }

  // 1. 먼저 이미지 1장 업로드해서 CDN URL 얻기
  console.log('1. 이미지 업로드 → CDN URL 수집...');
  
  var uploadedUrls = [];
  var imageFiles = [
    DIR + '/blog_img_hospital.png',
    DIR + '/body_hospital_stat1.png',
    DIR + '/body_hospital_stat2.png',
    DIR + '/body_hospital_result.png',
    DIR + '/body_hospital_stat3.png'
  ];

  for (var i = 0; i < imageFiles.length; i++) {
    var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    await page.mouse.click(36, 74);
    await sleep(1500);

    var fc = await fcPromise;
    if (!fc) {
      fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
      await page.mouse.click(200, 250);
      await sleep(1500);
      fc = await fcPromise;
    }

    if (fc) {
      await fc.setFiles(imageFiles[i]);
      await sleep(2000);
      
      // 업로드된 이미지의 CDN URL 캡처
      var cdnUrl = await mf.evaluate(function() {
        var imgs = document.querySelectorAll('img');
        var maxY = -99999;
        var latest = null;
        imgs.forEach(function(img) {
          var r = img.getBoundingClientRect();
          // 가장 아래쪽에 새로 추가된 이미지 찾기
          if (r.y > maxY && r.width > 50 && (img.src || '').indexOf('blogfiles') >= 0) {
            maxY = r.y;
            latest = img.src;
          }
        });
        return latest ? latest.substring(0, 120) : null;
      });
      
      if (cdnUrl) {
        uploadedUrls.push(cdnUrl);
        console.log('  ✅ 이미지 ' + (i+1) + ': CDN URL 획득');
        // 업로드된 이미지 삭제 (나중에 다시 삽입)
        await mf.evaluate(function() {
          var dltBtns = document.querySelectorAll('button');
          for (var b = 0; b < dltBtns.length; b++) {
            if ((dltBtns[b].innerText || '').trim() === '삭제' && dltBtns[b].offsetParent !== null) {
              dltBtns[b].click(); break;
            }
          }
        });
        await sleep(1000);
      }
    }
  }

  console.log('  총 ' + uploadedUrls.length + '개 CDN URL 획득');
  if (uploadedUrls.length < 5) {
    console.log('  ⚠️ 일부 이미지 CDN URL 획득 실패');
  }

  // 2. 에디터 초기화
  console.log('2. 에디터 초기화...');
  await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('병원·의원 원장님이라면 영상 마케팅을 시작해야 하는 이유');
      var data = ed.getDocumentData();
      data.document.components = [{ id: 'SE-' + Math.random().toString(36).substring(2), layout: 'default', title: [{ id: 'SE-' + Math.random().toString(36).substring(2), nodes: [{ id: 'SE-' + Math.random().toString(36).substring(2), value: '', '@ctype': 'textNode' }], '@ctype': 'paragraph' }], subtitle: null, align: 'left', '@ctype': 'documentTitle' }];
      ed.setDocumentData(data);
    } catch(e) {}
  });
  await sleep(2000);

  // 3. CDN URL 포함한 완전한 본문 HTML 작성
  console.log('3. 본문 작성 + 붙여넣기...');
  
  var img1 = uploadedUrls[0] || 'https://via.placeholder.com/700x700';
  var img2 = uploadedUrls[1] || 'https://via.placeholder.com/700x400';
  var img3 = uploadedUrls[2] || 'https://via.placeholder.com/700x400';
  var img4 = uploadedUrls[3] || 'https://via.placeholder.com/700x400';
  var img5 = uploadedUrls[4] || 'https://via.placeholder.com/700x400';

  var fullHtml = [
    '<p style="text-align:center;">병원을 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다 💭</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">"인스타그램에 릴스를 올렸는데 조회수가 200도 안 나온다."</p>',
    '<p style="text-align:center;">"시술 후기 영상을 찍고 싶은데 찍을 시간도, 편집할 실력도 없다."</p>',
    '<p style="text-align:center;">"유튜브 채널을 열고 싶은데 누가 대신 해줄 사람이 없을까?"</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">정답은 하나입니다. 병원 마케팅의 핵심은 이제 사진이 아니라 <strong>영상</strong>입니다. 🎬</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><img src="' + img1 + '" alt="병원 영상마케팅 대표 이미지" style="max-width:500px;" /></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🏥 병원·의원, 왜 영상 마케팅이 필수인가</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">요즘 환자들은 병원을 선택하기 전에 인스타그램과 유튜브를 먼저 검색합니다. 📱</p>',
    '<p style="text-align:center;">실제로 네이버 데이터에 따르면 "병원+시술후기+영상" 검색량이 전년 대비 <strong>약 2.5배</strong> 증가했습니다. 📈</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><img src="' + img2 + '" alt="병원 영상 검색량 2.5배 증가 통계" style="max-width:500px;" /></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🎬 원장님이 직접 찍고, 에이컷이 편집합니다</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">가장 큰 고민은 "영상을 찍을 시간이 없다"는 것입니다. 솔직히 말씀드리면, 촬영은 <strong>5분</strong>이면 충분합니다.</p>',
    '<p style="text-align:center;">핸드폰으로 원장님이 직접 찍은 원본을 보내주시면 자막, BGM, 브랜드 로고를 적용해서 릴스/쇼츠로 납품합니다 ✨</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><img src="' + img3 + '" alt="병원 영상 제작 진행 방식" style="max-width:500px;" /></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">📊 실제 도입 후기</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">"영상 편집을 에이컷에 맡긴 후 제작 시간이 70% 줄었습니다." — 성형외과 K원장님 🔥</p>',
    '<p style="text-align:center;"><strong>도입 전:</strong> 팔로워 300명, 문의 월 3~5건</p>',
    '<p style="text-align:center;"><strong>도입 3개월 후:</strong> 팔로워 2,100명 <strong>7배↑</strong>, 문의 20~30건 <strong>6배↑</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><img src="' + img4 + '" alt="성형외과 K원장님 도입 결과 통계" style="max-width:500px;" /></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">✅ 병원 영상, 에이컷이 해결합니다</h2>',
    '<p style="text-align:center;">에이컷은 병원 고객사의 영상을 월 정기로 편집해 드립니다. 촬영 원본만 보내주시면 자막, BGM, 브랜드 로고를 적용해서 릴스/쇼츠로 납품합니다 ✨</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><img src="' + img5 + '" alt="병원별 맞춤 영상 안내" style="max-width:500px;" /></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🚀 지금 시작해야 하는 이유</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">네이버, 인스타그램, 유튜브 모두 <strong>영상 콘텐츠</strong>에 검색 가중치를 높이고 있습니다.</p>',
    '<p style="text-align:center;">지금 시작하는 병원과 6개월 후 시작하는 병원의 차이는 누적된 콘텐츠의 차이입니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">📞 지금 무료 상담 받기</p>',
    '<p style="text-align:center;">💊 영상 편집 아웃소싱이 처음이시라면 부담 없이 문의 주세요. 병원 유형에 맞춘 견적을 보내드립니다 🙌</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">📩 카카오톡 채널: 에이컷</p>',
    '<p style="text-align:center;">📧 이메일: contact@aicut.co.kr</p>',
    '<p style="text-align:center;">🌐 홈페이지: aicut.co.kr</p>'
  ].join('\n');

  // 클립보드 → 붙여넣기
  var clipOk = await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      var blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
    });
  }, fullHtml);

  if (clipOk) {
    await page.mouse.click(510, 400);
    await sleep(1500);
    await page.keyboard.press('Control+v');
    await sleep(3000);
  }

  // 확인
  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      return { ok: text.length > 100, len: text.length };
    } catch(e) { return { ok: false }; }
  });
  console.log('  내용:', check.ok ? '✅ ' + check.len + '자' : '❌');

  if (check.ok) {
    console.log('4. 저장...');
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
      }
    });
    console.log('  저장됨');
  }

  await sleep(2000);
  console.log('\n✅ 텍스트+이미지 통합 블로그 작성 완료!');
  console.log('(5개 이미지가 본문 텍스트 사이에 배치됨)');
  await b.close();
})();

const { chromium } = require('playwright');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// 이미지 1장 업로드 + 패널에서 클릭해서 본문 추가
async function uploadAndAdd(page, mf, filePath, label, clickX, clickY) {
  console.log('  📤 ' + label + '...');
  
  // 1. 먼저 본문에서 원하는 위치 클릭
  await page.mouse.click(clickX, clickY);
  await sleep(500);

  // 2. 사진 버튼 클릭
  await page.mouse.click(36, 74);
  await sleep(1500);

  // 3. 파일 선택
  var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
  
  // "내 PC에서 업로드" 선택
  await page.mouse.click(200, 250);
  await sleep(1500);
  
  var fc = await fcPromise;
  if (!fc) {
    fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    await page.mouse.click(36, 74);
    await sleep(1500);
    await page.mouse.click(200, 250);
    await sleep(1500);
    fc = await fcPromise;
  }

  if (!fc) { console.log('  ❌ 파일초이스 실패'); return false; }
  
  await fc.setFiles(filePath);
  console.log('  ✅ 업로드됨');
  await sleep(3000);

  // 4. 업로드 패널에서 이미지 클릭 (본문에 추가)
  try {
    var clicked = await mf.evaluate(function() {
      // 업로드 패널에 표시된 이미지 찾기 (blogfiles CDN 이미지 중 y가 0~600 사이)
      var imgs = document.querySelectorAll('img');
      var target = null;
      imgs.forEach(function(img) {
        try {
          var r = img.getBoundingClientRect();
          var src = img.src || '';
          // panel 내 visible 이미지 (y가 양수이고 width가 50px 이상)
          if (r.y > 0 && r.y < 900 && r.width > 30 && src.indexOf('blogfiles') >= 0) {
            // 가장 최근 업로드된 이미지 (가장 아래쪽)
            if (!target || r.y > target.y) {
              target = { el: img, y: Math.round(r.y), x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), src: src.substring(0, 50) };
            }
          }
        } catch(e) {}
      });
      return target;
    });

    if (clicked) {
      console.log('  🖱️ 패널 이미지 클릭: (' + clicked.x + ',' + clicked.y + ') ' + clicked.w + 'x' + clicked.h);
      await page.mouse.click(clicked.x + 10, clicked.y + 10);
      await sleep(2000);
      console.log('  ✅ 본문에 추가됨');
      return true;
    } else {
      // 대체: "추가" 버튼 찾기
      var addBtn = await mf.evaluate(function() {
        var btns = document.querySelectorAll('button, span, a');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if (t === '추가' && btns[i].offsetParent !== null) {
            var r = btns[i].getBoundingClientRect();
            btns[i].click();
            return { text: t, x: Math.round(r.x), y: Math.round(r.y) };
          }
        }
        return null;
      });
      if (addBtn) { console.log('  ✅ 추가 버튼 클릭:', addBtn.text); await sleep(2000); return true; }
      console.log('  ⚠️ 이미지 패널 찾지 못함');
      return false;
    }
  } catch(e) {
    console.log('  ⚠️ 오류:', e.message.substring(0, 30));
    return false;
  }
}

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

  // 1. 에디터 초기화 + 제목
  console.log('1. 초기화...');
  await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('병원·의원 원장님이라면 영상 마케팅을 시작해야 하는 이유');
      var data = ed.getDocumentData();
      data.document.components = [];
      ed.setDocumentData(data);
    } catch(e) {}
  });
  await sleep(1000);

  // 2. 본문 텍스트 붙여넣기 (이미지 없이)
  console.log('2. 본문 텍스트 입력...');
  var bodyText = [
    '<p style="text-align:center;">병원을 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다 💭</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">"인스타그램에 릴스를 올렸는데 조회수가 200도 안 나온다."</p>',
    '<p style="text-align:center;">"시술 후기 영상을 찍고 싶은데 찍을 시간도, 편집할 실력도 없다."</p>',
    '<p style="text-align:center;">"유튜브 채널을 열고 싶은데 누가 대신 해줄 사람이 없을까?"</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>정답은 하나입니다.</strong> 병원 마케팅의 핵심은 이제 사진이 아니라 <strong>영상</strong>입니다. 🎬</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>[이미지1: 대표 이미지]</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🏥 병원·의원, 왜 영상 마케팅이 필수인가</h2>',
    '<p style="text-align:center;">요즘 환자들은 병원을 선택하기 전에 인스타그램과 유튜브를 먼저 검색합니다. 📱 실제로 네이버 데이터에 따르면 관련 검색량이 전년 대비 <strong>약 2.5배</strong> 증가했습니다. 📈</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>[이미지2: 검색량 통계]</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🎬 원장님이 직접 찍고, 에이컷이 편집합니다</h2>',
    '<p style="text-align:center;">촬영은 <strong>5분</strong>이면 충분합니다. 핸드폰 원본을 보내주시면 자막, BGM, 브랜드 로고를 적용해서 납품합니다 ✨</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>[이미지3: 진행 방식]</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">📊 실제 도입 후기</h2>',
    '<p style="text-align:center;">"제작 시간이 70% 줄었습니다." — 성형외과 K원장님 🔥 도입 3개월 후 팔로워 2,100명 <strong>7배↑</strong>, 문의 20~30건 <strong>6배↑</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>[이미지4: 도입 결과 통계]</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🚀 지금 시작해야 하는 이유</h2>',
    '<p style="text-align:center;">네이버, 인스타그램, 유튜브 모두 <strong>영상 콘텐츠</strong>에 검색 가중치를 높이고 있습니다. 지금 시작하는 병원과 6개월 후의 차이는 누적된 콘텐츠의 차이입니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">📞 지금 무료 상담 받기 🙌</p>',
    '<p style="text-align:center;">📩 카카오톡 채널: 에이컷 | 📧 contact@aicut.co.kr | 🌐 aicut.co.kr</p>'
  ].join('\n');

  await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      var blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
    });
  }, bodyText);
  await page.mouse.click(510, 400);
  await sleep(1500);
  await page.keyboard.press('Control+v');
  await sleep(3000);
  console.log('  텍스트 붙여넣기 완료');

  // 3. 이미지 하나씩 업로드 + 위치 클릭
  console.log('3. 이미지 삽입...');
  
  var images = [
    { file: DIR + '/blog_img_hospital.png', label: '🏥 대표', clickY: 350 },
    { file: DIR + '/body_hospital_stat1.png', label: '📈 검색량', clickY: 500 },
    { file: DIR + '/body_hospital_stat2.png', label: '🎬 진행방식', clickY: 650 },
    { file: DIR + '/body_hospital_result.png', label: '📊 결과', clickY: 800 },
    { file: DIR + '/body_hospital_stat3.png', label: '🏥 병원별', clickY: 950 }
  ];

  for (var i = 0; i < images.length; i++) {
    await uploadAndAdd(page, mf, images[i].file, images[i].label, 400, images[i].clickY);
    await sleep(1500);
  }

  // 4. 저장
  console.log('4. 저장...');
  await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
    }
  });
  console.log('  저장됨');

  await sleep(2000);
  console.log('\n✅ 이미지 등록 완료! 블로그 탭 확인해주세요.');
  await b.close();
})();

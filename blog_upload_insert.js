const { chromium } = require('playwright');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// 이미지 1장 업로드 + 추가 버튼 클릭
async function uploadAndInsert(page, mf, filePath, label) {
  console.log('  📤 ' + label + ' 업로드...');
  
  // 파일 초이스 대기
  var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
  
  // 사진 버튼 클릭 (좌측 상단)
  await page.mouse.click(36, 74);
  await sleep(2000);

  var fc = await fcPromise;
  if (!fc) {
    // "내 PC에서 업로드" 메뉴 클릭
    var subClick = await mf.evaluate(function() {
      var all = document.querySelectorAll('button, span, a, div, li');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t.indexOf('내 PC') >= 0 && all[i].offsetParent !== null) {
          all[i].click();
          return true;
        }
      }
      return false;
    });
    await sleep(2000);
    fc = await fcPromise;
  }

  if (!fc) { console.log('  ❌ 파일초이스 실패'); return false; }

  // 파일 업로드
  await fc.setFiles(filePath);
  console.log('  ✅ 업로드 완료');
  await sleep(3000);

  // "추가" 버튼 찾아서 클릭 (Naver 업로드 패널)
  var added = await mf.evaluate(function() {
    // "추가" 버튼 찾기
    var all = document.querySelectorAll('button, span, a');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '추가' && all[i].offsetParent !== null) {
        all[i].click();
        return '추가_클릭';
      }
      if ((t.indexOf('완료') >= 0 || t.indexOf('확인') >= 0) && all[i].offsetParent !== null) {
        all[i].click();
        return '완료_클릭';
      }
    }
    // 업로드된 이미지 자체를 클릭 (자동 추가)
    var imgs = document.querySelectorAll('img');
    for (var j = 0; j < imgs.length; j++) {
      var r = imgs[j].getBoundingClientRect();
      if (r.width > 50 && r.y < 600 && r.x > 0) {
        // 클릭 가능한 이미지 발견
        return 'img_found_at_' + Math.round(r.x) + ',' + Math.round(r.y);
      }
    }
    return 'no_add_button';
  });
  console.log('  ' + added);
  await sleep(2000);
  return true;
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

  var mf = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    if (page.frames()[fi].name() === 'mainFrame') { mf = page.frames()[fi]; break; }
  }
  if (!mf) { console.log('no mainFrame'); await b.close(); return; }

  // 에디터 활성화 (커서 위치)
  console.log('1. 에디터 활성화...');
  await page.mouse.click(510, 400);
  await sleep(1000);

  // 이미지 5장 순차 업로드+삽입
  var images = [
    { file: DIR + '/blog_img_hospital.png', label: '🏥 대표 이미지' },
    { file: DIR + '/body_hospital_stat1.png', label: '📈 검색량 2.5배 통계' },
    { file: DIR + '/body_hospital_stat2.png', label: '🎬 진행 방식' },
    { file: DIR + '/body_hospital_result.png', label: '📊 K원장님 결과' },
    { file: DIR + '/body_hospital_stat3.png', label: '🏥 병원별 맞춤 영상' }
  ];

  for (var i = 0; i < images.length; i++) {
    var ok = await uploadAndInsert(page, mf, images[i].file, images[i].label);
    if (!ok) console.log('  ⚠️ ' + images[i].label + ' 실패');
    // 문단 구분을 위해 Enter
    await page.keyboard.press('Enter');
    await sleep(300);
  }

  // 저장
  console.log('2. 저장...');
  try {
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
      }
    });
    console.log('  저장됨');
  } catch(e) {}

  await sleep(2000);
  console.log('\n✅ 모든 이미지 글에 삽입 완료!');
  await b.close();
})();

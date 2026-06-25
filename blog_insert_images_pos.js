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

  // 1. 본문 영역 클릭 (에디터 활성화)
  console.log('1. 에디터 활성화...');
  await page.mouse.click(510, 400);
  await sleep(1000);

  // 사진 버튼 위치 (좌측 상단)
  var photoX = 36, photoY = 74;

  // 2. 이미지 1: 대표 이미지 (첫 문단 사이)
  console.log('2. 대표 이미지 업로드...');
  var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
  await page.mouse.click(photoX, photoY);
  await sleep(1500);

  var fc = await fcPromise;
  if (!fc) {
    // "내 PC에서 업로드" 선택
    fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    // 내 PC 버튼 클릭 (200~250 근처)
    var subPos = await mf.evaluate(function() {
      var all = document.querySelectorAll('button, span, a, div, li');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if ((t.indexOf('내 PC') >= 0 || t.indexOf('업로드') >= 0) && all[i].offsetParent !== null) {
          var r = all[i].getBoundingClientRect();
          return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
        }
      }
      return null;
    });
    if (subPos) {
      await page.mouse.click(subPos.x, subPos.y);
      await sleep(2000);
      fc = await fcPromise;
    }
  }

  if (fc) {
    await fc.setFiles(DIR + '/blog_img_hospital.png');
    console.log('  ✅ blog_img_hospital.png 업로드 완료');
  }
  await sleep(2000);

  // 3. 이미지 2: 도입 결과 통계 (본문 중간)
  console.log('3. 결과 이미지 업로드...');
  var fcPromise2 = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
  await page.mouse.click(photoX, photoY);
  await sleep(1500);

  var fc2 = await fcPromise2;
  if (!fc2) {
    fcPromise2 = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    var subPos2 = await mf.evaluate(function() {
      var all = document.querySelectorAll('button, span, a, div, li');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if ((t.indexOf('내 PC') >= 0 || t.indexOf('업로드') >= 0) && all[i].offsetParent !== null) {
          var r = all[i].getBoundingClientRect();
          return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
        }
      }
      return null;
    });
    if (subPos2) {
      await page.mouse.click(subPos2.x, subPos2.y);
      await sleep(2000);
      fc2 = await fcPromise2;
    }
  }

  if (fc2) {
    await fc2.setFiles(DIR + '/body_hospital_result.png');
    console.log('  ✅ body_hospital_result.png 업로드 완료');
  }
  await sleep(2000);

  // 4. 저장
  console.log('4. 저장...');
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
  console.log('\n✅ 이미지 삽입 완료!');
  await b.close();
})();

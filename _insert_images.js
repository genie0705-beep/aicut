// 이미지 본문 삽입 + 저장
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();
  
  var editPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0 && pages[i].url().indexOf('logNo=') >= 0) {
      editPage = pages[i]; break;
    }
  }
  if (!editPage) { await b.close(); return; }

  await editPage.bringToFront();
  await sleep(3000);

  // 6 images URLs
  var imgUrls = [
    '/MjAyNjA2MThfMjc0/MDAxNzgxNzQzMDUzNzIz.3GQSmU_rupD4SnOCvIjpJ4N622LdroMjL9XH5-OGRV0g.0h9VGzZh2zMeLh1cLoF-ZON5vQ41Bk98M2lORRltOkAg.PNG/aicut_blog_edu_03.png',
    '/MjAyNjA2MThfMTU2/MDAxNzgxNzQzMDU2OTcw.P2gnx7hFDfu_kjWyITTpRKUbaCPhni4PS3YTUYvFGVUg.z6_o7ynd7geMD9vMSWVRJYQuq6Ms4hpR0lDrsXAnA-Mg.PNG/aicut_blog_edu_04.png',
    '/MjAyNjA2MThfNjMg/MDAxNzgxNzQzMDYwMjUy.WcBQv4hKRi2zutOg3vIZT4submDUy2CwnABo-hzdUnQg.PK8gVTk4xlZYAdUx1DUFIykVRUV5K55k2TxYFb6xmFQg.PNG/aicut_blog_edu_05.png',
    '/MjAyNjA2MThfMjky/MDAxNzgxNzQzMDgwMzgy.OLaZmK3QJNGlnGCd8ps8tXXKqHQUSc2M6CHoZbclkBwg.u2wWZ3uM940LtykdcUms8Kq1Gg5PcUmGdP7M6jTE7Wcg.PNG/aicut_blog_edu_01.png',
    '/MjAyNjA2MThfMjQ3/MDAxNzgxNzQzMDgyNjkw.FVyfwYvSdJmWjKE5PmmWy27YXi3uFcO-D8LbSQI4xjAg.pCOKp6xk_ezvYRWg6LXP1UOfZIdVby_Aif1TZi6Qy2cg.PNG/aicut_blog_edu_02.png',
    '/MjAyNjA2MThfMjIw/MDAxNzgxNzQzMDg0OTQy.Lc3KYlgGCTT2krrPAXlQVUt64Ms_paj6RRbJB6PrXBYg.9M8nOTxjDjlqkV9zgjBeHQyQqlAY3aEfDY0Lyqc1yIsg.PNG/aicut_blog_edu_06.png'
  ];

  // Focus the text editor area
  console.log('에디터 포커스...');
  await editPage.mouse.click(700, 500);
  await sleep(1500);

  // Insert images using execCommand
  for (var idx = 0; idx < imgUrls.length; idx++) {
    var fullUrl = 'https://blog.naver.com' + imgUrls[idx];
    var imgHtml = '<div class="se-component se-image se-l-default"><div class="se-component-content"><div class="se-section se-section-image se-l-default se-section-align-center"><img src="' + fullUrl + '" class="se-image-resource" alt=""></div></div></div><p><br></p>';
    
    console.log('이미지 ' + (idx + 1) + '/' + imgUrls.length + ' 삽입...');

    var ok = await editPage.evaluate(function(html) {
      try {
        document.execCommand('insertHTML', false, html);
        return 'ok';
      } catch(e) {
        return e.message;
      }
    }, imgHtml);

    if (ok === 'ok') {
      console.log('   ✅');
    } else {
      console.log('   ⚠️ ' + ok);
    }
    await sleep(2000);
  }

  // Check inserted images
  var check = await editPage.evaluate(function() {
    var imgs = document.querySelectorAll('.se-image-resource');
    return { count: imgs.length };
  });
  console.log('\n📸 본문 이미지:', check.count + '개');

  // 제목 재설정
  await editPage.evaluate(function() {
    SmartEditor._editors['blogpc001'].setDocumentTitle('온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유');
  });
  await sleep(1000);

  // 저장
  console.log('\n저장 중...');
  await editPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '저장' && btns[i].offsetParent !== null && btns[i].className.indexOf('save') >= 0) {
        btns[i].click();
        return;
      }
    }
  });
  await sleep(3000);
  
  // 발행
  console.log('발행 중...');
  await editPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '발행' && btns[i].offsetParent !== null) {
        btns[i].click();
        return;
      }
    }
  });
  await sleep(3000);

  // 발행 확인
  var confirmed = await editPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '발행' && btns[i].offsetParent !== null) {
        btns[i].click();
        return true;
      }
    }
    return false;
  });
  if (confirmed) {
    console.log('발행 확인됨');
    await sleep(5000);
  }

  var finalUrl = editPage.url();
  console.log('\n📋 최종 URL:', finalUrl);
  console.log('\n✅ 이미지 포함 블로그 수정 완료!');

  await b.close();
})();

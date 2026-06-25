// 최종: 간단체크 검사
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  var saPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('searchadvisor') >= 0) { saPage = pages[i]; break; }
  }
  if (!saPage) { await b.close(); return; }

  await saPage.bringToFront();

  // 방법1: 간단체크 페이지에서 input fill + Enter
  console.log('방법1: 간단체크');
  await saPage.goto('https://searchadvisor.naver.com/tools/sitecheck', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // input 찾아서 fill (evaluate 내에서 처리)
  var fillResult = await saPage.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].offsetParent !== null) {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inputs[i], 'https://blog.naver.com/aicut/224319537693');
        inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, id: inputs[i].id };
      }
    }
    return { ok: false };
  });
  console.log('  fill:', fillResult.ok ? '✅' : '❌');
  await sleep(500);

  // Enter 키
  await saPage.keyboard.press('Enter');
  await sleep(3000);

  var result = await saPage.evaluate(function() {
    return document.body.innerText.substring(0, 1000);
  });
  console.log('  결과:', result.substring(0, 500));

  // 방법2: 웹페이지 수집 URL 직접 시도
  console.log('\n방법2: 웹페이지 수집 URL 시도');
  var encSite = encodeURIComponent('https://aicut.co.kr');
  var urls = [
    'https://searchadvisor.naver.com/console/site/request-crawl?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/collect?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/crawl?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/request/crawl?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/submit?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/url-submit?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/request/rss?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/request/sitemap?site=' + encSite,
    'https://searchadvisor.naver.com/console/site/request/exclude?site=' + encSite,
  ];

  for (var ui = 0; ui < urls.length; ui++) {
    await saPage.goto(urls[ui], { waitUntil: 'networkidle', timeout: 10000 }).catch(function(){});
    await sleep(1500);
    var urlText = await saPage.evaluate(function() {
      return document.body.innerText.substring(0, 200);
    });
    // 'This page could not be found'나 'Server error'가 아니면 성공
    if (urlText.indexOf('could not be found') < 0 && urlText.indexOf('Server error') < 0 && urlText.indexOf('문제가 발생') < 0) {
      console.log('  ✅ 발견:', urls[ui].substring(0, 90));
      console.log('  내용:', urlText.substring(0, 300));
      break;
    }
    if (ui === urls.length - 1) {
      console.log('  ❌ 모든 URL 실패');
    }
  }

  await b.close();
})();

// 서치어드바이저 대체 경로 시도
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

  // 1. 검증 페이지 시도
  console.log('1. 검증 페이지...');
  var encSite = encodeURIComponent('https://aicut.co.kr');
  await saPage.goto('https://searchadvisor.naver.com/console/site/verification?site=' + encSite, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  console.log('   URL:', saPage.url().substring(0, 120));
  var vText = await saPage.evaluate(function() {
    return document.body.innerText.substring(0, 500);
  });
  console.log('   내용:', vText.substring(0, 300));

  // 2. 간단체크 (좌측 메뉴 클릭)
  console.log('\n2. 간단체크...');
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=' + encSite, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  var simpleBtn = await saPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, div');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '간단체크' && all[i].offsetParent !== null) {
        return true;
      }
    }
    return false;
  });
  console.log('   간단체크 버튼 존재:', simpleBtn);

  // 3. IndexNow API 직접 호출 (네이버 검색에서 지원)
  console.log('\n3. IndexNow API 직접 호출...');
  var indexNowResult = await saPage.evaluate(async function() {
    try {
      var resp = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'aicut.co.kr',
          key: 'aicut-indexnow-key',
          keyLocation: 'https://aicut.co.kr/aicut-indexnow-key.txt',
          urlList: [
            'https://aicut.co.kr/',
            'https://aicut.co.kr/blog'
          ]
        })
      });
      return { status: resp.status, body: await resp.text() };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('   IndexNow 결과:', JSON.stringify(indexNowResult));

  // 4. 네이버 서치어드바이저 공식 API 문서 기반 시도
  console.log('\n4. 네이버 수집 요청 API...');
  var naverResult = await saPage.evaluate(async function() {
    try {
      var resp = await fetch('https://searchadvisor.naver.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          urlList: ['https://aicut.co.kr/']
        })
      });
      return { status: resp.status, body: await resp.text().then(function(t) { return t.substring(0, 300); }) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('   네이버 IndexNow:', JSON.stringify(naverResult));

  // 5. 사이트맵 재전송 (이미 등록됨)
  console.log('\n5. 사이트맵 재전송...');
  var sitemapResult = await saPage.evaluate(async function() {
    try {
      var resp = await fetch('https://searchadvisor.naver.com/console/site/sitemap', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: 'https://aicut.co.kr',
          sitemapUrl: 'https://aicut.co.kr/sitemap.xml'
        })
      });
      return { status: resp.status, body: await resp.text().then(function(t) { return t.substring(0, 300); }) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('   사이트맵:', JSON.stringify(sitemapResult));

  await b.close();
})();

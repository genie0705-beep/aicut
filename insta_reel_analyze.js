const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  var page = null;
  for (var i = 0; i < ctx.pages().length; i++) {
    if (ctx.pages()[i].url().includes('instagram.com') && !ctx.pages()[i].url().includes('accounts')) {
      page = ctx.pages()[i]; break;
    }
  }
  if (!page) { page = await ctx.newPage(); }
  await page.bringToFront();

  console.log('=== 릴스 성과 분석 ===\n');

  // 1. 릴스 페이지 데이터
  console.log('1. 릴스 페이지 데이터...');
  await page.goto('https://www.instagram.com/aicut.official/reel/DZ6a5byNHfd/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(5000);

  var reelData = await page.evaluate(function() {
    var text = document.body.innerText || '';
    var result = {};

    // 조회수 찾기
    var viewMatch = text.match(/([0-9,]+)\s*회\s*(조회|재생)/);
    if (viewMatch) result.views = viewMatch[1] + '회';

    // 좋아요 숫자 찾기 (릴스 하단)
    var likePatterns = [
      text.match(/좋아요\s*([0-9,]+)/),
      text.match(/([0-9,]+)\s*개\s*의\s*좋아요/)
    ];
    for (var i = 0; i < likePatterns.length; i++) {
      if (likePatterns[i]) { result.likes = likePatterns[i][1]; break; }
    }

    // 댓글 수
    var commentMatch = text.match(/댓글\s*([0-9,]+)/);
    if (commentMatch) result.comments = commentMatch[1];

    // 팔로워/게시물/팔로잉
    var profileMatch = text.match(/게시물\s*([0-9]+)\s*팔로워\s*([0-9,]+)\s*팔로우\s*([0-9,]+)/);
    if (profileMatch) {
      result.posts = profileMatch[1];
      result.followers = profileMatch[2];
      result.following = profileMatch[3];
    }

    result.preview = text.substring(0, 1000);
    return result;
  });

  console.log('릴스 데이터:', JSON.stringify(reelData, null, 2));

  // 2. 프로페셔널 대시보드
  console.log('\n2. 프로페셔널 대시보드...');
  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(3000);

  // 프로페셔널 대시보드 열기 시도
  var dashResult = await page.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var t = svgs[i].querySelector('title');
      if (t && t.textContent === '프로페셔널 대시보드') {
        var parent = svgs[i].closest('[role="button"]') || svgs[i].closest('a') || svgs[i].parentElement;
        if (parent) { parent.click(); return 'clicked'; }
        svgs[i].click(); return 'clicked svg';
      }
    }
    return 'not found';
  });
  console.log('   대시보드:', dashResult);
  await sleep(4000);

  var dashData = await page.evaluate(function() {
    var text = document.body.innerText || '';
    var result = {};
    
    // 지난 7일 or 30일 데이터
    var days = ['지난 7일', '지난 30일', '지난 90일'];
    for (var i = 0; i < days.length; i++) {
      var idx = text.indexOf(days[i]);
      if (idx >= 0) result.days7 = text.substring(idx, idx + 200).replace(/\n/g, ' ').trim();
    }

    // 계정 도달, 프로필 방문 등
    var metrics = ['도달', '프로필 방문', '콘텐츠', '조회수', '팔로워'];
    for (var j = 0; j < metrics.length; j++) {
      var idx = text.indexOf(metrics[j]);
      if (idx >= 0) {
        result[metrics[j]] = text.substring(Math.max(0, idx - 20), idx + 50).replace(/\n/g, ' ').trim();
      }
    }

    result.preview = text.substring(0, 2000);
    return result;
  });
  console.log('대시보드 데이터:', JSON.stringify(dashData, null, 2));

  await b.close();
})();

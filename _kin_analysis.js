// 지식iN 업종별 질문 수 분석
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  var keywords = [
    '영상편집',
    '숏폼',
    '영상제작',
    '동영상편집',
    '유튜브편집',
    '영상마케팅',
    '영상외주',
    '편집의뢰',
    '숏폼마케팅',
    '영상편집프로그램',
    '프리미어프로',
    '다빈치리졸브',
    'AI영상',
    '영상촬영',
    '릴스',
    '쇼츠'
  ];

  console.log('=== 지식iN 키워드별 전체 질문 수 ===\n');
  console.log('키워드\t\t\t결과 수');
  console.log('----------------------------------------');

  var totalResults = [];

  for (var i = 0; i < keywords.length; i++) {
    var kw = keywords[i];
    await page.goto('https://kin.naver.com/search/list.naver?query=' + encodeURIComponent(kw), { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await sleep(1500);

    var count = await page.evaluate(function() {
      var body = document.body.innerText;
      // '1-10/692,975' 패턴 찾기
      var match = body.match(/\d+[-]\d+\/([\d,]+)/);
      if (match) return match[1];
      // '총 XX건' 패턴
      var match2 = body.match(/총\s*([\d,]+)건/);
      if (match2) return match2[1];
      return '0';
    });

    // 콤마 제거
    var numStr = count.replace(/,/g, '');
    var num = parseInt(numStr) || 0;
    totalResults.push({ keyword: kw, count: num });

    var paddedKw = (kw + '               ').substring(0, 16);
    console.log(paddedKw + '\t' + num.toLocaleString());

    // 너무 빠르면 차단될 수 있으니 딜레이
    await sleep(500);
  }

  // 정렬
  totalResults.sort(function(a, b) { return b.count - a.count; });

  console.log('\n\n=== 결과 요약 (많은 순) ===\n');
  for (var i = 0; i < totalResults.length; i++) {
    console.log('  ' + (i+1) + '. ' + totalResults[i].keyword + ': ' + totalResults[i].count.toLocaleString() + '개');
  }

  // 합계
  var sum = totalResults.reduce(function(acc, item) { return acc + item.count; }, 0);
  console.log('\n  총합: ' + sum.toLocaleString() + '개');

  // 미답변 질문 수 확인 (질문 목록 페이지에서)
  console.log('\n\n=== 답변 가능한 질문 수 (관심분야 기반) ===\n');
  await page.goto('https://kin.naver.com/qna/questionList.naver', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  var qCount = await page.evaluate(function() {
    var links = document.querySelectorAll('a');
    var count = 0;
    for (var i = 0; i < links.length; i++) {
      var h = links[i].href || '';
      if (h.indexOf('detail') >= 0) count++;
    }
    return count;
  });
  console.log('  답변 가능한 질문: ' + qCount + '개 (현재 관심분야 기준)');

  // 업종별 존재 비율 분석
  console.log('\n\n=== 업종별 존재 비율 분석 ===\n');
  var totalKeywordSum = totalResults.reduce(function(acc, item) { return acc + item.count; }, 0);
  for (var i = 0; i < totalResults.length; i++) {
    var pct = (totalResults[i].count / totalKeywordSum * 100).toFixed(1);
    console.log('  ' + totalResults[i].keyword + ': ' + pct + '%');
  }

  await b.close();
})();

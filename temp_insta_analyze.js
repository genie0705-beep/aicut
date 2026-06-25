const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://www.instagram.com/p/DZ6GVaxmT_u/', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // 게시물 페이지 전체 DOM 분석
  const analysis = await page.evaluate(function() {
    var result = {};
    
    // 모든 SVG와 그 aria-label/title
    var svgs = Array.from(document.querySelectorAll('svg'));
    result.svgLabels = svgs.slice(0, 15).map(function(s) {
      return {
        ariaLabel: s.getAttribute('aria-label') || '',
        title: s.querySelector('title')?.textContent || '',
        width: s.getAttribute('width') || '',
        height: s.getAttribute('height') || '',
        viewBox: s.getAttribute('viewBox') || ''
      };
    });
    
    // 모든 보이는 버튼들
    var btns = Array.from(document.querySelectorAll('button, [role="button"], a[role="button"]'));
    result.buttons = btns.filter(function(b) { return b.offsetParent !== null; }).slice(0, 15).map(function(b) {
      return {
        text: (b.innerText || '').trim().substring(0, 40),
        ariaLabel: b.getAttribute('aria-label') || '',
        tag: b.tagName
      };
    });
    
    // 모든 role 속성
    var roles = Array.from(document.querySelectorAll('[role]'));
    result.roles = roles.slice(0, 20).map(function(r) {
      return {
        role: r.getAttribute('role'),
        text: (r.innerText || '').trim().substring(0, 40)
      };
    }).filter(function(r) { return r.text; });
    
    // 게시물 본문 영역
    var article = document.querySelector('article');
    result.articleHTML = article ? article.innerHTML.substring(0, 3000) : 'article 없음';
    
    return result;
  });
  
  console.log('=== 게시물 페이지 분석 ===');
  console.log('SVG들:', JSON.stringify(analysis.svgLabels, null, 2));
  console.log('\n버튼들:', JSON.stringify(analysis.buttons, null, 2));
  console.log('\nRoles:', JSON.stringify(analysis.roles, null, 2));
  console.log('\nArticle HTML (앞 500자):', (analysis.articleHTML || '').substring(0, 500));
  
  await b.close();
})();

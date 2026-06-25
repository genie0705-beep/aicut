const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const url = 'https://kin.naver.com/qna/detail.naver?d1id=1&dirId=1061203&docId=491943585';
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await p.waitForTimeout(5000);
  
  // 페이지 스크롤
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(2000);
  
  // main frame에서 직접 내용 추출 - 더 다양한 셀렉터
  const content = await p.evaluate(() => {
    const selectors = [
      '.question-content', '.question_area', '.c-head', '.c-content',
      '.detail-content', '#content', '.content', 'article',
      '.se-main-container', '.post-content', '[class*=question]',
      '[class*=detail]', '[class*=qna]'
    ];
    
    const results = {};
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        results[sel] = el.innerText.trim().substring(0, 200);
      }
    }
    
    // 모든 div의 class name 추출
    const allDivs = document.querySelectorAll('div');
    const divClasses = new Set();
    allDivs.forEach(div => {
      if (div.className && typeof div.className === 'string') {
        const parts = div.className.split(' ');
        parts.forEach(p => { if (p.length > 3) divClasses.add(p); });
      }
    });
    
    return { results, divClasses: Array.from(divClasses).sort().slice(0, 30) };
  });
  
  console.log('=== 셀렉터 결과 ===');
  for (const [k, v] of Object.entries(content.results)) {
    console.log(k + ': ' + v.substring(0, 100));
  }
  
  console.log('\n=== 주요 div 클래스 ===');
  console.log(content.divClasses.join('\n'));
  
  // HTML에서 주요 영역 찾기
  const htmlSnippet = await p.evaluate(() => {
    // body의 class 확인
    const bodyClass = document.body.className;
    const bodyId = document.body.id;
    
    // 두 번째로 큰 텍스트를 가진 div 찾기
    const divs = document.querySelectorAll('div');
    let bestDiv = null, bestLen = 0;
    divs.forEach(div => {
      const t = div.innerText.trim();
      if (t.length > bestLen && t.length < 10000) {
        // skip obvious nav
        if (!t.includes('메인 메뉴') || t.length > 500) {
          bestLen = t.length;
          bestDiv = div.className.substring(0, 50);
        }
      }
    });
    
    return { bodyClass, bodyId, bestDiv, bestLen };
  });
  
  console.log('\n=== body 정보 ===');
  console.log(JSON.stringify(htmlSnippet, null, 2));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

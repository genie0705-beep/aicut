const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const url = 'https://kin.naver.com/qna/detail.naver?d1id=1&dirId=1061203&docId=491943585';
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(4000);
  
  // Check iframes
  const frames = p.frames();
  console.log('프레임 수:', frames.length);
  
  // Main frame body innerText 길이 측정
  const mainLen = await p.evaluate(() => document.body.innerText.length);
  console.log('메인 body 길이:', mainLen);
  
  // iframe 체크
  for (let i = 0; i < frames.length; i++) {
    try {
      const title = await frames[i].title();
      const url2 = frames[i].url();
      const text = await frames[i].evaluate(() => document.body?.innerText?.substring(0, 200) || 'no body');
      console.log('프레임 ' + i + ': [' + title.substring(0, 40) + '] ' + url2.substring(0, 60));
      console.log('  내용: ' + text.substring(0, 150));
    } catch(e) {}
  }
  
  // 페이지 구조 분석
  const structure = await p.evaluate(() => {
    const result = [];
    // 주요 컨테이너 찾기
    const main = document.querySelector('main, #main, .main, .content-area, [class*=content]');
    if (main) result.push('main container: ' + main.tagName + ' class=' + main.className.substring(0, 40));
    
    // 질문 제목 찾기
    const hTags = document.querySelectorAll('h2, h3, h4');
    hTags.forEach(h => {
      if (h.innerText.trim().length > 5) result.push('h-tag: ' + h.innerText.trim().substring(0, 60));
    });
    
    return result;
  });
  
  console.log('\n=== 페이지 구조 ===');
  structure.forEach(s => console.log(s));
  
  // 본문 영역 직접 확인
  const bodyText = await p.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const t = div.innerText.trim();
      if (t.length > 50 && !t.startsWith('메인 메뉴')) return t.substring(0, 500);
    }
    return 'no large div found';
  });
  console.log('\n=== 첫 번째 큰 div 내용 ===');
  console.log(bodyText);
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

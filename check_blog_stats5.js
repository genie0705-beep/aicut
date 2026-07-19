const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();

  page.on('dialog', async dialog => dialog.dismiss());

  console.log('========== 블로그 통계 상세 ==========\n');

  await page.goto('https://admin.blog.naver.com/aicut/stat/today', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await page.waitForTimeout(8000);  // 충분한 로딩 대기

  // 통계 숫자 데이터가 있는지 확인
  const data = await page.evaluate(() => {
    // 모든 숫자+텍스트 조합 찾기
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // 숫자가 포함된 라인 = 실제 통계 데이터
    const withNumbers = lines.filter(l => /\d+/.test(l));
    
    // 특정 통계 키워드 + 숫자 조합
    const stats = lines.filter(l => 
      (l.includes('조회') || l.includes('방문') || l.includes('재생') || 
       l.includes('공감') || l.includes('댓글') || l.includes('이웃') ||
       l.includes('사용') || l.includes('순위') || l.includes('시간') ||
       l.includes('비율')) && /\d/.test(l)
    );
    
    return { totalLines: lines.length, linesWithNumbers: withNumbers.slice(0, 30), statsLines: stats.slice(0, 20) };
  });

  console.log(`전체 라인: ${data.totalLines}`);
  console.log(`\n[숫자 포함 라인 — 통계 데이터]`);
  data.linesWithNumbers.forEach(l => console.log(`  ${l}`));
  
  console.log(`\n[주요 통계 키워드 라인]`);
  data.statsLines.forEach(l => console.log(`  ${l}`));
  
  // 더 구체적으로 데이터가 숨겨져 있는지 확인
  console.log(`\n[페이지 HTML 구조 확인]`);
  const structure = await page.evaluate(() => {
    // 통계 수치가 들어있을 만한 클래스명 탐색
    const els = document.querySelectorAll('[class*="stat"], [class*="number"], [class*="count"], [class*="visit"], [class*="today"], [class*="data"]');
    const classes = Array.from(els).slice(0, 20).map(el => ({
      class: el.className,
      text: el.innerText.substring(0, 50),
      tag: el.tagName
    }));
    return classes;
  });
  
  structure.forEach(s => console.log(`  [${s.tag}] .${s.class}: ${s.text}`));

  // 데이터 로딩을 더 기다리기
  console.log('\n[추가 대기 후 재시도]');
  await page.waitForTimeout(5000);
  
  const data2 = await page.evaluate(() => {
    return document.body.innerText;
  });
  
  // 숫자 패턴이 있는 라인 찾기
  const numberLines = data2.split('\n').filter(l => /^[\d,]+$/.test(l.trim()) || /^[\d,.%]+$/.test(l.trim()));
  console.log('순수 숫자 라인:', numberLines.slice(0, 20));

  // 혹시 iframe 안에 있을까?
  const frames = page.frames();
  console.log(`\n프레임 수: ${frames.length}`);
  for (const f of frames) {
    if (f !== page.mainFrame()) {
      const fText = await f.evaluate(() => document.body?.innerText?.substring(0, 200) || '');
      console.log(`  iframe: ${fText.substring(0, 100)}`);
    }
  }

  console.log('\n========== 분석 종료 ==========');
})();

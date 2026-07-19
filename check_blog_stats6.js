const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();

  page.on('dialog', async dialog => dialog.dismiss());

  console.log('========== 블로그 통계 상세 데이터 ==========\n');

  await page.goto('https://admin.blog.naver.com/aicut/stat/today', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await page.waitForTimeout(8000);

  // 모든 iframe의 내용 수집
  const frames = page.frames();
  console.log(`총 프레임: ${frames.length}\n`);

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const text = await f.evaluate(() => document.body?.innerText || '');
      if (text && text.trim().length > 0) {
        console.log(`--- iframe #${i} ---`);
        console.log(text.substring(0, 1000));
        console.log('');
      }
    } catch(e) {
      // cross-origin iframe may throw
    }
  }

  // 특정 통계 메뉴 클릭해서 데이터 더 보기
  // '조회수' 메뉴 클릭
  console.log('=== 조회수 상세 ===');
  try {
    await page.click('text=조회수');
    await page.waitForTimeout(3000);
    
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      try {
        const text = await f.evaluate(() => document.body?.innerText || '');
        if (text && text.trim().length > 0 && text.includes('조회')) {
          console.log(`iframe #${i}:`);
          console.log(text.substring(0, 800));
        }
      } catch(e) {}
    }
  } catch(e) {
    console.log(`조회수 클릭 오류: ${e.message}`);
  }

  // '방문 횟수' 클릭
  console.log('\n=== 방문 횟수 상세 ===');
  try {
    await page.click('text=방문 횟수');
    await page.waitForTimeout(3000);
    
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      try {
        const text = await f.evaluate(() => document.body?.innerText || '');
        if (text && text.trim().length > 0 && text.length > 50) {
          console.log(`iframe #${i}:`);
          console.log(text.substring(0, 800));
        }
      } catch(e) {}
    }
  } catch(e) {
    console.log(`방문 횟수 클릭 오류: ${e.message}`);
  }

  // 블로그 메인으로 이동해서 제헌절 포스트 확인
  console.log('\n=== 제헌절 포스트 직접 확인 ===');
  try {
    await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224348766674', {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await page.waitForTimeout(4000);
    
    const postData = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      // 조회수, 공감수, 댓글 찾기
      const stats = lines.filter(l => 
        l.includes('조회') || l.includes('공감') || l.includes('댓글') || 
        l.includes('좋아요') || l.includes('스크랩')
      );
      // 제목 찾기
      const title = lines.find(l => l.includes('제헌절') || l.includes('공휴일') || l.includes('행사'));
      return { title, stats: stats.slice(0, 10), textPreview: text.substring(0, 300) };
    });
    
    console.log(`제목: ${postData.title || '(미확인)'}`);
    console.log(`통계: ${postData.stats.join(' | ') || '(미확인)'}`);
    
  } catch(e) {
    console.log(`오류: ${e.message}`);
  }

  console.log('\n========== 분석 완료 ==========');
})();

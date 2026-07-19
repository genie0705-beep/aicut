const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  const page = await context.newPage();

  console.log('=== 네이버 블로그 통계 분석 ===');
  console.log('');

  // 1. 블로그 메인 페이지로 이동하여 방문자 정보 확인
  try {
    await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // 블로그 메인에서 방문자 통계 확인
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    // 방문자 관련 텍스트 찾기
    const visitorMatch = bodyText.match(/오늘\s*[0-9,]+|어제\s*[0-9,]+|누적\s*[0-9,]+|방문자\s*[0-9,]+/gi);
    if (visitorMatch) {
      console.log('[블로그 메인 방문자 정보]');
      visitorMatch.forEach(m => console.log(`  ${m.trim()}`));
    }
    
    console.log('');
    console.log('[현재 블로그 상단 표시]');
    // 상단 영역 텍스트 추출
    const topText = await page.evaluate(() => {
      const els = document.querySelectorAll('.blogMenu, .blog-menu, .blog-header, header, .top-area');
      return Array.from(els).map(e => e.innerText.trim()).filter(t => t.length > 0).slice(0, 5);
    });
    topText.forEach(t => console.log(`  ${t}`));

  } catch(e) {
    console.log(`블로그 메인 접속 오류: ${e.message}`);
  }

  // 2. 통계 페이지 직접 접속 시도
  console.log('');
  console.log('=== 블로그 통계 페이지 ===');
  try {
    await page.goto('https://blog.naver.com/BlogStatistics.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    
    // 로그인 페이지로 리다이렉트 되었는지 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    if (currentUrl.includes('nid.naver.com') || currentUrl.includes('login')) {
      console.log('⚠️ 로그인 필요 — 블로그 관리 페이지로 먼저 이동합니다');
      
      // 블로그 관리 페이지로 이동
      await page.goto('https://blog.naver.com/MyBlog.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
      console.log(`관리 페이지 URL: ${page.url()}`);
      
      if (page.url().includes('nid.naver.com') || page.url().includes('login')) {
        console.log('❌ 로그인 필요 — 수동 로그인이 필요합니다');
      } else {
        console.log('✅ 블로그 관리 페이지 접속 성공');
      }
    }
    
    if (!page.url().includes('nid.naver.com')) {
      // 통계 페이지 내용 추출
      const statsText = await page.evaluate(() => {
        const main = document.querySelector('.se-main-container, .blog-main, main, .content, .area_statistics');
        if (main) return main.innerText;
        return document.body.innerText.substring(0, 3000);
      });
      console.log('통계 내용:');
      console.log(statsText.substring(0, 2000));
    }
    
  } catch(e) {
    console.log(`통계 페이지 접속 오류: ${e.message}`);
  }

  // 3. 최근 게시물 목록 확인 (조회수 등)
  console.log('');
  console.log('=== 최근 게시물 현황 ===');
  try {
    await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=&parentCategoryNo=', 
      { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('nid.naver.com')) {
      // 게시물 목록에서 제목과 날짜 정보 추출
      const posts = await page.evaluate(() => {
        const items = document.querySelectorAll('.post-list, .blog-list, .post-item, [class*="post"], .cont');
        return Array.from(items).slice(0, 10).map(el => el.innerText.trim()).filter(t => t.length > 0);
      });
      
      if (posts.length > 0) {
        posts.forEach(p => console.log(`  ${p.substring(0, 200)}`));
      } else {
        console.log('(게시물 목록 셀렉터 불일치 — 페이지 텍스트 출력)');
        const pageText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
        console.log(pageText);
      }
    }
  } catch(e) {
    console.log(`게시물 목록 오류: ${e.message}`);
  }

  // 4. 블로그 랭킹/인기글 정보
  console.log('');
  console.log('=== 인기글/이웃 정보 ===');
  try {
    const popText = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n');
      // 인기글, 이웃, 공감 관련 라인 추출
      return lines.filter(l => 
        l.includes('인기') || l.includes('조회') || l.includes('공감') || 
        l.includes('이웃') || l.includes('댓글') || l.includes('방문')
      ).slice(0, 15);
    });
    popText.forEach(t => console.log(`  ${t.trim()}`));
  } catch(e) {}

  await browser.disconnect();
  console.log('');
  console.log('=== 분석 완료 ===');
})();

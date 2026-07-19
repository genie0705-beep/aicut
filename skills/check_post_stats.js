const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 네이버 블로그 통계 페이지로 이동
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostViewCount.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const data = await page.evaluate(() => {
    const body = document.body.textContent || '';
    // 방문자 수 찾기
    const todayMatch = body.match(/오늘\s*([\d,]+)/);
    const totalMatch = body.match(/전체\s*([\d,]+)/);
    
    // 게시글별 통계로 이동
    // 블로그 메인에서 각 포스트 조회수 확인
    return {
      today: todayMatch ? todayMatch[1] : '확인불가',
      total: totalMatch ? totalMatch[1] : '확인불가',
      bodyStart: body.substring(0, 500).replace(/\s+/g, ' ').trim()
    };
  });
  console.log('블로그 통계:');
  console.log('  오늘 방문자:', data.today);
  console.log('  전체 방문자:', data.total);
  console.log('  미리보기:', data.bodyStart);

  // 게시글별 통계를 위해 블로그 메인으로 이동
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=&parentCategoryNo=&setCategories=', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const postsData = await page.evaluate(() => {
    // 게시글 제목 + 날짜 + 조회수 찾기
    const body = document.body.textContent || '';
    // 조회수 패턴 찾기
    const views = [];
    // 게시글 관련 텍스트 블록 검색
    const lines = body.split('\n').filter(l => l.trim().length > 0);
    return { lines: lines.slice(0, 30), bodyStart: body.substring(0, 1000).replace(/\s+/g, ' ').trim() };
  });
  
  console.log('\n게시글 데이터:');
  postsData.lines.slice(0, 15).forEach((l, i) => console.log('  [' + i + '] ' + l.substring(0, 100)));

  await page.close();
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

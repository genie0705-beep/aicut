const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // 1. 블로그 메인 페이지에서 방문자 수 확인
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  // 방문자 카운터 찾기
  const v1 = await page.evaluate(() => {
    const body = document.body.textContent || '';
    // 오늘/전체 방문자 패턴
    const t = body.match(/오늘\s*[:;]?\s*([\d,]+)/i);
    const y = body.match(/어제\s*[:;]?\s*([\d,]+)/i);
    const tt = body.match(/전체\s*[:;]?\s*([\d,]+)/i);
    return {
      오늘: t ? t[0] : '못찾음',
      어제: y ? y[0] : '못찾음',
      전체: tt ? tt[0] : '못찾음'
    };
  });
  console.log('블로그 메인 방문자:', JSON.stringify(v1));

  // 2. 각 게시글 방문자/조회수 확인
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&from=postList', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const posts = await page.evaluate(() => {
    const body = document.body.textContent || '';
    const lines = body.split('\n').filter(l => l.trim().length > 0).map(l => l.trim());
    
    // 게시글 제목 찾기 (FP, 피부, 영상 관련)
    const results = [];
    
    // "전" (시간 전, 분 전) 으로 끝나는 날짜 패턴 찾기
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('전') && (line.includes('분') || line.includes('시간') || line.includes('일'))) {
        // 앞줄이 제목일 가능성
        const title = i > 0 ? lines[i-1] : '';
        if (title.length > 5 && title.length < 80 && 
            (title.includes('FP') || title.includes('보험') || title.includes('영상') || 
             title.includes('피부') || title.includes('마케팅'))) {
          results.push({ title: title.substring(0, 60), date: line.substring(0, 30) });
        }
      }
    }
    
    // "조회" 패턴 찾기
    const views = lines.filter(l => l.includes('조회') && /\d/.test(l)).slice(0, 5);
    
    return { posts: results.slice(0, 10), views };
  });

  console.log('\n게시글 목록:');
  posts.posts.forEach((p, i) => console.log('  [' + (i+1) + '] ' + p.title + ' (' + p.date + ')'));

  console.log('\n조회수 데이터:');
  posts.views.forEach(v => console.log('  ' + v));

  // 3. 블로그 관리자 통계 시도
  await page.goto('https://blog.naver.com/PostViewCount.naver?blogId=aicut&logNo=&categoryNo=&parentCategoryNo=&setCategories=', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  const v3 = await page.evaluate(() => {
    const body = document.body.textContent || '';
    const lines = body.split('\n').filter(l => l.trim().length > 0).map(l => l.trim());
    const stats = lines.filter(l => 
      /\d/.test(l) && l.length < 30 && 
      (l.includes('2026') || l.includes('조회') || l.includes('방문') || l.includes('선호'))
    );
    return stats.slice(0, 20);
  });
  
  console.log('\n통계 페이지 데이터:', v3.length > 0 ? v3.join(' | ') : '데이터 없음');

  await page.close();
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

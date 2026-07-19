const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 블로그 통계 페이지로 이동
  const page = await ctx.newPage();
  
  // 네이버 블로그 방문자 통계 URL
  await page.goto('https://blog.naver.com/PostVisitor.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  const stats = await page.evaluate(() => {
    const body = document.body.textContent || '';
    
    // 일일 방문자 데이터 추출
    const lines = body.split('\n').filter(l => l.trim().length > 0);
    
    // 오늘/전체 방문자
    const today = body.match(/오늘\s*([\d,]+)/);
    const total = body.match(/전체\s*([\d,]+)/);
    const yesterday = body.match(/어제\s*([\d,]+)/);
    
    // 날짜별 데이터 패턴 (2026.06.xx 형태)
    const dailyData = [];
    const datePattern = /2026\.0?6\.\d{1,2}/g;
    let match;
    while ((match = datePattern.exec(body)) !== null) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(body.length, match.index + 80);
      const snippet = body.substring(start, end).replace(/\s+/g, ' ').trim();
      dailyData.push(snippet);
    }
    
    return {
      today: today ? today[0] : '없음',
      yesterday: yesterday ? yesterday[0] : '없음',
      total: total ? total[0] : '없음',
      dailyData: dailyData.slice(0, 20),
      rawSnippets: lines.filter(l => /\d/.test(l) && l.length < 60).slice(0, 30)
    };
  });

  console.log('=== 블로그 방문자 통계 ===');
  console.log('  오늘:', stats.today);
  console.log('  어제:', stats.yesterday);
  console.log('  전체:', stats.total);
  
  console.log('\n=== 날짜별 데이터 ===');
  stats.dailyData.forEach((d, i) => console.log('  [' + (i+1) + '] ' + d));
  
  console.log('\n=== 원시 데이터 샘플 ===');
  stats.rawSnippets.forEach((s, i) => console.log('  [' + i + '] ' + s.substring(0, 80)));

  await page.close();
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

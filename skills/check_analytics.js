const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();

  // 1. GA4 데이터 확인
  const ga4 = pages.find(p => p.url().includes('analytics.google.com'));
  if (ga4) {
    await ga4.bringToFront();
    await ga4.waitForTimeout(3000);
    const gaData = await ga4.evaluate(() => {
      const body = document.body.textContent || '';
      // 주요 메트릭 추출
      const metrics = ['사용자', '세션', '페이지뷰', '세션당', '전환'];
      const found = [];
      metrics.forEach(m => {
        const idx = body.indexOf(m);
        if (idx > -1) {
          const snippet = body.substring(Math.max(0, idx - 20), idx + 40).replace(/\s+/g, ' ').trim();
          found.push(snippet);
        }
      });
      return found.slice(0, 10);
    });
    console.log('=== GA4 데이터 ===');
    gaData.forEach(d => console.log('  ' + d));
  } else {
    console.log('GA4 탭 없음');
  }

  // 2. 네이버 광고 데이터 확인
  const ads = pages.find(p => p.url().includes('ads.naver.com'));
  if (ads) {
    await ads.bringToFront();
    await ads.waitForTimeout(2000);
    const adData = await ads.evaluate(() => {
      const body = document.body.textContent || '';
      const metrics = ['노출', '클릭', 'CTR', '평균 CPC', '비용', '전환'];
      const found = [];
      metrics.forEach(m => {
        const idx = body.indexOf(m);
        if (idx > -1) {
          const snippet = body.substring(Math.max(0, idx - 30), idx + 50).replace(/\s+/g, ' ').trim();
          found.push(snippet);
        }
      });
      return found.slice(0, 15);
    });
    console.log('\n=== 네이버 광고 데이터 ===');
    adData.forEach(d => console.log('  ' + d));
  } else {
    console.log('네이버 광고 탭 없음');
  }

  // 3. 블로그 통계
  const blog = pages.find(p => p.url().includes('blog.naver.com') && !p.url().includes('Redirect'));
  if (blog) {
    await blog.bringToFront();
    await blog.waitForTimeout(2000);
    // 블로그 통계 URL로 이동
    await blog.goto('https://blog.naver.com/PostViewCount.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await blog.waitForTimeout(3000);
    const blogTitle = await blog.title();
    console.log('\n=== 블로그 통계 ===');
    console.log('  제목:', blogTitle);
    // 방문자 수 확인
    const body = await blog.evaluate(() => document.body.textContent || '');
    const todayIdx = body.indexOf('오늘');
    if (todayIdx > -1) {
      console.log('  ' + body.substring(Math.max(0, todayIdx - 10), todayIdx + 50).replace(/\s+/g, ' ').trim());
    }
  }

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

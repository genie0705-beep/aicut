const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  // 1. 네이버 블로그 통계 페이지 열기
  const statsPage = await ctx.newPage();
  await statsPage.goto('https://section.blog.naver.com/BlogHome.naver?directoryNo=0&currentPage=1&groupId=0', { waitUntil: 'networkidle', timeout: 30000 });
  await statsPage.waitForTimeout(3000);
  
  // 블로그 관리 메뉴에서 통계 페이지로 이동
  // 우선 현재 블로그 메인에서 통계 확인
  await statsPage.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await statsPage.waitForTimeout(3000);
  console.log('✅ 블로그 포스트 목록 로딩');

  // 게시글 목록 확인
  const postList = await statsPage.evaluate(() => {
    const posts = document.querySelectorAll('.post, [class*="post"], .cont, .title, a[href*="logNo="]');
    const results = [];
    posts.forEach(p => {
      const href = p.href || '';
      const title = (p.textContent || '').trim();
      if (href.includes('logNo=') && title.length > 5) {
        results.push({ title: title.substring(0, 60), href: href.substring(0, 100) });
      }
    });
    return results.slice(0, 10);
  });
  console.log('최근 게시글:', postList.length + '개');
  postList.forEach((p, i) => console.log('  [' + (i+1) + '] ' + p.title));

  await statsPage.close();

  // 2. 네이버 광고 데이터 확인
  let adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adsPage) {
    adsPage = await ctx.newPage();
    await adsPage.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await adsPage.waitForTimeout(3000);
  }
  
  const adsData = await adsPage.evaluate(() => {
    // 광고 대시보드 데이터 추출
    const stats = document.querySelectorAll('[class*="stat"], [class*="number"], [class*="cost"], [class*="click"]');
    const texts = Array.from(stats).map(s => (s.textContent || '').trim()).filter(t => t.length > 0 && t.length < 30);
    return texts.slice(0, 30);
  });
  console.log('\n📊 네이버 광고 데이터:', adsData.join(' | '));

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

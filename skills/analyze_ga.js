const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  // GA4 탭에서 데이터 확인
  const ga4 = pages.find(p => p.url().includes('analytics.google.com'));
  if (!ga4) {
    console.log('GA4 탭 없음');
    await b.close();
    return;
  }
  
  await ga4.bringToFront();
  await ga4.waitForTimeout(3000);

  // GA4에서 페이지별 트래픽 데이터 확인
  const data = await ga4.evaluate(() => {
    const body = document.body.textContent || '';
    
    // 페이지 경로 찾기
    const lines = body.split('\n').filter(l => l.trim().length > 0);
    
    // /aicut/ 로 시작하는 경로들 찾기 (블로그 포스트)
    const blogPosts = lines.filter(l => l.includes('/aicut/') && l.length < 100);
    
    // 트래픽 소스 데이터
    const organicIdx = body.indexOf('organic');
    const directIdx = body.indexOf('direct');
    const referralIdx = body.indexOf('referral');
    
    return {
      blogUrls: blogPosts.slice(0, 15),
      bodyLength: body.length,
      organicSection: organicIdx > -1 ? body.substring(Math.max(0, organicIdx - 50), organicIdx + 80).replace(/\s+/g, ' ').trim() : '없음',
      // 페이지 제목들
      titles: lines.filter(l => {
        const t = l.trim();
        return (t.includes('영상') || t.includes('보험') || t.includes('마케팅') || t.includes('피부')) && t.length < 60;
      }).slice(0, 10)
    };
  });

  console.log('=== GA4 데이터 분석 ===');
  console.log('본문 길이:', data.bodyLength + '자');
  
  if (data.blogUrls.length > 0) {
    console.log('\n블로그 포스트 URL:');
    data.blogUrls.forEach(u => console.log('  ' + u));
  }
  
  if (data.organicSection !== '없음') {
    console.log('\n트래픽 소스 정보:', data.organicSection);
  }
  
  if (data.titles.length > 0) {
    console.log('\n페이지 제목:');
    data.titles.forEach(t => console.log('  ' + t));
  }

  // 블로그 카테고리별 포스트 확인
  const page2 = await ctx.newPage();
  await page2.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=&parentCategoryNo=&setCategories=', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page2.waitForTimeout(3000);
  
  const categoryData = await page2.evaluate(() => {
    const body = document.body.textContent || '';
    // 카테고리별 게시글 제목 + 날짜 추출
    const lines = body.split('\n').filter(l => l.trim().length > 0);
    const posts = [];
    let currentCat = '';
    
    lines.forEach(l => {
      const t = l.trim();
      // 카테고리명 찾기
      if (t.includes('영상') && t.length < 20 && (t.includes('마케팅') || t.includes('고객'))) {
        if (!posts.some(p => p.cat === t)) {
          currentCat = t;
        }
      }
      // 게시글 제목 + 날짜 추출
      if (t.length > 10 && t.length < 80 && !t.includes('AICUT') && !t.includes('네이버') && !t.includes('로그인')) {
        const hasDate = t.match(/(\d+분\s*전|\d+시간\s*전|\d+일\s*전)/);
        if (hasDate || (t.includes('FP') || t.includes('영상') || t.includes('피부') || t.includes('보험'))) {
          posts.push({ cat: currentCat, title: t });
        }
      }
    });
    
    return posts.slice(0, 15);
  });

  console.log('\n=== 블로그 게시글 목록 ===');
  if (categoryData.length > 0) {
    categoryData.forEach((p, i) => {
      console.log('  [' + (i+1) + '] ' + (p.cat ? '[' + p.cat + '] ' : '') + p.title);
    });
  } else {
    console.log('게시글 정보를 추출할 수 없습니다.');
    
    // 대체 방법: 전체 body에서 텍스트 스캔
    const raw = await page2.evaluate(() => {
      return Array.from(document.querySelectorAll('.title, .cont, .text, [class*="title"]'))
        .map(el => (el.textContent || '').trim())
        .filter(t => t.length > 10 && t.length < 80)
        .slice(0, 10);
    });
    console.log('대체 추출:', raw.join(' | '));
  }

  await page2.close();
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

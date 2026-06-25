const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('aicut_marketing'));
  if (!page) { console.log('Dashboard not found'); return; }
  
  await page.waitForTimeout(2000);
  
  // Update blog posts via blogStore
  const blogPosts = [
    { title: '하반기 마케팅, 지금 영상 편집 외주사를 정해야 하는 이유 (바이럴 ver.)', status: '이미지 완료', date: '6/23' },
    { title: '출근길 30분, 바쁜 대표가 영상 마케팅으로 하루를 시작하는 법', status: '이미지 완료', date: '6/23' },
    { title: '쇼핑몰·스마트스토어 운영자라면 숏폼 마케팅에 주목해야 하는 이유', status: '발행 대기', date: '6/15' },
    { title: '부동산 중개사·공인중개사라면 영상 마케팅을 시작해야 하는 이유 (feat. 화신기계)', status: '발행 완료', date: '6/15' },
    { title: '전문직 종사자를 위한 영상 마케팅 전략 (feat. AI 에디터)', status: '초안 완료', date: '6/11' },
    { title: '스타트업·초기 창업자를 위한 숏폼 마케팅 A to Z', status: '초안 완료', date: '6/11' },
    { title: '병원 마케팅, 이제는 숏폼이다 — 치과·성형·피부과 영상 전략', status: '초안 완료', date: '6/12' },
    { title: '이커머스·스마트스토어, 상품 영상으로 전환율 높이는 법', status: '초안 완료', date: '6/14' },
    { title: '교육·이러닝 업계를 위한 영상 콘텐츠 마케팅 가이드', status: '초안 완료', date: '6/14' },
    { title: '프랜차이즈 본사라면 가맹점 영상 마케팅을 지원해야 하는 이유', status: '초안 완료', date: '6/14' },
    { title: '릴스·쇼츠·숏폼, 어떤 플랫폼에 집중해야 할까? (TikTok vs Reels vs Shorts)', status: '초안 완료', date: '6/19' }
  ];
  
  const result = await page.evaluate((posts) => {
    if (typeof blogStore !== 'undefined') {
      blogStore.save(posts);
      renderBlogPosts();
      return { method: 'blogStore', count: posts.length };
    }
    // Fallback: write directly to localStorage
    localStorage.setItem('aicut_blog_posts', JSON.stringify(posts));
    return { method: 'localStorage', count: posts.length };
  }, blogPosts);
  
  console.log('Blog updated:', JSON.stringify(result));
  
  // Reload and verify
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const verified = await page.evaluate(() => {
    const posts = blogStore.load();
    return { 
      count: posts.length,
      titles: posts.map(p => p.title.substring(0, 30) + '...')
    };
  });
  
  console.log('Verified:', JSON.stringify(verified));
  console.log('✅ Blog data updated!');
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('aicut_marketing'));
  if (!page) { console.log('Dashboard not found'); return; }
  
  await page.waitForTimeout(2000);
  
  // 실제 블로그 제목으로 업데이트
  const blogPosts = [
    { title: '하반기 마케팅, 지금 영상 편집 외주사를 정해야 하는 이유', status: '이미지 완료', date: '6/23' },
    { title: '출근길 30분, 바쁜 대표가 영상 마케팅으로 하루를 시작하는 법', status: '이미지 완료', date: '6/23' },
    { title: '변호사·세무사·보험설계사라면 왜 월 정기 영상 편집이 필요할까', status: '초안 완료', date: '6/11' },
    { title: '스타트업 CEO가 영상 PD 대신 월정기 편집을 선택한 이유', status: '초안 완료', date: '6/11' },
    { title: '영상 편집 하나로 달라지는 병원 마케팅 — 성형외과·치과·피부과 실제 사례', status: '초안 완료', date: '6/12' },
    { title: '쇼핑몰·이커머스 운영자라면 영상 마케팅이 필요한 이유', status: '초안 완료', date: '6/14' },
    { title: '온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유', status: '초안 완료', date: '6/14' },
    { title: '"가맹점 홍보 영상, 본사에서 직접 찍어주나요?" — 프랜차이즈 본사의 영상 마케팅 고민 해결법', status: '초안 완료', date: '6/14' },
    { title: '고객사례 도입이야기 — 부동산 중개법인', status: '발행 완료', date: '6/2' },
    { title: '릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유', status: '초안 완료', date: '6/19' }
  ];
  
  const result = await page.evaluate((posts) => {
    if (typeof blogStore !== 'undefined') {
      blogStore.save(posts);
      renderBlogPosts();
      return { method: 'blogStore', count: posts.length };
    }
    localStorage.setItem('aicut_blog_posts', JSON.stringify(posts));
    return { method: 'localStorage', count: posts.length };
  }, blogPosts);
  
  console.log('Updated:', JSON.stringify(result));
  
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const verified = await page.evaluate(() => {
    const posts = blogStore.load();
    return posts.map(p => p.title);
  });
  
  console.log('Verified titles:');
  verified.forEach((t, i) => console.log(`  ${i+1}. ${t}`));
  console.log('✅ Done!');
})();

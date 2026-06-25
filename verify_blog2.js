const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes('aicut_marketing'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('file:///C:/Users/paul/.openclaw/workspace/aicut_marketing_dashboard.html');
  }
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Navigate to blog
  await page.evaluate(() => goPage('blog'));
  await page.waitForTimeout(500);
  
  const r = await page.evaluate(() => {
    const blog = document.querySelector('.page[data-page="blog"]');
    if (!blog) return { error: 'no blog page' };
    
    return {
      // Check actual class names
      stepFlow: !!blog.querySelector('.step-flow'),
      keywordTags: blog.querySelectorAll('.keyword-tag').length,
      calendarTab: !!blog.querySelector('[data-blog-tab="calendar"]'),
      ideasTab: !!blog.querySelector('[data-blog-tab="ideas"]'),
      seoChecklist: blog.innerHTML.includes('seo-checklist'),
      recycleCheck: blog.innerHTML.includes('재활용'),
      imageCheck: blog.innerHTML.includes('이미지'),
      ideaCheck: blog.innerHTML.includes('아이디어'),
      // Count posts
      postItems: blog.querySelectorAll('.post-item').length,
      // Total text length to confirm it loaded
      textLen: blog.textContent.length
    };
  });
  
  console.log('=== Blog page analysis ===');
  console.log(JSON.stringify(r, null, 2));
  
  if (r.stepFlow && r.keywordTags > 0 && r.calendarTab && r.ideasTab) {
    console.log('✅ Blog page fully loaded with all sections!');
  } else {
    console.log('⚠️ Some sections missing');
  }
})();

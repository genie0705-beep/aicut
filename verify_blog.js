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
  
  await page.evaluate(() => goPage('blog'));
  await page.waitForTimeout(500);
  
  const r = await page.evaluate(() => {
    const s = document.querySelector('.page[data-page="blog"]');
    if (!s) return { error: 'no blog page' };
    return {
      stepFlow: !!s.querySelector('.step-flow'),
      progressBars: s.querySelectorAll('.progress-bar').length,
      toneGuide: !!s.querySelector('.tone-guide'),
      keywordsSection: s.querySelectorAll('.keyword-chip, .keywords-grid').length,
      calGrid: !!s.querySelector('.calendar-grid'),
      seoChecklist: s.innerHTML.includes('SEO'),
      recycleSection: s.innerHTML.includes('재활용'),
      postItems: s.querySelectorAll('.post-item, .post-row').length,
      totalText: s.textContent.substring(0, 100).replace(/\n/g, ' ')
    };
  });
  
  console.log(JSON.stringify(r, null, 2));
  console.log('✅ Done');
})();

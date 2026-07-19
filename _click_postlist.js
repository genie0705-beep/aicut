const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  let blogPage = pages.find(p => p.url().includes('blog.naver.com/aicut'));
  
  const frames = blogPage.frames();
  const prologueFrame = frames.find(f => f.url().includes('PrologueList'));
  
  // Try clicking the "블로그" menu link (PostList = management view)
  const blogMenuLink = prologueFrame.locator('a[href*="PostList.naver?blogId=aicut"]');
  const count = await blogMenuLink.count();
  console.log('Blog menu link count:', count);
  
  if (count > 0) {
    await blogMenuLink.first().click();
    await blogPage.waitForTimeout(3000);
    console.log('After click URL:', blogPage.url());
    
    // Check frames again
    const frames2 = blogPage.frames();
    for (const f of frames2) {
      const u = f.url();
      if (!u.includes('blank') && !u.includes('about:')) {
        console.log('Frame:', u.substring(0, 120));
      }
    }
  }
  
  // Try to find the write button
  const writeBtn = await prologueFrame.locator('a[id*="topBlogWrite"], a[class*="write"], a:has-text("글쓰기"), a[href*="PostWrite"], a[href*="write"]').all();
  console.log('Write buttons before:', writeBtn.length);
  
  await blogPage.screenshot({ path: '_after_click.png' });
  
  await b.close();
})();

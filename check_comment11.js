const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  // Use the blog tab that's already open
  const blogSearchPage = await browser.contexts()[0].newPage();
  
  // Search from blog section
  await blogSearchPage.goto('https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=sim&keyword=%EC%98%81%EC%83%81%ED%8E%B8%EC%A7%91', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await blogSearchPage.waitForTimeout(3000);
  
  // Get first post URL
  const postUrl = await blogSearchPage.evaluate(() => {
    const link = document.querySelector('.list_search_post .item a.desc_inner');
    return link ? link.href : null;
  });
  
  if (!postUrl) { console.log('No post found'); await browser.close(); return; }
  console.log('Post URL:', postUrl);
  
  // Close search page and open post in new page
  await blogSearchPage.close().catch(() => {});
  
  // Navigate directly to the post with ?Redirect= comment parameter
  await page.goto(postUrl + '&Redirect=Comment', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);
  
  console.log('Post page URL:', page.url());
  
  // Look for textarea or comment elements  
  const allFrames = page.frames();
  
  let found = false;
  for (const f of allFrames) {
    try {
      const ta = await f.$('textarea');
      if (ta) {
        const visible = await ta.isVisible();
        console.log(`Textarea found in frame [${f.url().substring(0,100)}]: visible=${visible}`);
        found = true;
        
        if (visible) {
          await ta.click();
          await ta.fill('테스트 댓글입니다.');
          console.log('Filled comment');
          
          // Look for submit button
          const submit = await f.$('button:has-text("등록"), .btn_register');
          if (submit) {
            await submit.click();
            console.log('Submitted');
          }
        }
      }
    } catch(e) {}
  }
  
  if (!found) {
    // Try a completely different URL - the old blog comment URL pattern
    const blogId = postUrl.match(/blog\.naver\.com\/([^/]+)/)[1];
    const logNo = postUrl.match(/\/(\d+)$/)[1];
    const commentUrl = `https://blog.naver.com/CommentList.naver?blogId=${blogId}&logNo=${logNo}`;
    console.log('Trying comment URL:', commentUrl);
    
    await page.goto(commentUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    const ta = await page.$('textarea');
    console.log('Comment page textarea:', ta ? 'found' : 'not found');
    
    if (ta) {
      await ta.click();
      await ta.fill('테스트 댓글입니다. 잘 보고 갑니다!');
      console.log('Filled');
      const submit = await page.$('button:has-text("등록"), .btn_register, input[value="등록"]');
      if (submit) {
        await submit.click();
        console.log('Submitted!');
      }
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.log(e.message));

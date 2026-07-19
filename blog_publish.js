const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  const se4Page = pages.find(p => p.url().includes('PostWriteForm'));
  if (!se4Page) {
    console.log('ERROR: SE4 page not found');
    await browser.close().catch(() => {});
    process.exit(1);
  }
  
  console.log('Current URL:', se4Page.url());
  console.log('Page title:', await se4Page.title());
  
  // Click the confirm publish button (data-testid="seOnePublishBtn")
  const confirmBtn = se4Page.locator('[data-testid="seOnePublishBtn"]');
  const btnVisible = await confirmBtn.isVisible();
  const btnEnabled = await confirmBtn.isEnabled();
  console.log('Publish confirm button visible:', btnVisible, 'enabled:', btnEnabled);
  
  if (!btnVisible) {
    console.log('ERROR: Publish button not visible');
    await browser.close().catch(() => {});
    process.exit(1);
  }
  
  // Click the publish button
  await confirmBtn.click();
  console.log('Clicked publish button');
  
  // Wait for navigation - the page should redirect to the published post
  await se4Page.waitForTimeout(3000);
  
  console.log('URL after publish:', se4Page.url());
  console.log('Title after publish:', await se4Page.title());
  
  // Try to find the published post URL - check for popup or new tab
  const allPages = ctx.pages();
  console.log('\nAll pages after publish:');
  for (const p of allPages) {
    console.log('  -', await p.title(), '|', p.url());
  }
  
  // Check for the 블로그 URL pattern
  const blogPage = allPages.find(p => p.url().includes('blog.naver.com/aicut/'));
  if (blogPage) {
    console.log('\n=== Found published post URL:', blogPage.url(), '===');
  }
  
  await browser.close().catch(() => {});
})().catch(e => { console.error('Error:', e.message); process.exit(1); });

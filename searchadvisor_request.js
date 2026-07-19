const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  // Open searchadvisor page in a new tab
  const page = await ctx.newPage();
  await page.goto('https://searchadvisor.naver.com/console/board', { waitUntil: 'domcontentloaded' });
  console.log('Search Advisor URL:', page.url());
  console.log('Title:', await page.title());
  
  await page.waitForTimeout(2000);
  
  // Check if already logged in or need to login
  const bodyText = await page.textContent('body');
  console.log('Body text (first 500):', bodyText.substring(0, 500));
  
  // Take a screenshot to see the state
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\sa_screenshot.png' });
  console.log('Screenshot saved');
  
  // Check for login required
  const hasLoginForm = bodyText.includes('로그인') || bodyText.includes('login');
  if (hasLoginForm && bodyText.length < 1000) {
    console.log('Login required - navigated to login page');
  }
  
  // Try to find the site selector and request URL input
  // Look for aicut.co.kr related elements
  const siteElements = await page.locator('text=aicut').all();
  console.log('aicut elements found:', siteElements.length);
  
  // Check current URL after possible redirect
  console.log('Final URL:', page.url());
  
  await browser.close().catch(() => {});
})().catch(e => { console.error('Error:', e.message); process.exit(1); });

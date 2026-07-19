const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  console.log('Navigating...');
  await page.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(5000);

  console.log('URL:', page.url());

  // Get page title and key elements
  const info = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyClass: document.body.className,
      bodyText: document.body.innerText.slice(0, 300),
      // Check for login/redirect indicators
      hasLoginForm: !!document.querySelector('.login_form, #login_form, [id*="login"], [class*="login"]'),
      hasPostForm: !!document.querySelector('#postForm, [id*="post"], [class*="post"], [class*="write"]'),
      // Check for SE4 specifically
      seElements: document.querySelectorAll('[class*="se_"], [class*="smart"], [data-smart]').length,
      // Check all div IDs
      divIds: Array.from(document.querySelectorAll('div[id]')).slice(0, 20).map(d => d.id),
    };
  });
  
  console.log('\n=== Page Info ===');
  Object.entries(info).forEach(([k,v]) => {
    if (typeof v === 'string') console.log(`${k}: ${v.slice(0, 200)}`);
    else console.log(`${k}: ${JSON.stringify(v).slice(0, 200)}`);
  });

  // Also check what WordPress/SE version is being loaded
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[src]')).slice(0, 20).map(s => s.src);
  });
  console.log('\n=== Scripts ===');
  scripts.forEach(s => console.log(s));
})();

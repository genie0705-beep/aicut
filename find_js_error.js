const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // Capture ALL errors
  const errors = [];
  page.on('pageerror', err => errors.push('PAGE: ' + err.message.substring(0, 300)));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.length < 500) errors.push('CONSOLE: ' + text);
    }
  });
  
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', { waitUntil: 'commit', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('Errors captured:');
  if (errors.length === 0) console.log('  NONE');
  errors.forEach(e => console.log('  ' + e));
  
  await page.close();
})();

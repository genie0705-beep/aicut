const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  
  // Set up request monitoring
  const requests = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('comment') || url.includes('Comment') || url.includes('reply')) {
      requests.push({ url: url.substring(0, 200), method: req.method() });
    }
  });
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);
  
  console.log('Comment-related requests while loading:');
  requests.forEach(r => console.log(`  ${r.method} ${r.url}`));
  
  // Now check PostView frame
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView'); await page.close(); await browser.close(); return; }
  
  // Check for hidden form data or API endpoints
  const formInfo = await postFrame.evaluate(() => {
    const results = [];
    document.querySelectorAll('form').forEach(form => {
      const inputs = Array.from(form.querySelectorAll('input[type="hidden"]')).map(i => ({
        name: i.name,
        value: i.value?.substring(0, 50)
      }));
      results.push({
        action: form.action?.substring(0, 200),
        method: form.method,
        hidden: inputs,
        id: form.id
      });
    });
    return results;
  });
  
  console.log('\nForms in PostView:');
  formInfo.forEach(f => console.log(JSON.stringify(f, null, 2)));
  
  // Check for script tags containing comment APIs
  const commentScripts = await postFrame.evaluate(() => {
    const results = [];
    document.querySelectorAll('script').forEach(script => {
      const src = script.src || '';
      const text = script.textContent || '';
      if (src.includes('comment') || src.includes('reply') || text.includes('comment') || text.includes('reply')) {
        results.push({ src: src.substring(0, 150), text: text.substring(0, 200) });
      }
    });
    return results;
  });
  
  console.log('\nComment scripts:');
  commentScripts.forEach(s => console.log(JSON.stringify(s)));
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('SA page not found'); await browser.close().catch(() => {}); return; }
  
  await saPage.bringToFront();
  await saPage.waitForTimeout(500);
  
  // Let's explore all visible elements more carefully
  // Get the full HTML source  
  const html = await saPage.content();
  console.log('HTML length:', html.length);
  
  // Look for any hidden menus or collapsible sections
  // Click on "사이트 관리" link to see if there's a submenu
  const siteManage = saPage.locator('a:has-text("사이트 관리")');
  if (await siteManage.isVisible()) {
    console.log('Clicking 사이트 관리...');
    await siteManage.click();
    await saPage.waitForTimeout(1000);
    
    // Check what appeared
    const bodyText = await saPage.textContent('body');
    console.log('After click body text (first 2000):', bodyText.substring(0, 2000));
  }
  
  // Look for all clickable elements
  const clickable = await saPage.locator('[role="button"], button, a, [onclick]').all();
  console.log('\n=== All clickable ==');
  for (let i = 0; i < clickable.length; i++) {
    const text = await clickable[i].textContent().catch(() => '');
    const visible = await clickable[i].isVisible().catch(() => false);
    if (text.trim() && visible) {
      const tag = await clickable[i].evaluate(el => el.tagName).catch(() => '?');
      console.log(i, `[${tag}]`, JSON.stringify(text.trim().substring(0, 60)));
    }
  }
  
  // Try other common paths
  console.log('\n=== Trying common paths ===');
  const paths = [
    '/console/request/crawl',
    '/console/crawlrequest',
    '/tools/crawlrequest',
    '/console/board?tab=request',
    '/console/board/request'
  ];
  
  for (const p of paths) {
    try {
      const resp = await saPage.goto('https://searchadvisor.naver.com' + p, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await saPage.waitForTimeout(1000);
      console.log(p, '->', saPage.url(), '| title:', await saPage.title());
      if (!saPage.url().includes('error') && !saPage.url().includes('404')) {
        console.log('  Found! Body snippet:', (await saPage.textContent('body')).substring(0, 300));
      }
    } catch(e) {
      console.log(p, '-> Error:', e.message.substring(0, 80));
    }
  }
  
  await browser.close().catch(() => {});
})().catch(e => { console.error('Error:', e.message); process.exit(1); });

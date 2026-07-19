const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  // 1. Comment
  console.log('[1] Post comment...');
  await page.goto('https://blog.naver.com/aicut/224329284493', {waitUntil:'networkidle',timeout:20000});
  await page.waitForTimeout(3000);
  
  const frames = page.frames();
  const pf = frames.find(f => f.url().includes('PostView'));
  if (!pf) { console.log('PostView not found'); await page.close(); await b.close(); return; }
  
  // Click comment button
  const commentBtn = pf.locator('a.btn_comment, .btn_write_comment').first();
  if (await commentBtn.isVisible().catch(() => false)) {
    await commentBtn.click();
    await page.waitForTimeout(2000);
  }
  
  // Look for textarea
  const ta = pf.locator('textarea').first();
  if (await ta.isVisible().catch(() => false)) {
    await ta.fill('좋은 정보 감사합니다! 여름 시즌 병원 마케팅에 많은 도움 되길 바랍니다. :)');
    await page.waitForTimeout(1000);
    
    // Click register
    const regBtn = pf.locator('button').filter({ hasText: '등록' }).first();
    if (await regBtn.isVisible().catch(() => false)) {
      await regBtn.click();
      console.log('Comment posted');
      await page.waitForTimeout(2000);
    }
  }
  
  await page.close();
  
  // 2. Search Advisor - open page
  console.log('[2] Open Search Advisor...');
  const saPage = await ctx.newPage();
  try {
    await saPage.goto('https://searchadvisor.naver.com/', {waitUntil:'domcontentloaded',timeout:15000});
    await saPage.waitForTimeout(2000);
    console.log('Search Advisor opened');
  } catch(e) {
    console.log('Search Advisor:', e.message.substring(0, 50));
  }
  
  console.log('Done');
  await b.close();
})();

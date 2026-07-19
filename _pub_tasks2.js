const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Open Search Advisor
  console.log('[1] Search Advisor...');
  const sa = await ctx.newPage();
  await sa.goto('https://searchadvisor.naver.com/', {waitUntil:'domcontentloaded', timeout:15000}).catch(e => console.log('SA:', e.message.substring(0,30)));
  console.log('SA tab opened');
  
  // Comment on the post
  console.log('[2] Comment...');
  let pp = ctx.pages().find(p => p.url().includes('224329284493'));
  if (!pp) {
    pp = await ctx.newPage();
    pp.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    await pp.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224329284493', {waitUntil:'networkidle', timeout:30000});
    await pp.waitForTimeout(5000);
  }
  
  const frames = pp.frames();
  const pf = frames.find(f => f.url().includes('PostView'));
  if (!pf) { console.log('No PostView'); await b.close(); return; }
  
  // Click floating comment button
  const fb = pf.locator('a.btn_comment').first();
  if (await fb.isVisible().catch(() => false)) {
    await fb.click();
    await pp.waitForTimeout(3000);
    
    // Fill textarea
    const ta = pf.locator('textarea').first();
    if (await ta.isVisible().catch(() => false)) {
      await ta.fill('좋은 정보 감사합니다! 여름 시즌 병원 마케팅에 도움 되길 바랍니다. :)');
      await pp.waitForTimeout(500);
      
      // Click register button
      const reg = pf.locator('button').filter({ hasText: '등록' }).first();
      if (await reg.isVisible().catch(() => false)) {
        await reg.click();
        console.log('Comment posted!');
        await pp.waitForTimeout(2000);
      }
    }
  }
  
  console.log('Done');
  await b.close();
})();

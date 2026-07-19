const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 1. 첫 댓글
  console.log('[1/2] 첫 댓글...');
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/aicut/224329284493', {waitUntil:'networkidle',timeout:20000});
  await page.waitForTimeout(3000);
  
  // Find the comment frame/area
  const frames = page.frames();
  const postFrame = frames.find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('PostView not found'); await page.close(); await b.close(); return; }
  
  // Check if logged in (comment write button should be visible)
  const hasLogin = await postFrame.evaluate(() => {
    // Look for comment textarea or button
    const commentBtn = document.querySelector('[class*=comment], [class*=Comment], a.btn_write_comment');
    return !!commentBtn;
  });
  console.log('Comment area:', hasLogin);
  
  // Try to find and click comment write button
  const commentBtn = postFrame.locator('a.btn_write_comment, [class*=comment_write], [class*=CommentWrite]').first();
  const vis = await commentBtn.isVisible().catch(() => false);
  if (vis) {
    await commentBtn.click();
    await page.waitForTimeout(2000);
    
    // Write comment text
    const textarea = postFrame.locator('textarea, [contenteditable], .u_cbox_write_text, .se-form, textarea[id*=comment]').first();
    const taVis = await textarea.isVisible().catch(() => false);
    if (taVis) {
      await textarea.fill('좋은 정보 감사합니다! 병원 영상 마케팅에 많은 도움 되었으면 좋겠네요.');
      await page.waitForTimeout(1000);
      
      // Click register button
      const regBtn = postFrame.locator('button:has-text(\"등록\"), button:has-text(\"작성\"), a:has-text(\"등록\")').first();
      const rVis = await regBtn.isVisible().catch(() => false);
      if (rVis) await regBtn.click();
      console.log('Comment posted');
    } else {
      console.log('Textarea not found - trying keyboard');
    }
  }
  
  await page.close();
  
  // 2. 서치어드바이저 (simpler - just navigate there)
  console.log('[2/2] 서치어드바이저...');
  const saPage = await ctx.newPage();
  try {
    await saPage.goto('https://searchadvisor.naver.com/', {waitUntil:'domcontentloaded',timeout:15000});
    await saPage.waitForTimeout(2000);
    console.log('Search Advisor opened:', saPage.url().substring(0, 80));
  } catch(e) {
    console.log('Search Advisor error:', e.message.substring(0, 50));
  }
  
  console.log('\n=== 처리 완료 ===');
  await b.close();
})();

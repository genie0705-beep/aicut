const { chromium } = require('playwright');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let ig = ctx.pages().find(p => p.url().includes('instagram'));
  
  // Click create (+) and wait for modal
  await ig.locator('[aria-label*=\"plus\"], [aria-label*=\"새로운\"]').first().click();
  await ig.waitForTimeout(3000);
  
  // Find all file inputs
  const count = await ig.locator('input[type=file]').count();
  console.log('File inputs:', count);
  
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      try {
        await ig.locator('input[type=file]').nth(i).setInputFiles(path.join(W, 'aicut_blog_estate_main.png'));
        console.log('Image uploaded!');
        await ig.waitForTimeout(3000);
        break;
      } catch(e) {}
    }
  }
  
  await b.close();
})();

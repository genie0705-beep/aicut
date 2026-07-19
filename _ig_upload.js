const { chromium } = require('playwright');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let ig = ctx.pages().find(p => p.url().includes('instagram.com/aicut.official'));
  if (!ig) ig = ctx.pages().find(p => p.url().includes('instagram.com'));
  if (!ig) ig = await ctx.newPage();
  
  ig.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  // Navigate to create page
  await ig.goto('https://www.instagram.com/create/details/', {waitUntil:'domcontentloaded', timeout:20000});
  await ig.waitForTimeout(3000);
  console.log('URL:', ig.url().substring(0, 80));
  
  // Look for the file input
  const fileInput = ig.locator('input[type=file]').first();
  const fiVis = await fileInput.isVisible().catch(() => false);
  console.log('File input visible:', fiVis);
  
  if (fiVis) {
    await fileInput.setInputFiles(path.join(W, 'aicut_blog_estate_main.png'));
    console.log('File set!');
    await ig.waitForTimeout(3000);
  } else {
    // Try file chooser via clicking
    const fcPromise = ig.waitForEvent('filechooser', {timeout:10000}).catch(() => null);
    
    // Click on the create area
    const dz = ig.locator('[role=button], article, section').first();
    await dz.click().catch(() => {});
    await ig.waitForTimeout(1000);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(path.join(W, 'aicut_blog_estate_main.png'));
      console.log('File set via chooser!');
      await ig.waitForTimeout(3000);
    } else {
      console.log('Could not upload - please do it manually');
    }
  }
  
  await b.close();
})();

const { chromium } = require('playwright');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const ig = ctx.pages().find(p => p.url().includes('instagram'));
  if (!ig) { console.log('No IG tab'); await b.close(); return; }
  
  // Refresh profile page and wait
  await ig.goto('https://www.instagram.com/aicut.official/', {waitUntil:'networkidle',timeout:20000});
  await ig.waitForTimeout(5000);
  
  console.log('URL:', ig.url().substring(0, 80));
  
  // Logged in check
  const info = await ig.evaluate(() => {
    const result = {};
    result.hasNav = !!document.querySelector('nav');
    result.avatarImg = !!document.querySelector('img[alt*=\"aicut\"]');
    result.newPostBtn = !!document.querySelector('svg[aria-label*=\"New\"], a[href*=\"create\"]');
    result.htmlSample = document.body.innerHTML.substring(0, 200);
    return result;
  }).catch(e => ({error: e.message}));
  
  console.log('Info:', JSON.stringify(info, null, 2));
  
  if (info.newPostBtn || info.hasNav) {
    console.log('Logged in - trying to create post');
    // Go to create page
    await ig.goto('https://www.instagram.com/create/select/', {waitUntil:'networkidle',timeout:20000});
    await ig.waitForTimeout(3000);
    console.log('Create page:', ig.url().substring(0, 80));
    
    // Try uploading image
    const fcP = ig.waitForEvent('filechooser', {timeout:10000}).catch(() => null);
    await ig.keyboard.press('Enter');
    await ig.waitForTimeout(1000);
    const fc = await fcP;
    if (fc) {
      await fc.setFiles(path.join(W, 'aicut_blog_estate_main.png'));
      console.log('File uploaded!');
    } else {
      console.log('No filechooser');
    }
  }
  
  await b.close();
})();

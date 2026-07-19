const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Find or create Instagram tab
  let ig = ctx.pages().find(p => p.url().includes('instagram.com/aicut.official'));
  if (!ig) ig = ctx.pages().find(p => p.url().includes('instagram.com'));
  if (!ig) ig = await ctx.newPage();
  
  // Handle dialogs
  ig.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  if (!ig.url().includes('instagram.com')) {
    await ig.goto('https://www.instagram.com/aicut.official/', {waitUntil:'networkidle', timeout:20000});
    await ig.waitForTimeout(3000);
  }
  
  console.log('IG URL:', ig.url().substring(0, 80));
  
  // Check if logged in - look for create button
  const isLoggedIn = await ig.evaluate(() => {
    const createBtn = document.querySelector('[aria-label=\"새 게시물\"], [aria-label=\"New post\"], a[href*=\"/create\"]');
    return !!createBtn;
  }).catch(() => false);
  console.log('Logged in:', isLoggedIn);
  
  if (!isLoggedIn) {
    console.log('Need login - opening create page directly');
    await ig.goto('https://www.instagram.com/create/details/', {waitUntil:'domcontentloaded', timeout:20000});
    await ig.waitForTimeout(3000);
    console.log('Create page URL:', ig.url().substring(0, 80));
  }
  
  await b.close();
})();

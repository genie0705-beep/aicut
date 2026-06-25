const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(WORKSPACE, 'debug_before.png') });
  
  // Check all buttons in detail
  const buttonInfo = await page.evaluate(() => {
    const result = [];
    // Look for the specific image/photo buttons
    document.querySelectorAll('button').forEach(btn => {
      const text = (btn.innerText || '').trim();
      const cls = btn.className;
      if (text.includes('사진') || cls.includes('image') || cls.includes('photo')) {
        const r = btn.getBoundingClientRect();
        result.push({
          text: text.replace(/\n/g, '|').substring(0, 30),
          cls: cls.substring(0, 50),
          x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height),
          visible: r.width > 0 && r.height > 0
        });
      }
    });
    return result;
  });
  console.log('Image buttons:', JSON.stringify(buttonInfo, null, 2));
  
  // Click each relevant button and watch for filechooser
  // First try: click the 사진 button
  console.log('\n=== Clicking 사진 button ===');
  
  // Get exact button
  const btnPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim().startsWith('사진')) {
        const r = btn.getBoundingClientRect();
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    return null;
  });
  
  if (btnPos) {
    console.log(`Button at (${btnPos.x}, ${btnPos.y})`);
    
    // Set up both filechooser AND dialog listeners
    const fcPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(e => 'TIMEOUT');
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 }).catch(e => 'TIMEOUT');
    const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(e => 'TIMEOUT');
    
    await page.mouse.click(btnPos.x, btnPos.y);
    await page.waitForTimeout(3000);
    
    const fcRes = await fcPromise;
    const dialogRes = await dialogPromise;
    const popupRes = await popupPromise;
    
    console.log('Filechooser:', fcRes === 'TIMEOUT' ? '⏱️ timeout' : '✅ triggered');
    console.log('Dialog:', dialogRes === 'TIMEOUT' ? '⏱️ timeout' : '✅ triggered: ' + (dialogRes?.message?.() || ''));
    console.log('Popup:', popupRes === 'TIMEOUT' ? '⏱️ timeout' : '✅ new tab');
    
    // Take screenshot of what appeared
    await page.screenshot({ path: path.join(WORKSPACE, 'debug_after_click.png') });
    
    // Check what's on screen now
    const visibleElements = await page.evaluate(() => {
      const result = [];
      // Check for newly appeared elements
      const allElements = document.querySelectorAll('div, section, aside, nav');
      allElements.forEach(el => {
        const r = el.getBoundingClientRect();
        const text = (el.innerText || '').trim();
        // Look for elements that appeared in the center of the screen
        if (r.width > 100 && r.height > 100 && r.x < 500 && r.y < 500 && text.length > 0 && text.length < 200) {
          result.push({
            text: text.substring(0, 60),
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height)
          });
        }
      });
      return result;
    });
    console.log('\nVisible elements near top-left:', JSON.stringify(visibleElements, null, 2));
    
    // Check for file inputs
    const fileInputs = await page.evaluate(() => {
      const all = document.querySelectorAll('input[type="file"]');
      return Array.from(all).map(el => ({
        id: el.id,
        className: el.className.substring(0, 40),
        accept: el.accept,
        hidden: el.offsetHeight === 0,
        parentEl: el.parentElement?.tagName,
        parentCls: (el.parentElement?.className || '').substring(0, 40)
      }));
    });
    console.log('\nFile inputs:', JSON.stringify(fileInputs, null, 2));
    
    // Check for iframes
    const iframes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => ({
        id: f.id, name: f.name, src: (f.src || '').substring(0, 150)
      }));
    });
    console.log('\nIframes:', JSON.stringify(iframes, null, 2));
  }
  
  await browser.close();
})();

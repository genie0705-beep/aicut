const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const CARDS = ['aicut_card_reels_01.png','aicut_card_reels_02.png','aicut_card_reels_03.png','aicut_card_reels_04.png'];
const CARD_PATHS = CARDS.map(f => path.join(WORKSPACE, f));

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let igPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com/aicut')) { igPage = p; break; }
  }
  if (!igPage) { igPage = await ctx.newPage(); await igPage.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 }); await igPage.waitForTimeout(3000); }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Check if modal is already open
  const modalCheck = await igPage.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (const inp of inputs) {
      if (inp.offsetHeight > 0 || inp.style.display !== 'none') {
        return { found: true, type: 'visible', accept: inp.accept };
      }
    }
    // Check for hidden file inputs (look for any)
    const allInputs = document.querySelectorAll('input[type="file"]');
    for (const inp of allInputs) {
      return { found: true, type: 'hidden', accept: inp.accept, count: allInputs.length };
    }
    return { found: false };
  });
  console.log('Modal file inputs:', JSON.stringify(modalCheck));
  
  if (modalCheck.found) {
    // Try setting files via JS directly
    const uploadResult = await igPage.evaluate((paths) => {
      const inputs = document.querySelectorAll('input[type="file"]');
      for (const inp of inputs) {
        if (inp.accept && inp.accept.includes('image')) {
          // We can't set files via JS for security, but we can try to click it
          inp.click();
          return 'clicked file input';
        }
      }
      return 'no suitable input';
    }, CARD_PATHS);
    console.log('Upload result:', uploadResult);
    await igPage.waitForTimeout(2000);
  }
  
  // If modal not open, create new post
  if (!modalCheck.found) {
    console.log('Opening new post modal...');
    const result = await igPage.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      for (const svg of svgs) {
        if (svg.getAttribute('aria-label') === '새로운 게시물') {
          const parent = svg.closest('[role="button"]') || svg.parentElement;
          if (parent) { parent.click(); return 'clicked'; }
        }
      }
      return 'not found';
    });
    console.log(result);
    await igPage.waitForTimeout(3000);
  }
  
  // Check for file input again
  await igPage.screenshot({ path: 'ig_modal_state.png' });
  
  const retryCheck = await igPage.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    return inputs.length > 0 ? { count: inputs.length, accept: inputs[0]?.accept } : { count: 0 };
  });
  console.log('Retry check:', JSON.stringify(retryCheck));
  
  // If file input exists, try to use it
  if (retryCheck.count > 0) {
    const fcPromise = igPage.waitForEvent('filechooser', { timeout: 10000 });
    
    // Try clicking on the file input area (the "컴퓨터에서 선택" text area)
    const clickResult = await igPage.evaluate(() => {
      // Find the file input and try clicking its associated label/button
      const inputs = document.querySelectorAll('input[type="file"]');
      for (const inp of inputs) {
        inp.click();
        return 'clicked input directly';
      }
      // Also try finding "컴퓨터에서 선택" text
      const allEls = document.querySelectorAll('span, div, button');
      for (const el of allEls) {
        const t = (el.innerText || '').trim();
        if (t.includes('컴퓨터에서 선택') || t.includes('Select from computer')) {
          el.click();
          return 'clicked text';
        }
      }
      return 'nothing clicked';
    });
    console.log('Click attempt:', clickResult);
    
    const fc = await fcPromise.catch(() => null);
    if (fc) {
      await fc.setFiles(CARD_PATHS);
      console.log('✅ 이미지 4장 파일 선택 완료!');
    } else {
      console.log('❌ 파일 선택기 응답 없음');
      // Try alternative: use evaluate to set files via JS
      await igPage.screenshot({ path: 'ig_no_fc.png' });
      
      // If file input is visible, we might be able to use it directly
      const directUpload = await igPage.evaluate((paths) => {
        return new Promise((resolve) => {
          const inputs = document.querySelectorAll('input[type="file"]');
          if (inputs.length > 0) {
            // Create a DataTransfer and set files  
            const dt = new DataTransfer();
            // Can't actually add files from JS, but we can try
            resolve('input exists but cannot set files via JS');
          }
          resolve('no input');
        });
      }, CARD_PATHS);
      console.log('Direct upload:', directUpload);
    }
  }
  
  await browser.close();
})();

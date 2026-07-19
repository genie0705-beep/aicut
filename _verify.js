const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Find the write page tab
  const writePage = pages.find(p => p.url().includes('PostWriteForm'));
  if (!writePage) {
    console.log('Write page not found - may have closed');
    // List all pages
    for (let i=0;i<pages.length;i++) {
      try {
        console.log(i+':', pages[i].url().substring(0,100));
      } catch(e) {}
    }
    process.exit(0);
  }
  
  console.log('Found write page:', writePage.url());
  
  // Check SE4 state
  const state = await writePage.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const title = se.getTitle ? se.getTitle() : '(no getTitle)';
    // Also check title input DOM
    const titleInput = document.querySelector('.se-title-input');
    const titleText = titleInput ? titleInput.innerText : '(no input)';
    const contentLen = se.getContentText ? se.getContentText().length : 0;
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    const images = document.querySelectorAll('.se-image-resource, img[class*="se-image"]').length;
    
    // Check center alignment
    const centered = document.querySelectorAll('.se-text-paragraph[style*="center"], .se-text-paragraph-align-center').length;
    
    return { title, titleText, contentLen, paras, images, centered };
  });
  console.log('State:', JSON.stringify(state, null, 2));
  
  // Take a screenshot to verify
  await writePage.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\_verify_blog.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Check if it's actually saved
  const savedState = await writePage.evaluate(() => {
    // Check for save indicators
    const body = document.body.innerText;
    const hasSaved = body.includes('저장됨') || body.includes('임시저장');
    const saveBtns = Array.from(document.querySelectorAll('button, a, span'))
      .filter(el => (el.innerText||'').includes('저장'))
      .map(el => el.innerText);
    return { hasSaved, saveBtns };
  });
  console.log('Saved state:', JSON.stringify(savedState));
  
  b.close();
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

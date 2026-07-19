const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('blog.naver.com'));
  
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  
  // Wait and check
  await page.waitForTimeout(8000);
  console.log('URL:', page.url());
  
  // Check iframes
  const frames = page.frames();
  console.log('Frames:', frames.length);
  for (let i=0;i<frames.length;i++) {
    console.log('Frame', i, ':', frames[i].url().substring(0,100));
  }
  
  // Check for SmartEditor in main frame
  let se = await page.evaluate(() => {
    return {
      hasSE: typeof SmartEditor !== 'undefined',
      hasEditors: typeof SmartEditor !== 'undefined' && SmartEditor._editors ? Object.keys(SmartEditor._editors) : [],
      seCount: document.querySelectorAll('[class*="se-"]').length,
      bodyHTML: document.body.innerHTML.substring(0, 500)
    };
  });
  console.log('Main frame:', JSON.stringify(se, null, 2));
  
  // Check if SmartEditor is in any iframe
  for (let i=0;i<frames.length;i++) {
    try {
      const fse = await frames[i].evaluate(() => {
        return {
          hasSE: typeof SmartEditor !== 'undefined',
          hasEditors: typeof SmartEditor !== 'undefined' && SmartEditor._editors ? Object.keys(SmartEditor._editors) : [],
          seCount: document.querySelectorAll('[class*="se-"]').length,
          url: window.location.href.substring(0,80)
        };
      });
      console.log('Frame', i, 'SE:', JSON.stringify(fse));
    } catch(e) {
      console.log('Frame', i, 'error:', e.message.substring(0,60));
    }
  }
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

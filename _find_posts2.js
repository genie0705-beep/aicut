const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pg = await ctx.newPage();
  
  // Blog main page
  await pg.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await pg.waitForTimeout(3000);
  
  // Get all frames
  const frames = pg.frames();
  console.log('Total frames:', frames.length);
  
  let allPostUrls = [];
  
  for (const f of frames) {
    try {
      const fu = f.url();
      if (fu.includes('naver.com') && (fu.includes('Prologue') || fu.includes('PostList'))) {
        console.log('\nFrame:', fu.substring(0, 100));
        
        const links = await f.evaluate(() => {
          const result = [];
          document.querySelectorAll('a').forEach(a => {
            const href = a.href || '';
            // blog.naver.com/aicut/숫자 형태
            const match = href.match(/\/aicut\/(\d+)$/);
            if (match) {
              result.push(href);
            }
          });
          return result;
        });
        
        if (links.length > 0) {
          console.log('Found', links.length, 'post links');
          allPostUrls = allPostUrls.concat(links);
        }
      }
    } catch(e) {
      console.log('Frame error:', e.message.substring(0, 50));
    }
  }
  
  // Remove duplicates
  allPostUrls = [...new Set(allPostUrls)];
  console.log('\n=== Total unique posts:', allPostUrls.length, '===');
  allPostUrls.forEach(u => console.log(u));
  
  // Check each for contact@aicut.co.kr
  console.log('\n=== Checking for contact@aicut.co.kr ===');
  const toFix = [];
  
  for (const postUrl of allPostUrls) {
    try {
      await pg.goto(postUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await pg.waitForTimeout(1500);
      
      const text = await pg.evaluate(() => document.body.innerText);
      if (text.includes('contact@aicut.co.kr')) {
        const logNo = postUrl.match(/\/(\d+)$/)?.[1] || '';
        toFix.push(logNo);
        console.log(`\u2705 Found: ${logNo}`);
      } else {
        console.log(`\u274C No contact: ${postUrl.substring(0, 60)}`);
      }
    } catch(e) {
      console.log(`\u274C Error: ${postUrl.substring(0, 50)}`);
    }
  }
  
  console.log(`\n=== contact@aicut.co.kr 있는 포스트: ${toFix.length}개 ===`);
  console.log(toFix.join(', '));
  
  await pg.screenshot({ path: 'post_list.png' });
  await b.close();
})();

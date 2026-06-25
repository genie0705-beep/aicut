const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  // Go to lg4600's blog - the first neighbor we added
  await page.goto('https://blog.naver.com/lg4600', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  // Find the post list frame
  const frames = page.frames();
  console.log('URL:', page.url());
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    if (url.includes('PrologueList') || url.includes('blogId')) {
      console.log(`\nFrame ${i}: ${url.substring(0, 200)}`);
      
      // Find post links in this frame
      try {
        const postLinks = await f.evaluate(() => {
          const allLinks = document.querySelectorAll('a');
          const results = [];
          allLinks.forEach(a => {
            const href = a.href || '';
            // Look for blog post URLs - pattern blog.naver.com/{blogId}/{postNo}
            if (href.match(/blog\.naver\.com\/[^/]+\/\d+$/)) {
              results.push({
                href: href.substring(0, 120),
                text: a.textContent?.trim()?.substring(0, 40) || ''
              });
            }
          });
          return results;
        });
        
        if (postLinks.length > 0) {
          console.log('Post links found:', postLinks.length);
          postLinks.slice(0, 5).forEach(p => console.log(`  ${p.text}: ${p.href}`));
          
          // Click the first post link
          const postUrl = postLinks[0].href;
          await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(5000);
          
          console.log('\nPost page URL:', page.url());
          
          // Find comment frames
          const postFrames = page.frames();
          console.log(`Post frames: ${postFrames.length}`);
          
          for (let j = 0; j < postFrames.length; j++) {
            const pf = postFrames[j];
            const pUrl = pf.url();
            if (pUrl.includes('Comment') || pUrl.includes('comment')) {
              console.log(`\nComment frame ${j}: ${pUrl.substring(0, 200)}`);
              
              try {
                const text = await pf.evaluate(() => document.body?.innerText?.substring(0, 300) || '');
                console.log('Text:', text.replace(/\n/g, ' / ').substring(0, 200));
              } catch(e) {}
              
              try {
                const commentInputs = await pf.evaluate(() => {
                  const textareas = document.querySelectorAll('textarea');
                  return Array.from(textareas).map(t => ({
                    placeholder: t.placeholder?.substring(0, 40),
                    id: t.id?.substring(0, 30),
                    className: t.className?.substring(0, 50)
                  }));
                });
                console.log('Comment inputs:', JSON.stringify(commentInputs, null, 2));
              } catch(e) {}
              
              try {
                const btns = await pf.evaluate(() => {
                  return Array.from(document.querySelectorAll('button')).map(b => ({
                    text: b.textContent?.trim()?.substring(0, 20),
                    id: b.id?.substring(0, 30),
                    className: b.className?.substring(0, 50)
                  }));
                });
                console.log('Buttons:', JSON.stringify(btns, null, 2));
              } catch(e) {}
            }
          }
          break;
        } else {
          console.log('No post links found in this frame');
        }
      } catch(e) {
        console.log(`Frame error: ${e.message.substring(0, 60)}`);
      }
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));

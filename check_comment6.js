const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  // Go directly to the post list page
  await page.goto('https://blog.naver.com/PostList.naver?blogId=lg4600', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  console.log('URL:', page.url());
  
  // Find post frames
  const frames = page.frames();
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    if (url.includes('PostList') || url.includes('blogId')) {
      console.log(`\nFrame ${i}: ${url.substring(0, 200)}`);
      
      try {
        // Find post links
        const posts = await f.evaluate(() => {
          const results = [];
          const links = document.querySelectorAll('a[href*="blog.naver.com"], a[href*="PostView"], a[class*="post"]');
          links.forEach(a => {
            const href = a.href;
            if (href && href.includes('blog.naver.com') && !href.includes('Prologue') && !href.includes('PostList') && !href.includes('GuestBook')) {
              results.push({
                href: href.substring(0, 150),
                text: a.textContent?.trim()?.substring(0, 40)
              });
            }
          });
          
          // If no direct links, look for post containers
          if (results.length === 0) {
            const items = document.querySelectorAll('[class*="post"], [class*="Post"], li.subject, dd.subject');
            items.forEach(item => {
              const text = item.textContent?.trim()?.substring(0, 40);
              if (text && text.length > 5) {
                results.push({ text, note: 'container' });
              }
            });
          }
          
          return results;
        });
        
        console.log('Posts found:', posts.length);
        posts.slice(0, 5).forEach(p => console.log(`  ${p.text}: ${p.href || ''}`));
        
        // If we found post links, navigate to the first one
        if (posts.length > 0 && posts[0].href) {
          await page.goto(posts[0].href, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(5000);
          console.log('\nPost URL:', page.url());
        }
      } catch(e) {
        console.log(`  Error: ${e.message.substring(0, 60)}`);
      }
    }
    
    // Check for comment frames in the post page
    if (url.includes('Comment') || url.includes('comment')) {
      console.log(`\nComment frame ${i}: ${url.substring(0, 200)}`);
      
      try {
        const text = await f.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
        console.log('Text:', text.replace(/\n/g, ' / ').substring(0, 200));
      } catch(e) {}
      
      try {
        const textarea = await f.evaluate(() => {
          const ta = document.querySelector('textarea');
          return ta ? { placeholder: ta.placeholder, id: ta.id, className: ta.className?.substring(0, 50) } : null;
        });
        console.log('Textarea:', JSON.stringify(textarea));
        
        const btns = await f.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(b => ({
            text: b.textContent?.trim()?.substring(0, 20),
            className: b.className?.substring(0, 50)
          }));
        });
        console.log('Buttons:', JSON.stringify(btns));
      } catch(e) {}
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));

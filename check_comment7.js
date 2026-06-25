const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  // Use the blog search to get real post URLs
  await page.goto('https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=sim&keyword=%EC%98%81%EC%83%81%ED%8E%B8%EC%A7%91', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  
  // Get all post links from the search results
  const postLinks = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.list_search_post .item');
    items.forEach(item => {
      const linkEl = item.querySelector('a.desc_inner');
      const authorEl = item.querySelector('.author');
      if (linkEl && linkEl.href) {
        results.push({
          url: linkEl.href,
          title: linkEl.textContent?.trim()?.substring(0, 40),
          author: authorEl?.textContent?.trim()?.substring(0, 20)
        });
      }
    });
    return results;
  });
  
  console.log(`Found ${postLinks.length} posts`);
  postLinks.slice(0, 3).forEach(p => console.log(`  ${p.author}: ${p.title} => ${p.url}`));
  
  // Navigate to the first post
  if (postLinks.length > 0) {
    await page.goto(postLinks[0].url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    console.log('\nPost URL:', page.url());
    
    // Find comment frame
    const frames = page.frames();
    console.log(`Frames: ${frames.length}`);
    
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const url = f.url();
      if (url.includes('Comment') || url.includes('comment')) {
        console.log(`\nComment frame ${i}: ${url.substring(0, 200)}`);
        
        try {
          const text = await f.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
          console.log('Text:', text.replace(/\n/g, ' / ').substring(0, 300));
        } catch(e) {}
        
        try {
          const textareas = await f.evaluate(() => {
            return Array.from(document.querySelectorAll('textarea')).map(t => ({
              placeholder: t.placeholder?.substring(0, 40),
              id: t.id?.substring(0, 30),
              className: t.className?.substring(0, 50),
              rows: t.rows,
              cols: t.cols
            }));
          });
          console.log('Textareas:', JSON.stringify(textareas, null, 2));
          
          const allInputs = await f.evaluate(() => {
            return Array.from(document.querySelectorAll('input, textarea, [contenteditable]')).map(el => ({
              tag: el.tagName,
              type: el.type || '',
              placeholder: el.placeholder?.substring(0, 40),
              id: el.id?.substring(0, 30),
              className: el.className?.substring(0, 50)
            }));
          });
          console.log('All inputs:', JSON.stringify(allInputs, null, 2));
          
          const buttons = await f.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => ({
              text: b.textContent?.trim()?.substring(0, 20),
              className: b.className?.substring(0, 60)
            }));
          });
          console.log('Buttons:', JSON.stringify(buttons, null, 2));
        } catch(e) {
          console.log(`  Error: ${e.message.substring(0, 60)}`);
        }
      }
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));

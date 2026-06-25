const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const page = await browser.contexts()[0].newPage();
  
  // 방금 이웃 추가한 블로그 중 하나 방문
  await page.goto('https://blog.naver.com/lg4600', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  
  // 최신 포스팅 찾기
  const links = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    const results = [];
    allLinks.forEach(a => {
      const href = a.href;
      if (href && href.includes('/2') && href.includes('blog.naver.com/lg4600')) {
        results.push(href);
      }
    });
    return results;
  });
  
  console.log('Post links:', links.slice(0, 5));
  
  if (links.length > 0) {
    // Go to first post
    await page.goto(links[0], { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    
    console.log('\nPost URL:', page.url());
    
    // Check frames
    const frames = page.frames();
    console.log(`\nFrames: ${frames.length}`);
    
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const url = f.url();
      if (url.includes('Comment') || url.includes('comment') || url.includes('blog.naver.com')) {
        console.log(`\nFrame ${i}: ${url.substring(0, 150)}`);
        try {
          const text = await f.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
          console.log('Text:', text.replace(/\n/g, ' / ').substring(0, 200));
          
          // Find comment inputs
          const inputs = await f.evaluate(() => {
            const all = document.querySelectorAll('textarea, input[type="text"], div[contenteditable]');
            return Array.from(all).filter(el => el.offsetParent !== null).map(el => ({
              tag: el.tagName,
              type: el.type || '',
              placeholder: el.placeholder || '',
              id: el.id?.substring(0, 30) || '',
              class: el.className?.substring(0, 40) || ''
            }));
          });
          
          if (inputs.length > 0) {
            console.log('Inputs found:', JSON.stringify(inputs, null, 2));
          }
          
          // Find all buttons
          const btns = await f.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a, input[type="submit"]'))
              .filter(el => el.offsetParent !== null)
              .map(el => ({
                tag: el.tagName,
                text: el.textContent?.trim()?.substring(0, 20) || el.value?.substring(0, 20) || '',
                id: el.id?.substring(0, 30),
                class: el.className?.substring(0, 40)
              }));
          });
          
          const relevantBtns = btns.filter(b => b.text.includes('등록') || b.text.includes('취소') || b.text.includes('댓글'));
          if (relevantBtns.length > 0) {
            console.log('Relevant buttons:', JSON.stringify(relevantBtns, null, 2));
          }
        } catch(e) {
          console.log(`  Error: ${e.message.substring(0, 60)}`);
        }
      }
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));

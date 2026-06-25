const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = ctx.pages()[6];
  await p.bringToFront();
  
  await p.goto('https://blog.naver.com/PostList.naver?blogId=aicut&widgetTypeCall=true&noTrackingCode=true&directAccess=true', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(()=>{});
  await p.waitForTimeout(5000);
  
  const posts = await p.evaluate(() => {
    const links = document.querySelectorAll('a');
    const result = [];
    const seen = {};
    links.forEach(a => {
      const href = a.href;
      const text = a.innerText.trim();
      const m = href && href.match(/aicut\/(\d+)/);
      if (m && text.length > 5 && !seen[m[1]]) {
        seen[m[1]] = true;
        result.push({ text: text.substring(0, 60), id: m[1] });
      }
    });
    return result;
  });
  
  console.log('포스팅 목록:');
  posts.forEach(p => console.log(p.id + ': ' + p.text));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

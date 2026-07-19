const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Test various write URLs
  const urls = [
    'https://blog.naver.com/PostWrite.naver?blogId=aicut',
    'https://blog.naver.com/blog/write?blogId=aicut',
    'https://blog.naver.com/write?blogId=aicut',
    'https://blog.naver.com/PostWriteForm.naver?blogId=aicut',
    'https://blog.naver.com/PostList.naver?blogId=aicut',
    'https://blog.naver.com/Write.naver?blogId=aicut',
    'https://blog.naver.com/editor?blogId=aicut'
  ];
  
  for (const url of urls) {
    try {
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await p.waitForTimeout(2000);
      const text = await p.evaluate(() => document.body.innerText.substring(0, 100));
      const title = await p.title();
      const hasSE = await p.evaluate(() => {
        return typeof SmartEditor !== 'undefined' && SmartEditor._editors ? 'YES' : 'NO';
      });
      console.log(`[${hasSE}] ${url}`);
      console.log(`   Title: ${title.substring(0,60)} | ${text.replace(/\s+/g,' ').substring(0,60)}`);
      await p.close();
    } catch(e) {
      console.log(`[ERR] ${url}: ${e.message.substring(0,50)}`);
    }
  }
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

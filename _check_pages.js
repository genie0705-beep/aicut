const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  console.log('Pages:', pages.length);
  for (let i=0;i<pages.length;i++) {
    try {
      const t = await pages[i].title();
      const u = pages[i].url();
      console.log(i+':', t.substring(0,80), '|', u.substring(0,100));
    } catch(e) {
      console.log(i+': ERROR:', e.message.substring(0,80));
    }
  }
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

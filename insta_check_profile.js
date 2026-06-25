const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.goto('https://www.instagram.com/aicut.official/', { timeout: 15000 });
  await p.waitForTimeout(4000);

  const r = await p.evaluate(() => {
    const imgs = document.querySelectorAll('img[alt*="profile"], img[alt*="프로필"], img[src*="scontent"]');
    const srcs = Array.from(imgs).map(i => ({
      alt: i.alt?.substring(0, 40),
      src: i.src?.substring(0, 100)
    }));
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => 
      l.includes('게시물') || l.includes('팔로워') || l.includes('팔로잉') || l.includes('post')
    );
    return { imgs: srcs, lines };
  });
  
  console.log('프로필:', JSON.stringify(r, null, 2));
  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

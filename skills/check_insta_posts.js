const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ig = b.contexts()[0].pages().find(p => p.url().includes('instagram.com/aicut'));
  await ig.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  const r = await ig.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/p/"]');
    const alts = [];
    links.forEach(l => {
      const img = l.querySelector('img');
      if (img) alts.push((img.getAttribute('alt') || '').substring(0, 40));
    });
    return { count: links.length, alts: alts.slice(0, 5) };
  });
  console.log('게시물 수:', r.count);
  if (r.alts.length > 0) {
    console.log('최근 게시물:');
    r.alts.forEach((a, i) => console.log('  [' + (i+1) + '] ' + a));
  }
  await b.close();
}
main().catch(e => console.log('에러:', e.message));

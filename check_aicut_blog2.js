// aicut 블로그 포스팅 목록 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222').catch(() => null);
  if (!b) { console.log('CDP 실패'); process.exit(1); }
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  await p.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(3000);

  const mf = p.frame({ name: 'mainFrame' });
  if (mf) {
    const body = await mf.evaluate(() => document.body.innerText.substring(0, 3000)).catch(() => '');
    console.log('=== 블로그 메인 ===');
    console.log(body);

    // 포스팅 링크 찾기
    const links = await mf.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .filter(a => a.href && a.href.includes('logNo'))
        .map(a => ({ href: a.href, title: a.innerText.substring(0, 60) }));
    }).catch(() => []);
    console.log('\n=== 포스팅 목록 ===');
    links.forEach(l => console.log(l.title, '->', l.href.substring(0, 80)));
  }

  try { await p.close().catch(() => {}); } catch (e) {}
  try { await b.close().catch(() => {}); } catch (e) {}
})();

// 발행 상태 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite') || p.url().includes('blog.naver.com/aicut')) {
      const url = p.url();
      const body = await p.evaluate(() => document.body.innerText.substring(0, 800)).catch(() => '');
      console.log('URL:', url);
      console.log('상태:', body);
      break;
    }
  }

  // 블로그 메인 확인
  for (const p of ctx.pages()) {
    if (p.url() === 'https://blog.naver.com/aicut') {
      console.log('\n=== 블로그 메인 ===');
      const mf = p.frame({ name: 'mainFrame' });
      if (mf) {
        const posts = await mf.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          return links.filter(a => a.href && a.href.includes('logNo'))
            .map(a => ({ title: a.innerText.substring(0, 40), href: a.href }));
        }).catch(() => []);
        console.log('최근 포스팅:');
        posts.slice(0, 3).forEach(p => console.log('  ', p.title, '->', p.href));
      }
      break;
    }
  }

  try { await b.close(); } catch(e) {}
})();

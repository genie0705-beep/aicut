const { chromium } = require('playwright');
const BLOG_URL = 'https://blog.naver.com/aicut/224341544476';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  try {
    await page.goto(BLOG_URL, { waitUntil: 'load', timeout: 20000 });
    await new Promise(r => setTimeout(r, 4000));

    // iframe 확인
    const frames = page.frames();
    console.log('Frames:', frames.length);
    frames.forEach((f, i) => {
      console.log(`  [${i}] ${f.url().substring(0, 120)}`);
    });

    // PostView iframe 찾기
    const pf = frames.find(f => f.url().includes('PostView'));
    if (pf) {
      console.log('\n=== PostView iframe 분석 ===');
      const editBtns = await pf.evaluate(() => {
        const results = [];
        document.querySelectorAll('a, button, span').forEach(el => {
          const t = (el.textContent || '').trim();
          if ((t.includes('수정') || t.includes('편집')) && t.length < 30) {
            results.push({ tag: el.tagName, text: t, cls: el.className?.substring(0,80), href: el.href || '' });
          }
        });
        return results;
      });
      console.log('수정 버튼:', JSON.stringify(editBtns));
    }

    await page.screenshot({ path: '_debug_blog2.png' });
    console.log('스크린샷 저장됨');
  } finally {
    await page.close();
  }
})();

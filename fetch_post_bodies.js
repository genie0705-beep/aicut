const { chromium } = require('playwright');

const POSTS = [
  { logNo: '224315539820', label: '쇼핑몰' },
  { logNo: '224315585369', label: '온라인강의' },
  { logNo: '224312026671', label: '변호사' },
  { logNo: '224303576820', label: '부동산중개법인' },
  { logNo: '224302878663', label: '병원' },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  for (const post of POSTS) {
    const page = await ctx.newPage();
    try {
      await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=' + post.logNo, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
      await page.waitForTimeout(5000);

      // Get content from mainFrame
      const frames = page.frames();
      let content = '';
      for (const f of frames) {
        try {
          const text = await f.evaluate(() => (document.body.innerText || '')).catch(() => '');
          if (text && text.length > 200) {
            content = text;
            break;
          }
        } catch(e) {}
      }

      if (!content) {
        content = await page.evaluate(() => (document.body.innerText || '')).catch(() => '');
      }

      // Extract meaningful sections
      const lines = content.split('\n').filter(l => l.trim());
      const sections = [];
      let currentSection = '';
      for (const line of lines) {
        const t = line.trim();
        if (t.length > 0) {
          if (t.startsWith('##') || t.startsWith('#') || t.startsWith('■') || t.startsWith('●') || t.startsWith('📊') || t.startsWith('📹') || t.startsWith('🔄') || t.startsWith('🎯') || t.startsWith('📈') || t.startsWith('💡') || t.startsWith('📞') || t.startsWith('🚀') || t.startsWith('✅') || t.startsWith('1.') || t.startsWith('2.') || t.startsWith('3.')) {
            if (currentSection) sections.push(currentSection);
            currentSection = t;
          } else {
            currentSection += ' ' + t;
          }
        }
      }
      if (currentSection) sections.push(currentSection);

      console.log('\n=== ' + post.label + ' (logNo:' + post.logNo + ') ===');
      console.log('본문 길이: ' + content.length + '자');
      console.log('주요 섹션:');
      sections.slice(0, 8).forEach((s, i) => {
        console.log('  [' + i + '] ' + s.substring(0, 120));
      });

    } catch(e) {
      console.log('ERROR ' + post.label + ': ' + (e.message || '').substring(0, 60));
    }
    await page.close();
  }

  await b.close();
})();

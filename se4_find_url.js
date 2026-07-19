const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  // Try multiple URLs for Naver blog editor
  const urls = [
    'https://blog.naver.com/WriteForm.naver?blogId=aicut',
    'https://blog.naver.com/PostList.naver?blogId=aicut',
    'https://blog.naver.com/PostEditor.naver?blogId=aicut&logNo=',
    'https://blog.naver.com/aicut',
  ];

  for (const u of urls) {
    console.log(`\n=== 시도: ${u} ===`);
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`  현재 URL: ${currentUrl}`);

    if (currentUrl.includes('nid.naver.com')) {
      console.log('  ❌ 로그인 필요');
      continue;
    }

    // Check if it's the write page
    const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`  텍스트: ${text.substring(0, 100)}`);

    // Check for SmartEditor
    const hasSE = await page.evaluate(() => {
      try {
        return typeof SmartEditor !== 'undefined';
      } catch(e) {
        return false;
      }
    });
    console.log(`  SmartEditor: ${hasSE}`);

    // Look for 글쓰기 or 새글 buttons
    const buttons = await page.evaluate(() => {
      const items = document.querySelectorAll('a, button, span');
      return Array.from(items)
        .filter(el => el.innerText.includes('글쓰기') || el.innerText.includes('새 글') || el.innerText.includes('작성'))
        .slice(0, 5)
        .map(el => ({ tag: el.tagName, text: el.innerText, href: el.href || '' }));
    });
    if (buttons.length > 0) {
      console.log(`  글쓰기 버튼:`, JSON.stringify(buttons));
    }
  }

  console.log('\n=== 완료 ===');
})();

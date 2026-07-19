const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== 블로키 실시간 키워드 ===\n');

  // 블로키 접속
  await page.goto('https://blokey.co.kr', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log(`URL: ${page.url()}`);

  // 페이지 내용 추출
  const text = await page.evaluate(() => {
    const body = document.body;
    // Try different selectors for keyword data
    const selects = [
      'body', '.container', '.keywords', '.trending', '.hot-keywords',
      '.keyword-list', '[class*="keyword"]', '[class*="trend"]',
      '[class*="hot"]', '[class*="rank"]', 'main', '.content', '.row'
    ];
    
    for (const sel of selects) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 50) {
        return { selector: sel, text: el.innerText.substring(0, 3000) };
      }
    }
    return { selector: 'body', text: body.innerText.substring(0, 3000) };
  });

  console.log(`선택자: ${text.selector}`);
  console.log(`\n${text.text}`);

  // If there's a specific section for trending/hot keywords, scroll to find it
  console.log('\n=== 추가 탐색 ===');
  
  // Check for specific Naver keyword tools sections
  const extra = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    // Find lines with percentage changes, numbers, or keyword patterns
    const hot = lines.filter(l => 
      (l.includes('%') || /^\d+/.test(l) || l.includes('조회')) && 
      !l.includes('copyright') && !l.includes('로그인') && !l.includes('회원')
    ).slice(0, 30);
    return hot;
  });

  if (extra.length > 0) {
    console.log('핫 키워드 후보:');
    extra.forEach(l => console.log(`  ${l}`));
  }

  console.log('\n=== 완료 ===');
})();

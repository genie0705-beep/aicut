const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('1. 포스트 목록 페이지...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { 
    waitUntil: 'domcontentloaded', timeout: 15000 
  });
  await page.waitForTimeout(3000);

  // Click the 글쓰기 button
  console.log('2. 글쓰기 버튼 직접 클릭...');
  try {
    await page.click('a[href*="Redirect=Write"]', { timeout: 10000 });
    await page.waitForTimeout(5000);
    console.log(`   URL: ${page.url()}`);
  } catch(e) {
    console.log('   직접 클릭 실패, JS evaluate로 클릭 시도');
    await page.evaluate(() => {
      const btn = document.querySelector('a[href*="Redirect=Write"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    console.log(`   URL: ${page.url()}`);
  }

  // Handle potential popup/new tab
  const pages = ctx.pages();
  console.log(`   열린 페이지 수: ${pages.length}`);
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    console.log(`   [${i}] ${p.url()}`);
  }

  // Use the last page (might be a new tab)
  const currentPage = pages[pages.length - 1];
  const url = currentPage.url();
  console.log(`   최종 URL: ${url}`);

  if (url.includes('nid.naver.com') || url.includes('login')) {
    console.log('❌ 로그인 필요');
    return;
  }

  // Analyze the page structure
  const info = await currentPage.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    return {
      url: location.href,
      frameCount: frames.length,
      textPreview: document.body.innerText.substring(0, 500),
      frames: Array.from(frames).slice(0, 5).map((f, i) => ({
        i, id: f.id, name: f.name, src: (f.src || '').substring(0, 120)
      }))
    };
  });

  console.log(`\n3. 페이지 구조:`);
  console.log(`   URL: ${info.url}`);
  console.log(`   iframe: ${info.frameCount}개`);
  console.log(`   텍스트: ${info.textPreview.substring(0, 200)}`);
  
  if (info.frames.length > 0) {
    info.frames.forEach(f => console.log(`   [${f.i}] id="${f.id}" src="${f.src}"`));
  }

  // Check for SmartEditor
  const frames = currentPage.frames();
  console.log(`\n4. Playwright 프레임: ${frames.length}개`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const fTitle = await f.evaluate(() => document.title || '');
      const fUrl = f.url();
      const fText = await f.evaluate(() => (document.body?.innerText || '').substring(0, 100));
      const hasSE = await f.evaluate(() => {
        try { return typeof SmartEditor !== 'undefined' || typeof smartEditor !== 'undefined'; } catch(e) { return false; }
      });
      
      if (hasSE || fTitle.includes('smart') || fTitle.includes('editor') || fUrl.includes('editor')) {
        console.log(`   [${i}] ✅ SE 발견! title="${fTitle}" SmartEditor=${hasSE}`);
        console.log(`       text: ${fText}`);
      } else if (fText.length > 0) {
        console.log(`   [${i}] title="${fTitle}" text="${fText}"`);
      } else {
        console.log(`   [${i}] title="${fTitle}" url="${fUrl.substring(0,80)}"`);
      }
    } catch(e) {
      console.log(`   [${i}] cross-origin`);
    }
  }

  console.log('\n=== 분석 완료 ===');
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  // 기존 탭 정리 (새 탭만 사용)
  const existingPages = ctx.pages();
  for (const p of existingPages) {
    try {
      const url = p.url();
      if (!url.includes('nid.naver.com') && url !== 'about:blank') {
        // Keep Naver login session alive, close rest
      }
    } catch(e) {}
  }

  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== SE4 에디터 재시도 ===\n');

  // 1) 블로그 메인 접속 후 글쓰기 버튼 찾기
  console.log('1. 블로그 메인 접속...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);

  if (page.url().includes('nid.naver.com')) {
    console.log('❌ 로그인 필요');
    return;
  }

  // 2) 모든 a 태그에서 글쓰기 찾아 href 추출
  console.log('2. 글쓰기 링크 탐색...');
  const links = await page.evaluate(() => {
    const all = document.querySelectorAll('a');
    return Array.from(all)
      .filter(a => a.innerText.trim() === '글쓰기' && a.href)
      .map(a => ({ text: a.innerText, href: a.href }));
  });
  console.log(`   글쓰기 링크: ${JSON.stringify(links)}`);

  if (links.length > 0) {
    // 직접 href로 이동
    const writeUrl = links[0].href;
    console.log(`   이동: ${writeUrl}`);
    
    // 새 페이지에서 열리거나 현재 페이지에서 리다이렉트 될 수 있음
    await page.goto(writeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    console.log(`   현재 URL: ${page.url()}`);
    
    // 만약 Redirect=Write 파라미터면, 리다이렉트 결과가 에디터인지 확인
    const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`   페이지 내용: ${text.substring(0, 150)}`);
    
    // iframe 확인
    const frames = page.frames();
    console.log(`   프레임 수: ${frames.length}`);
    
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      try {
        const fTitle = await f.evaluate(() => document.title || '');
        const hasSE = await f.evaluate(() => {
          try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
        });
        if (hasSE) {
          console.log(`   ✅ [${i}] SmartEditor 발견! title="${fTitle}"`);
          
          // Try to check editors
          const edInfo = await f.evaluate(() => {
            const se = SmartEditor;
            return {
              hasEditors: !!se._editors,
              editorKeys: se._editors ? Object.keys(se._editors) : [],
              documentTitle: se._editors && se._editors['blogpc001'] ? se._editors['blogpc001'].getTitle() : 'N/A'
            };
          });
          console.log(`   에디터 정보:`, JSON.stringify(edInfo));
        }
      } catch(e) {}
    }
  }

  // 3) Redirect=Write 직접 시도 (팝업으로 열릴 수 있음)
  console.log('\n3. Redirect=Write 직접 이동 시도...');
  
  // Wait for popup
  const [newPage] = await Promise.all([
    ctx.waitForEvent('page', { timeout: 10000 }).catch(() => null),
    page.evaluate(() => {
      window.open('https://blog.naver.com/aicut?Redirect=Write', '_blank');
    })
  ]);
  
  if (newPage) {
    await newPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await newPage.waitForTimeout(3000);
    console.log(`   새 탭 URL: ${newPage.url()}`);
    
    const newFrames = newPage.frames();
    for (let i = 0; i < newFrames.length; i++) {
      const f = newFrames[i];
      try {
        const hasSE = await f.evaluate(() => {
          try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
        });
        if (hasSE) {
          console.log(`   ✅ 새탭 프레임[${i}] SmartEditor 발견!`);
          
          const edInfo = await f.evaluate(() => {
            const se = SmartEditor;
            return {
              hasEditors: !!se._editors,
              editorKeys: se._editors ? Object.keys(se._editors) : []
            };
          });
          console.log(`   ${JSON.stringify(edInfo)}`);
        }
      } catch(e) {}
    }
  } else {
    console.log('   새 탭이 열리지 않음');
  }

  console.log('\n=== 분석 완료 ===');
})();

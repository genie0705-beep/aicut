const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  // Fresh page
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== SE4 에디터 직접 접근 ===\n');

  // 네이버 메인에서 블로그 이동 (로그인 세션 유지)
  console.log('1. 블로그 포스트 목록...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'networkidle', timeout: 20000
  });
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log(`   URL: ${currentUrl}`);

  if (currentUrl.includes('nid.naver.com')) {
    console.log('❌ 로그인 필요');
    return;
  }

  // 글쓰기 버튼 찾아서 클릭 (navigation 이벤트 대기)
  console.log('2. 글쓰기 버튼 클릭 (navigation 대기)...');
  
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => ({ error: e.message })),
      page.click('a[href*="Redirect=Write"]', { timeout: 10000 })
    ]);
    await page.waitForTimeout(3000);
    console.log(`   이동 후 URL: ${page.url()}`);
  } catch(e) {
    console.log(`   navigation 실패: ${e.message}`);
    console.log('   JS 클릭 시도...');
    await page.evaluate(() => {
      const btn = document.querySelector('a[href*="Redirect=Write"]');
      if (btn) { btn.click(); }
    });
    await page.waitForTimeout(5000);
    console.log(`   현재 URL: ${page.url()}`);
  }

  // 페이지 내용 확인
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  const hasSE = await page.evaluate(() => {
    try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
  });
  
  console.log(`   SmartEditor: ${hasSE}`);
  console.log(`   내용: ${bodyText.substring(0, 150)}`);

  // iframe 확인
  const frames = page.frames();
  console.log(`\n3. 프레임 검사 (${frames.length}개)...`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const fTitle = await f.evaluate(() => document.title || '');
      const fUrl = f.url();
      const hasSE = await f.evaluate(() => {
        try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
      });
      const fText = await f.evaluate(() => (document.body?.innerText || '').substring(0, 80));
      
      if (hasSE || fUrl.includes('smart') || fTitle.includes('SE') || fTitle.includes('editor') || fTitle.includes('스마트') || fTitle.includes('글쓰기')) {
        console.log(`   [${i}] ✅ 발견! SE=${hasSE} title="${fTitle}"`);
        console.log(`       url: ${fUrl.substring(0, 100)}`);
        console.log(`       text: ${fText}`);
      }
    } catch(e) {
      // cross-origin
    }
  }

  // 글쓰기 후 새 탭/팝업이 열렸는지 확인
  const allPages = ctx.pages();
  console.log(`\n4. 전체 탭: ${allPages.length}개`);
  for (let i = 0; i < allPages.length; i++) {
    const p = allPages[i];
    const url = p.url();
    try {
      const hasSE = await p.evaluate(() => {
        try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
      });
      if (hasSE || url.includes('write') || url.includes('Write') || url.includes('editor') || url.includes('Editor')) {
        console.log(`   [${i}] ✅ ${url.substring(0, 100)} — SmartEditor=${hasSE}`);
        
        // Try to set content in this page
        const frames = p.frames();
        for (const f of frames) {
          try {
            const hasSE2 = await f.evaluate(() => {
              try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
            });
            if (hasSE2) {
              console.log(`       → 프레임 내 SE4 발견! 본문 입력 시도...`);
              
              // Set title
              await f.evaluate(() => {
                SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
              });
              console.log('       ✅ 제목 설정');
              
              // Set body
              const html = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
              const result = await f.evaluate((html) => {
                try {
                  const ed = SmartEditor._editors['blogpc001'];
                  const data = ed.getDocumentData();
                  
                  const blocks = [];
                  const pRegex = /<p[^>]*>([^<]*)<\/p>/g;
                  let m;
                  while ((m = pRegex.exec(html)) !== null) {
                    const t = m[1].trim();
                    if (t && t.length > 0) {
                      blocks.push({ type: 'paragraph', text: t.replace(/<[^>]+>/g, ''), style: { textAlign: 'center' } });
                    }
                  }
                  
                  data.document.blocks = blocks.slice(0, 80);
                  ed.setDocumentData(data);
                  
                  const canvas = document.querySelector('.se-canvas');
                  if (canvas) {
                    canvas.innerHTML = blocks.slice(0, 80).map(b => `<p style="text-align:center">${b.text}</p>`).join('');
                    canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
                  }
                  
                  return { status: 'ok', blocks: blocks.length, textLength: ed.getContentText().length };
                } catch(e) {
                  return { status: 'error', message: e.message };
                }
              }, html);
              console.log(`       ${JSON.stringify(result)}`);
            }
          } catch(e) {}
        }
      }
    } catch(e) {}
  }

  console.log('\n=== 완료 ===');
})();

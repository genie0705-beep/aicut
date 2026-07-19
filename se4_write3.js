const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('1. 포스트 목록 → 글쓰기 클릭...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { 
    waitUntil: 'domcontentloaded', timeout: 15000 
  });
  await page.waitForTimeout(3000);

  // Direct navigation to write form
  await page.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);

  const editorUrl = page.url();
  console.log(`에디터 URL: ${editorUrl}`);

  if (editorUrl.includes('nid.naver.com') || editorUrl.includes('login')) {
    console.log('❌ 로그인 필요 — 브라우저에서 수동 로그인 후 재실행 필요');
    return;
  }

  // 페이지 분석
  const info = await page.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    const hasSE = typeof SmartEditor !== 'undefined';
    const text = document.body.innerText.substring(0, 500);
    return {
      frameCount: frames.length,
      hasSmartEditor: hasSE,
      textPreview: text.substring(0, 200),
      frames: Array.from(frames).slice(0, 5).map((f, i) => ({
        i, id: f.id, name: f.name, src: (f.src || '').substring(0, 120)
      }))
    };
  });

  console.log(`프레임: ${info.frameCount}개, SmartEditor: ${info.hasSmartEditor}`);

  // Check all Playwright frames for SmartEditor
  const frames = page.frames();
  console.log(`Playwright 프레임: ${frames.length}개`);
  
  let seFound = false;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const fTitle = await f.evaluate(() => document.title || '');
      const hasSE = await f.evaluate(() => {
        try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
      });
      
      if (hasSE) {
        console.log(`\n✅ SE4 에디터 발견! 프레임[${i}] title="${fTitle}"`);
        seFound = true;

        // 제목 설정
        const titleResult = await f.evaluate(() => {
          try {
            const ed = SmartEditor._editors['blogpc001'];
            if (!ed) return { error: 'blogpc001 not found', keys: Object.keys(SmartEditor._editors || {}) };
            ed.setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
            return { status: 'ok', title: ed.getTitle() };
          } catch(e) {
            return { error: e.message };
          }
        });
        console.log(`  제목: ${JSON.stringify(titleResult)}`);

        // 본문 입력
        const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
        
        const bodyResult = await f.evaluate((html) => {
          try {
            const ed = SmartEditor._editors['blogpc001'];
            const data = ed.getDocumentData();
            
            // Parse paragraphs
            const blocks = [];
            const pHtml = html.match(/<p[^>]*>([^<]*)<\/p>/g) || [];
            for (const p of pHtml.slice(0, 80)) {
              const text = p.replace(/<[^>]+>/g, '').trim();
              if (text) {
                blocks.push({ type: 'paragraph', text, style: { textAlign: 'center' } });
              }
            }
            
            data.document.blocks = blocks;
            ed.setDocumentData(data);
            
            const canvas = document.querySelector('.se-canvas');
            if (canvas) {
              canvas.innerHTML = blocks.map(b => 
                `<p style="text-align:center">${b.text}</p>`
              ).join('');
              canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
            }
            
            return { status: 'ok', blockCount: blocks.length };
          } catch(e) {
            return { status: 'error', message: e.message };
          }
        }, htmlContent);
        
        console.log(`  본문: ${JSON.stringify(bodyResult)}`);
        
        // 본문 길이 확인
        const len = await f.evaluate(() => {
          try {
            return SmartEditor._editors['blogpc001'].getContentText().length;
          } catch(e) { return -1; }
        });
        console.log(`  본문 길이: ${len}자`);
        
        break;
      }
    } catch(e) {
      // cross-origin
    }
  }

  if (!seFound) {
    console.log('\n⚠️ SE4 에디터를 찾지 못했습니다.');
    console.log('에디터 페이지가 다른 URL로 변경되었을 수 있습니다.');
    console.log(`현재 URL: ${page.url()}`);
  }

  console.log('\n✅ 완료 — 브라우저에서 확인 후 저장 부탁드립니다.');
})();

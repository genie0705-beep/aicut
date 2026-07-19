const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('1. 포스트 목록 페이지에서 글쓰기 클릭...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { 
    waitUntil: 'domcontentloaded', timeout: 15000 
  });
  await page.waitForTimeout(3000);

  // 글쓰기 버튼 찾아서 클릭
  const writeBtn = await page.$('a[href*="Redirect=Write"]');
  if (!writeBtn) {
    console.log('글쓰기 버튼 못 찾음, 텍스트로 검색');
    // Try text search method
    const btns = await page.$$('a, button');
    for (const btn of btns) {
      const text = await btn.innerText();
      if (text.includes('글쓰기') && !text.includes('댓글')) {
        const href = await btn.getAttribute('href');
        if (href) {
          console.log(`찾음: href="${href}"`);
          await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(5000);
          break;
        }
      }
    }
  } else {
    const href = await writeBtn.getAttribute('href');
    console.log(`글쓰기 href: ${href}`);
    await page.goto('https://blog.naver.com' + href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
  }

  const editorUrl = page.url();
  console.log(`에디터 URL: ${editorUrl}`);

  if (editorUrl.includes('nid.naver.com') || editorUrl.includes('login')) {
    console.log('❌ 로그인 필요');
    return;
  }

  // 페이지 내용 확인
  const info = await page.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    const hasSE = typeof SmartEditor !== 'undefined';
    const text = document.body.innerText.substring(0, 500);
    return {
      url: location.href,
      frameCount: frames.length,
      hasSmartEditor: hasSE,
      textPreview: text.substring(0, 200),
      frames: Array.from(frames).slice(0, 3).map((f, i) => ({
        i, id: f.id, name: f.name, src: (f.src || '').substring(0, 120)
      }))
    };
  });

  console.log(`프레임: ${info.frameCount}개, SmartEditor: ${info.hasSmartEditor}`);
  console.log(`미리보기: ${info.textPreview}`);

  if (info.frameCount > 0) {
    info.frames.forEach(f => console.log(`  [${f.i}] id="${f.id}" src="${f.src}"`));
  }

  // Try detecting the actual editor iframe
  const frames = page.frames();
  console.log(`\nPlaywright 프레임: ${frames.length}개`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const fTitle = await f.evaluate(() => document.title || '');
      const fUrl = f.url();
      const hasSE = await f.evaluate(() => {
        try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
      });
      
      if (hasSE || fTitle.includes('SE') || fTitle.includes('smart')) {
        console.log(`\n✅ SE4 에디터 발견! 프레임[${i}]`);
        console.log(`  title: ${fTitle}`);
        
        // Set title
        await f.evaluate(() => {
          SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
        });
        console.log('  ✅ 제목 설정');

        // Read HTML and set content
        const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
        
        const result = await f.evaluate((html) => {
          try {
            const ed = SmartEditor._editors['blogpc001'];
            const data = ed.getDocumentData();
            
            // Parse blocks from HTML
            const blocks = [];
            const pRegex = /<p[^>]*>([^<]*)<\/p>/g;
            let m;
            const pTexts = [];
            while ((m = pRegex.exec(html)) !== null) {
              const t = m[1].trim();
              if (t && t.length > 0) pTexts.push(t);
            }
            
            // Simplified: create paragraph blocks from extracted text
            for (const t of pTexts.slice(0, 100)) {
              blocks.push({ type: 'paragraph', text: t, style: { textAlign: 'center' } });
            }
            
            data.document.blocks = blocks;
            ed.setDocumentData(data);
            
            // Build canvas HTML
            const canvas = document.querySelector('.se-canvas');
            if (canvas) {
              let innerHTML = '';
              for (const b of blocks) {
                innerHTML += `<p style="text-align:center">${b.text}</p>`;
              }
              canvas.innerHTML = innerHTML;
              canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
            }
            
            return { status: 'ok', blockCount: blocks.length };
          } catch(e) {
            return { status: 'error', message: e.message };
          }
        }, fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8'));
        
        console.log(`  본문 입력: ${JSON.stringify(result)}`);
        
        // Verify
        const textLen = await f.evaluate(() => {
          try {
            return SmartEditor._editors['blogpc001'].getContentText().length;
          } catch(e) { return -1; }
        });
        console.log(`  본문 길이: ${textLen}자`);
        
        break;
      }
    } catch(e) {
      // skip cross-origin
    }
  }

  console.log('\n✅ SE4 자동화 완료');
  console.log('정이사님, 브라우저에서 확인 후 저장·발행 부탁드립니다!');
})();

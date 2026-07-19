const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  // 블로그 메인에서 글쓰기 버튼 클릭
  console.log('1. 블로그 메인으로 이동...');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // 글쓰기 버튼 클릭
  console.log('2. 글쓰기 버튼 클릭...');
  await page.click('a[href*="Redirect=Write"], a:has-text("글쓰기")');
  await page.waitForTimeout(5000);
  
  const editorUrl = page.url();
  console.log(`   에디터 URL: ${editorUrl}`);

  if (editorUrl.includes('nid.naver.com') || editorUrl.includes('login')) {
    console.log('❌ 로그인 필요');
    return;
  }

  // 에디터 페이지 분석
  console.log('3. 에디터 페이지 분석...');
  const editorInfo = await page.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    const hasSE = typeof SmartEditor !== 'undefined';
    const editorEls = document.querySelector('.se-editor, .se-canvas, [class*="smart"]');
    const titleInput = document.querySelector('#title, [name="title"], [class*="title"], input[placeholder*="제목"]');
    
    return {
      url: location.href,
      frameCount: frames.length,
      hasSmartEditor: hasSE,
      hasEditorElements: !!editorEls,
      titleInput: titleInput ? { tag: titleInput.tagName, id: titleInput.id } : null,
      frames: Array.from(frames).map((f, i) => ({
        i, id: f.id, name: f.name, src: (f.src || '').substring(0, 120)
      }))
    };
  });

  console.log(`   URL: ${editorInfo.url}`);
  console.log(`   iframe 수: ${editorInfo.frameCount}`);
  console.log(`   SmartEditor: ${editorInfo.hasSmartEditor}`);
  console.log(`   제목 입력: ${JSON.stringify(editorInfo.titleInput)}`);

  // If there's a title input, set the title
  if (editorInfo.titleInput) {
    await page.fill(editorInfo.titleInput.tag === 'INPUT' ? '#title, [name="title"]' : '.title-input', 
      '제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
    console.log('   ✅ 제목 입력됨');
    await page.waitForTimeout(1000);
  }

  // If there are iframes, check them
  if (editorInfo.frameCount > 0) {
    const frames = page.frames();
    console.log(`\n   프레임 확인 (${frames.length}개):`);
    
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      try {
        const fTitle = await f.evaluate(() => document.title || '');
        const fUrl = f.url();
        const hasSE = await f.evaluate(() => {
          try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
        });
        if (hasSE || fTitle.includes('SE') || fTitle.includes('에디터') || fTitle.includes('smart')) {
          console.log(`   [${i}] SE4 에디터 발견! title="${fTitle}" SmartEditor=${hasSE}`);
          
          // Try to set title via SE4 API
          const result = await f.evaluate(() => {
            try {
              const ed = SmartEditor._editors;
              const keys = Object.keys(ed);
              return { editors: keys, firstEditor: keys[0] };
            } catch(e) {
              return { error: e.message };
            }
          });
          console.log(`   에디터 정보:`, JSON.stringify(result));
        }
      } catch(e) {}
    }
  }

  // 본문 내용 읽기
  const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');

  // SE4 iframe 찾기 시도 (모든 프레임 확인)
  const frames = page.frames();
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const hasSE = await f.evaluate(() => {
        try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
      });
      
      if (hasSE) {
        console.log(`\n4. SE4 에디터 프레임[${i}]에서 본문 입력...`);
        
        // 제목 설정
        await f.evaluate(() => {
          SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
        });
        console.log('   ✅ 제목 설정 완료');
        
        // 본문 블록 구성
        const result = await f.evaluate((html) => {
          try {
            const ed = SmartEditor._editors['blogpc001'];
            const data = ed.getDocumentData();
            
            // HTML에서 블록 파싱
            const blocks = [];
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const children = doc.body.children;
            
            for (const el of children) {
              if (el.tagName === 'P' && el.textContent.trim()) {
                blocks.push({
                  type: 'paragraph',
                  text: el.textContent.trim().replace(/<strong>/g, '').replace(/<\/strong>/g, ''),
                  style: { textAlign: 'center' }
                });
              } else if (el.tagName.match(/^H[23]$/) && el.textContent.trim()) {
                blocks.push({
                  type: 'heading' + el.tagName.slice(-1),
                  text: el.textContent.trim(),
                  style: { textAlign: 'center' }
                });
              }
            }
            
            // 제한: SE4가 너무 많은 블록을 처리 못할 수 있음
            const limited = blocks.slice(0, 50);
            data.document.blocks = limited;
            ed.setDocumentData(data);
            
            // canvas 업데이트
            const canvas = document.querySelector('.se-canvas');
            if (canvas) {
              let innerHTML = '';
              for (const b of limited) {
                const tag = b.type === 'paragraph' ? 'p' : b.type;
                innerHTML += `<${tag} style="text-align:center">${b.text}</${tag}>`;
              }
              canvas.innerHTML = innerHTML;
              canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
            }
            
            return { status: 'ok', blockCount: limited.length };
          } catch(e) {
            return { status: 'error', message: e.message };
          }
        }, htmlContent);
        
        console.log(`   결과:`, JSON.stringify(result));
        break;
      }
    } catch(e) {
      // Cross-origin
    }
  }

  console.log('\n✅ 완료');
  console.log('현재 페이지는 에디터 상태. 정이사님이 확인 후 저장/발행해주세요.');
})();

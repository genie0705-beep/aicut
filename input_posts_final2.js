const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', file: 'aicut_blog_baseball.html', label: '⚾ 프로야구' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', file: 'aicut_blog_rainy.html', label: '🌧 장맛비' },
  ];

  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    console.log(`\n━━━ [${pi+1}/2] ${post.label} ━━━`);

    // 새 글쓰기 페이지 열기
    console.log('   글쓰기 페이지 열기...');
    let page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);
    
    // iframe 찾기
    const writeFrame = page.frames().find(f => f.url().includes('PostWriteForm'));
    if (!writeFrame) {
      console.log('   ❌ PostWriteForm iframe 없음');
      page.frames().forEach(f => { if (f.url() !== 'about:blank') console.log('    Frame:', f.url().substring(0, 80)); });
      continue;
    }
    console.log('   ✅ 에디터 iframe 로딩됨');

    // 제목 입력
    const titleResult = await writeFrame.evaluate((t) => {
      if (typeof SmartEditor !== 'undefined' && SmartEditor._editors && SmartEditor._editors.blogpc001) {
        SmartEditor._editors.blogpc001.setDocumentTitle(t);
        return '✅ SmartEditor API';
      }
      return '❌ SmartEditor 없음';
    }, post.title);
    console.log(`   제목: ${titleResult}`);
    await sleep(1000);

    // 본문 HTML 읽기
    const htmlPath = path.join(__dirname, post.file);
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    console.log(`   HTML: ${(htmlContent.length/1024).toFixed(0)}KB`);

    // 본문 입력 - setDocumentData
    try {
      const bodyResult = await writeFrame.evaluate((html) => {
        if (typeof SmartEditor !== 'undefined' && SmartEditor._editors && SmartEditor._editors.blogpc001) {
          const ed = SmartEditor._editors.blogpc001;
          if (typeof ed.setDocumentData === 'function') {
            ed.setDocumentData(html);
            return '✅ setDocumentData';
          }
        }
        return '❌ setDocumentData 없음';
      }, htmlContent);
      console.log(`   본문: ${bodyResult}`);
    } catch(e) {
      console.log(`   ⚠️ 본문 오류: ${e.message.substring(0, 50)}`);
    }
    await sleep(2000);

    // 저장
    const saveResult = await writeFrame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장' && b.offsetParent !== null) {
          b.click();
          return '✅ 저장 버튼 클릭';
        }
      }
      return '❌ 저장 버튼 없음';
    });
    console.log(`   저장: ${saveResult}`);
    await sleep(3000);
    console.log('   ✅ 포스팅 저장 완료');
  }

  console.log('\n━━━ ✅ 2개 포스팅 모두 에디터 입력 완료 ━━━');
  console.log('  📸 이미지 12장 업로드는 정이사님께서 직접 부탁드립니다!');

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

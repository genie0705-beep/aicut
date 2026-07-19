const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

function extractText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h2[^>]*>/gi, '\n')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/✅/g, '')
    .trim();
}

(async () => {
  console.log('=== 블로그 2개 포스팅 재작성 + 이미지 업로드 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { 
      title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', 
      file: 'aicut_blog_baseball.html', 
      imgPrefix: 'aicut_blog_baseball',
      imgCount: 6,
      label: '⚾ 프로야구' 
    },
    { 
      title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', 
      file: 'aicut_blog_rainy.html', 
      imgPrefix: 'aicut_blog_rainy',
      imgCount: 6,
      label: '🌧 장맛비' 
    },
  ];

  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    console.log(`\n━━━ [${pi+1}/2] ${post.label} ━━━`);

    // 에디터 탭 열기
    console.log('   에디터 열기...');
    const page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);

    const f = page.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) { console.log('   ❌ 에디터 iframe 없음'); continue; }
    console.log('   ✅ 에디터 로딩됨');

    // ====================================
    // 1. 제목 입력
    // ====================================
    console.log('   [1/3] 제목 타이핑...');
    await f.evaluate((t) => {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
    }, post.title);
    console.log('   ✅ 제목 완료');
    await sleep(500);

    // ====================================
    // 2. 본문 타이핑 (사람처럼 한 글자씩)
    // ====================================
    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');
    const plainText = extractText(htmlContent);
    const textLines = plainText.split('\n').filter(l => l.trim());
    console.log(`   [2/3] 본문 ${textLines.length}줄 타이핑 중...`);

    // document body 클릭으로 포커스
    await page.evaluate(() => document.body.click());
    await sleep(500);

    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      if (!line.trim()) continue;
      await page.keyboard.type(line, { delay: 3 });
      await page.keyboard.press('Enter');

      if ((i + 1) % 30 === 0) {
        console.log(`      ${i+1}/${textLines.length}줄`);
      }
    }
    console.log(`   ✅ 본문 ${textLines.length}줄 타이핑 완료`);
    await sleep(2000);

    // ====================================
    // 3. 이미지 업로드
    // ====================================
    console.log(`   [3/3] 이미지 ${post.imgCount}장 업로드 중...`);

    for (let imgIdx = 0; imgIdx < post.imgCount; imgIdx++) {
      const num = String(imgIdx + 1).padStart(2, '0');
      const imgFile = `${post.imgPrefix}_${num}.png`;
      const imgPath = path.join(__dirname, imgFile);

      if (!fs.existsSync(imgPath)) {
        console.log(`      ❌ ${imgFile} 없음`);
        continue;
      }

      // "사진" 버튼 클릭
      await f.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim() === '사진') {
            b.click();
            return;
          }
        }
      });
      await sleep(2000);

      // file input 찾아서 파일 첨부
      const fileInput = await f.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(imgPath);
        console.log(`      📸 ${imgFile} 업로드 중...`);
        await sleep(3000);
      } else {
        console.log(`      ⚠️ ${imgFile} - 파일입력창 없음`);
      }
    }

    // ====================================
    // 4. 저장
    // ====================================
    console.log('   저장...');
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return; }
      }
    });
    await sleep(3000);
    console.log('   ✅ 포스팅 저장 완료');
  }

  console.log('\n━━━ ✅ 2개 포스팅 모두 작성 + 이미지 등록 완료 ━━━');
  console.log('   발행 + 서치어드바이저 수동 수집 요청 확인해주세요!');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

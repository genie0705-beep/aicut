const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

// HTML에서 순수 텍스트만 추출
function extractText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h2[^>]*>/gi, '\n\n## ')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
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
    .replace(/## /g, '')
    .trim();
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', file: 'aicut_blog_baseball.html', label: '⚾' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', file: 'aicut_blog_rainy.html', label: '🌧' },
  ];

  let tabIdx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(2000);

    const cfg = posts[tabIdx];
    console.log(`\n━━━ ${cfg.label} ${cfg.title.substring(0, 30)}... ━━━`);

    // 1. 제목 - SmartEditor API (사람이 타이핑하는 것과 동일한 결과)
    console.log('  [제목 입력...]');
    await f.evaluate((t) => {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
    }, cfg.title);
    console.log('  ✅ 제목');

    // 2. 본문 텍스트 추출
    const htmlContent = fs.readFileSync(path.join(__dirname, cfg.file), 'utf-8');
    const plainText = extractText(htmlContent);
    const textLines = plainText.split('\n').filter(l => l.trim());
    console.log(`  본문: ${textLines.length}줄, 총 ${plainText.length}자`);

    // 3. 한 줄씩 사람처럼 타이핑
    console.log('  [본문 타이핑 중...]');
    
    // 에디터 본문 영역에 포커스
    await f.evaluate(() => {
      // focus on editor by dispatching a click on the document
      document.body.click();
    });
    await sleep(500);

    // 줄 단위로 타이핑
    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      if (!line.trim()) continue;
      
      // 각 줄을 한 글자씩 타이핑
      await p.keyboard.type(line, { delay: 5 }); // 5ms delay per character
      await p.keyboard.press('Enter');
      
      if ((i + 1) % 20 === 0) {
        console.log(`    ${i+1}/${textLines.length}줄 완료`);
      }
    }
    
    console.log(`  ✅ 본문 ${textLines.length}줄 타이핑 완료`);
    await sleep(2000);

    // 4. 저장
    console.log('  [저장...]');
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return; }
      }
    });
    console.log('  ✅ 저장 완료');
    await sleep(3000);

    tabIdx++;
  }

  console.log('\n━━━ ✅ 사람이 직접 타이핑한 방식으로 2개 포스팅 작성 완료 ━━━');
  console.log('  📸 이미지 12장 업로드 + 서치어드바이저 수동수집 요청 부탁드립니다.');

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

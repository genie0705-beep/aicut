const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { await b.close(); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  // 체크리스트
  const result = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    const text = w ? w.innerText : '';
    const html = w ? w.innerHTML : '';
    const imgs = document.querySelectorAll('.se-components-wrap img').length;
    const titleEl = document.querySelector('.se-documentTitle');
    const title = titleEl ? titleEl.innerText.trim() : '';
    
    // 문단별 정렬 상태 확인
    const paras = w ? w.querySelectorAll('.se-text-paragraph') : [];
    let centerCount = 0, leftCount = 0;
    paras.forEach(p => {
      const align = p.className || '';
      if (align.includes('center') || align.includes('가운데')) centerCount++;
      else leftCount++;
    });
    
    // 줄길이 체크 (모바일 최적화: 2~3줄 이내)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    let longLines = 0;
    lines.forEach(line => {
      if (line.length > 50) longLines++; // 50자 넘으면 모바일에서 긴 줄
    });
    
    return {
      title,
      textLength: text.length,
      lineCount: lines.length,
      longLines,
      imageCount: imgs,
      centerAlignCount: centerCount,
      leftAlignCount: leftCount,
      hasContent: text.length > 200,
      containsFreelancer: text.includes('프리랜서'),
      containsCleint: text.includes('클린트'),
      containsAicut: text.includes('에이컷'),
      containsCta: text.includes('카카오톡') || text.includes('contact@'),
      textPreview: text.substring(80, 250)
    };
  });
  
  console.log('=== 블로그 체크리스트 ===');
  console.log(JSON.stringify(result, null, 2));
  
  // 태그 확인
  const tagInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('태그')) {
        return { hasTags: inp.value.length > 0, tagCount: inp.value.split('#').length - 1, preview: inp.value.substring(0, 100) };
      }
    }
    return { hasTags: false };
  });
  console.log('\n=== 해시태그 ===');
  console.log(JSON.stringify(tagInfo));
  
  // 전체 텍스트 출력
  const fullText = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    return w ? w.innerText : '';
  });
  console.log('\n=== 전체 본문 ===');
  console.log(fullText);
  
  await page.screenshot({ path: 'recheck_editor.png' });
  await b.close();
})();

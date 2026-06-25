const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  const result = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    if (!w) return { error: 'no content' };
    
    const text = w.innerText;
    const html = w.innerHTML;
    const imgs = w.querySelectorAll('img').length;
    
    // 제목
    const titleEl = document.querySelector('.se-documentTitle');
    const title = titleEl ? titleEl.innerText.trim() : '';
    
    // 문단 정보 (리치 텍스트 구조)
    const paras = w.querySelectorAll('.se-text-paragraph');
    const paraCount = paras.length;
    
    // H2/H3 태그 확인
    const h2Count = (html.match(/<h2/gi) || []).length;
    const h3Count = (html.match(/<h3/gi) || []).length;
    
    // Strong/bold 확인
    const strongCount = (html.match(/<strong/gi) || []).length;
    
    // 표 확인
    const tableCount = (html.match(/<table/gi) || []).length;
    
    // 정렬 확인
    let centerCount = 0;
    paras.forEach(p => { if (p.style.textAlign === 'center') centerCount++; });
    
    // 모바일 줄길이: 50자 넘는 줄
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const longLines = lines.filter(l => l.length > 50).length;
    const avgLineLen = Math.round(lines.reduce((s, l) => s + l.length, 0) / lines.length);
    
    // 키워드 등장 횟수
    const keywordCounts = {
      aicut: (text.match(/에이컷/gi) || []).length,
      edit: (text.match(/편집/gi) || []).length,
      freelance: (text.match(/프리랜서/gi) || []).length,
      cleint: (text.match(/클린트/gi) || []).length,
      season: (text.match(/여름/gi) || []).length,
      ai: (text.match(/AI/gi) || []).length,
    };
    
    // CTA 포함
    const hasCta = text.includes('카카오톡') || text.includes('contact@');
    
    // 해시태그 확인
    let tagCount = 0;
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.placeholder === '태그 입력 (최대 30개)') {
        tagCount = inp.value.split('#').length - 1;
      }
    }
    
    return {
      title,
      textLength: text.length,
      paraCount,
      imgCount: imgs,
      h2Count,
      h3Count,
      strongCount,
      tableCount,
      centerAlign: centerCount + '/' + paraCount,
      longLines,
      avgLineLen,
      keywordCounts,
      hasCta,
      tagCount,
      preview: text.substring(0, 150)
    };
  });
  
  console.log('=== 현재 블로그 상태 ===');
  console.log(JSON.stringify(result, null, 2));
  
  await page.screenshot({ path: 'md_check.png' });
  await b.close();
})();

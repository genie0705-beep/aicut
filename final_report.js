const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 불필요한 write 탭 닫기 (탭 0만 남김)
  const toClose = [];
  pages.forEach((p, i) => {
    if (p.url().includes('Redirect=Write') && i !== 0) {
      toClose.push(i);
    }
  });
  
  for (const idx of toClose.reverse()) {
    try {
      await pages[idx].close();
      console.log(`탭 ${idx} 닫음`);
    } catch(e) { /* ignore */ }
  }
  
  // 탭 0 최종 확인
  const p = pages[0];
  const fe = await p.$('#mainFrame');
  const f = await fe.contentFrame();
  
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const d = data.document;
    const canvas = document.querySelector('.se-canvas');
    
    const result = { title: ed.getDocumentTitle() };
    
    // blocks
    if (d.blocks && Array.isArray(d.blocks)) {
      const b = d.blocks;
      result.totalBlocks = b.length;
      const counts = {};
      b.forEach(bl => { counts[bl.type] = (counts[bl.type]||0)+1; });
      result.types = counts;
      let chars = 0;
      let strongs = 0;
      b.forEach(bl => { 
        if (bl.text) {
          chars += bl.text.length;
          if (typeof bl.text === 'string') {
            strongs += (bl.text.match(/<b>/g) || []).length;
          }
        }
      });
      result.totalChars = chars;
      result.strongTags = strongs;
      
      // 해시태그 확인
      const lastBlock = b[b.length - 1];
      const hashCount = (lastBlock.text || '').match(/#/g);
      result.hashTags = hashCount ? hashCount.length : 0;
      
      // CTA 확인
      const allText = b.map(bl => bl.text || '').join(' ');
      result.hasKakao = allText.includes('pf.kakao.com');
      result.hasEmail = allText.includes('master@aicut.co.kr');
      result.hasHomepage = allText.includes('aicut.co.kr');
    }
    
    // images
    result.images = d.components ? d.components.filter(c => c.fileName).length : 0;
    result.imageDetails = d.components
      .filter(c => c.fileName)
      .map(c => ({ file: c.fileName, w: c.width, h: c.height, rep: c.represent }));
    
    return result;
  });
  
  console.log('📋 최종 블로그 상태:');
  console.log(JSON.stringify(final, null, 2));
  
  // 체크리스트
  const checks = [];
  checks.push(`📌 제목: ${final.title}`);
  checks.push(`📝 본문: ${final.totalBlocks}블록 / ${final.totalChars}자`);
  checks.push(`   H2: ${final.types?.heading2 || 0}개`);
  checks.push(`   Strong: ${final.strongTags}개`);
  checks.push(`   해시태그: ${final.hashTags}개`);
  checks.push(`   CTA(카톡): ${final.hasKakao ? '✅' : '❌'}`);
  checks.push(`   CTA(메일): ${final.hasEmail ? '✅' : '❌'}`);
  checks.push(`   CTA(홈페이지): ${final.hasHomepage ? '✅' : '❌'}`);
  checks.push(`🖼️ 이미지: ${final.images}장`);
  final.imageDetails?.forEach(img => {
    checks.push(`   ${img.file} (${img.w}×${img.h})${img.rep ? ' ★대표' : ''}`);
  });
  
  console.log('\n' + checks.join('\n'));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

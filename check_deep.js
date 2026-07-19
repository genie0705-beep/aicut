const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const p = b.contexts()[0].pages()[0];
  const f = await (await p.$('#mainFrame')).contentFrame();

  const html = await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return 'canvas 없음';
    
    // 내부 HTML 구조
    const inner = canvas.innerHTML;
    
    // H2 태그 검색 (대소문자 구분 없이)
    const h2Regex = /<h2[^>]*>|<heading2|<span[^>]*class="[^"]*heading[^"]*"/gi;
    const h2Matches = inner.match(h2Regex);
    
    // b/strong 태그 검색
    const boldRegex = /<(b|strong)[^>]*>/gi;
    const boldMatches = inner.match(boldRegex);
    
    // p 태그 검색
    const pRegex = /<p[^>]*>/gi;
    const pMatches = inner.match(pRegex);
    
    // img 태그 검색
    const imgRegex = /<img[^>]*>/gi;
    const imgMatches = inner.match(imgRegex);
    
    return {
      htmlLength: inner.length,
      h2Count: h2Matches ? h2Matches.length : 0,
      boldCount: boldMatches ? boldMatches.length : 0,
      pCount: pMatches ? pMatches.length : 0,
      imgCount: imgMatches ? imgMatches.length : 0,
      hasContentGuide: inner.includes('se-content-guide'),
      hasSelection: inner.includes('se-selection'),
      first500: inner.substring(0, 500),
    };
  });

  console.log('🔍 Canvas HTML 분석:', JSON.stringify(html, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

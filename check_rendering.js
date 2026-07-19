const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const p = b.contexts()[0].pages()[0];
  const f = await (await p.$('#mainFrame')).contentFrame();

  const anal = await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    const html = canvas.innerHTML;
    
    // heading 관련 클래스/태그
    const headingMatches = html.match(/heading|h2|h3|se-heading/gi);
    const headingCount = headingMatches ? headingMatches.length : 0;
    
    // 섹션 찾기
    const sections = html.match(/<section[^>]*>|<div[^>]*se-section[^>]*>/gi);
    const sectionCount = sections ? sections.length : 0;
    
    // 모든 텍스트 노드의 텍스트 길이 합계
    const textContent = canvas.innerText || '';
    
    // components-wrap 내부 content
    const compWrap = document.querySelector('.se-components-wrap');
    const compText = compWrap ? compWrap.innerText || '' : '없음';
    
    // 모든 요소의 클래스 패턴 분석
    const allElements = canvas.querySelectorAll('*');
    const classPatterns = {};
    allElements.forEach(el => {
      const cls = (el.className || '').substring(0, 60);
      if (cls) {
        const key = cls.split(' ')[0];
        classPatterns[key] = (classPatterns[key] || 0) + 1;
      }
    });
    
    return {
      htmlLength: html.length,
      textContentLength: textContent.length,
      textPreview: textContent.substring(0, 300),
      headingStringMatches: headingCount,
      sectionElements: sectionCount,
      compWrapText: compText.substring(0, 200),
      topClassPatterns: Object.entries(classPatterns)
        .filter(([k,v]) => v > 1)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 20),
    };
  });

  console.log('🔍 분석:', JSON.stringify(anal, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

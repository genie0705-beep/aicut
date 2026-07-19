const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 탭 0 (첫 번째 write 탭 - 가장 깔끔)
  const p = pages[0];
  const fe = await p.$('#mainFrame');
  const f = await fe.contentFrame();

  const detail = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const title = ed.getDocumentTitle();
    const canvas = document.querySelector('.se-canvas');
    
    // canvas의 모든 직계 자식들 (섹션/블록)
    const children = canvas ? Array.from(canvas.children).map(el => ({
      tag: el.tagName,
      cls: (el.className || '').substring(0, 80),
      text: (el.innerText || '').substring(0, 60),
      childCount: el.children.length,
      hasBold: !!el.querySelector('b, strong'),
    })) : [];
    
    // Strong/bold 태그 개수
    const bolds = canvas ? canvas.querySelectorAll('b, strong').length : 0;
    
    // 이미지 섹션
    const imgSections = canvas ? Array.from(canvas.querySelectorAll('[class*="se-section-image"]')).map(el => ({
      align: el.className.includes('align-center') ? 'center' : el.className.includes('align-left') ? 'left' : 'right',
      hasImg: !!el.querySelector('img'),
      width: el.querySelector('img')?.width,
      height: el.querySelector('img')?.height,
    })) : [];

    // H2 섹션
    const h2Sections = canvas ? Array.from(canvas.querySelectorAll('h2, [class*="se-heading2"]')).map(el => ({
      text: (el.innerText || '').substring(0, 50),
      align: el.style.textAlign,
    })) : [];
    
    return {
      title,
      totalCanvasChildren: children.length,
      boldTags: bolds,
      h2Count: h2Sections.length,
      imgSectionCount: imgSections.length,
      imgAlignments: imgSections,
      firstFewChildren: children.slice(0, 10),
      firstFewH2: h2Sections.slice(0, 3),
    };
  });

  console.log('📝 캔버스 상세:', JSON.stringify(detail, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  const fe = await write.$('#mainFrame');
  const f = await fe.contentFrame();

  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    const comps = data.document.components;
    
    // 이미지 컴포넌트
    const imgComps = comps.filter(c => c.fileName || c.src);
    
    // 텍스트 블록 수
    const h2 = blocks.filter(b => b.type === 'heading2').length;
    const p = blocks.filter(b => b.type === 'paragraph').length;
    const textOnly = blocks.filter(b => b.text).length;
    
    // 전체 텍스트 길이 (대략)
    let totalChars = 0;
    blocks.forEach(b => { if (b.text) totalChars += b.text.length; });
    
    // 제목
    const title = ed.getDocumentTitle();
    
    // canvas의 img 태그
    const canvas = document.querySelector('.se-canvas');
    const canvasImgs = canvas ? canvas.querySelectorAll('img').length : 0;
    
    return {
      title,
      blocks: {
        heading2: h2,
        paragraphs: p,
        total: blocks.length,
        estimatedChars: totalChars,
      },
      images: {
        inComponents: imgComps.length,
        inCanvas: canvasImgs,
        details: imgComps.map(c => ({
          fileName: c.fileName || '(unknown)',
          width: c.width,
          height: c.height,
          represent: c.represent,
          hasSrc: !!c.src,
        })),
      },
    };
  });

  console.log('📋 최종 점검 결과:');
  console.log(JSON.stringify(final, null, 2));
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

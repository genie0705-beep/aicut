const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  const fe = await write.$('#mainFrame');
  const f = await fe.contentFrame();

  const info = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    // components 상세
    const comps = data.document.components.map(c => ({
      type: c.type,
      keys: Object.keys(c),
      url: (c.url || c.imageUrl || '').substring(0, 60),
      id: c.id,
    }));
    
    // canvas HTML에서 img 태그 찾기
    const canvas = document.querySelector('.se-canvas');
    const imgs = canvas ? Array.from(canvas.querySelectorAll('img')).map(img => ({
      src: (img.src || '').substring(0, 60),
      alt: (img.alt || '').substring(0, 40),
      width: img.width,
      height: img.height,
      style: img.getAttribute('style') || '',
    })) : [];
    
    // 전체 블록 중 image 타입 유무 상세 검색
    const allBlocks = data.document.blocks;
    const typeSet = {};
    allBlocks.forEach(b => { typeSet[b.type] = (typeSet[b.type]||0)+1; });
    
    return { 
      components: comps,
      imagesInCanvas: imgs.length,
      imageDetails: imgs,
      blockTypes: typeSet,
    };
  });

  console.log('이미지 정보:', JSON.stringify(info, null, 2));
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

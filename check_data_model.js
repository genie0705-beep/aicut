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
    const blocks = data.document.blocks;
    
    // 모든 키 확인
    const allKeys = Object.keys(data.document);
    
    // 각 키별 타입과 예시
    const keyInfo = {};
    allKeys.forEach(k => {
      const v = data.document[k];
      if (Array.isArray(v)) {
        keyInfo[k] = { type: 'array', length: v.length };
        if (v.length > 0) {
          keyInfo[k].sampleTypes = {};
          v.forEach(item => {
            const t = typeof item === 'object' ? (item.type || 'object') : typeof item;
            keyInfo[k].sampleTypes[t] = (keyInfo[k].sampleTypes[t] || 0) + 1;
          });
        }
      } else if (typeof v === 'object' && v !== null) {
        keyInfo[k] = { type: 'object', keys: Object.keys(v).slice(0, 10) };
      } else {
        keyInfo[k] = { type: typeof v, value: String(v).substring(0, 50) };
      }
    });
    
    // image block이 있는지 blocks에서 검색 (모든 필드)
    let imageInBlocks = 0;
    blocks.forEach(b => {
      Object.keys(b).forEach(k => {
        if (k.toLowerCase().includes('image') || k.toLowerCase().includes('img') || k.toLowerCase().includes('url')) {
          if (b[k]) imageInBlocks++;
        }
      });
    });
    
    // 'image' 또는 'img' 포함 키
    const imageKeys = allKeys.filter(k => k.toLowerCase().includes('img') || k.toLowerCase().includes('url'));
    
    // blocks에서 url 속성 있는 애들만
    const blocksWithUrls = blocks.filter(b => b.url).map(b => ({ type: b.type, url: b.url?.substring(0,60) }));
    
    return { 
      allDocumentKeys: allKeys, 
      keyInfo,
      imageInBlocks,
      imageKeys,
      blocksWithUrls,
      blockCount: blocks.length,
      hasImageBlocks: blocks.some(b => b.type === 'image'),
    };
  });

  console.log('전체 데이터 구조:', JSON.stringify(info, null, 2));
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  // Find the 작업된 탭 (가장 최근 write 탭)
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i) => { if (p.url().includes('Redirect=Write')) target = i; });
  if (target < 0) { console.log('❌ No write tab'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  // SE4 blocks 구조 분석
  const info = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    
    if (!blocks || blocks.length === 0) {
      return { error: 'no blocks', docKeys: Object.keys(data.document) };
    }
    
    // 첫 3개 블록의 전체 키 확인
    const samples = blocks.slice(0, 3).map(b => ({
      keys: Object.keys(b),
      type: b.type,
      text: (b.text || '').substring(0, 50),
      // 모든 속성
      full: JSON.parse(JSON.stringify(b)),
    }));
    
    // style 속성 확인
    const withStyle = blocks.filter(b => b.style).length;
    
    // text에 HTML 태그 있는 블록
    const withHtmlTags = blocks.filter(b => b.text && (b.text.includes('<b>') || b.text.includes('<strong>') || b.text.includes('<br>'))).length;
    
    return {
      blockCount: blocks.length,
      withStyle,
      withHtmlTags,
      samples,
    };
  });
  
  console.log('blocks 구조:', JSON.stringify(info, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

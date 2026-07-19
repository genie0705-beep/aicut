const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  // 두 번째 write 탭 (index 4)
  const write = pages[4];
  console.log('URL:', write.url().substring(0, 80));

  const frameEl = await write.$('#mainFrame');
  if (!frameEl) { console.log('❌ No iframe'); process.exit(1); }
  const frame = await frameEl.contentFrame();

  // blocks 타입별 개수 확인
  const info = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    const typeCount = {};
    blocks.forEach(b => { typeCount[b.type] = (typeCount[b.type] || 0) + 1; });
    // image blocks 상세
    const images = blocks.filter(b => b.type === 'image').map(b => ({
      align: b.align,
      url: (b.url || '').substring(0, 50),
      id: b.id,
    }));
    const editorHtml = document.querySelector('.se-canvas')?.innerHTML?.substring(0, 200);
    return { total: blocks.length, typeCount, images, editorHtml: editorHtml?.substring(0,100) };
  });
  
  console.log('블록 정보:', JSON.stringify(info, null, 2));
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

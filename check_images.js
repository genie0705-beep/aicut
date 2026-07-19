const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const p = pages[0]; // 탭 0
  const f = await (await p.$('#mainFrame')).contentFrame();

  const state = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    const imgComps = d.components?.filter(x => x.fileName) || [];
    const canvasImgs = c ? c.querySelectorAll('img').length : 0;
    return {
      title: ed.getDocumentTitle(),
      blocks: d.blocks?.length,
      imgComponents: imgComps.length,
      imgDetails: imgComps.map(x => ({ file: x.fileName, w: x.width, h: x.height })),
      canvasImgs,
      canvasTextLen: (c?.innerText || '').length,
    };
  });
  
  console.log('현재 상태:', JSON.stringify(state, null, 2));
  
  if (state.canvasImgs < 5) {
    console.log('\n⚠️ 이미지가 캔버스에 없음. 업로드 필요');
  } else {
    console.log('\n✅ 이미지 5장 모두 캔버스에 표시됨');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

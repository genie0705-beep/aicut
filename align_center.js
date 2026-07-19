const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i)=>{if(p.url().includes('Redirect=Write'))target=i;});
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  // 정렬 상태 확인 및 수정
  const result = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks || [];
    
    let fixed = { centerText: 0, centerImg: 0 };
    
    blocks.forEach(b => {
      // 텍스트 정렬
      if ((b.type === 'paragraph' || b.type === 'heading2' || b.type === 'heading3') && b.text) {
        if (!b.style || b.style.textAlign !== 'center') {
          if (!b.style) b.style = {};
          b.style.textAlign = 'center';
          fixed.centerText++;
        }
      }
      // 이미지 정렬
      if (b.type === 'image') {
        if (b.align !== 'center') {
          b.align = 'center';
          fixed.centerImg++;
        }
      }
    });
    
    // components 내 이미지도 정렬
    const comps = data.document.components || [];
    comps.forEach(c => {
      if (c.fileName && c.layout !== 'default') {
        // 이미지 정렬 확인
      }
    });
    
    ed.setDocumentData(data);
    
    return {
      fixed,
      textBlocks: blocks.filter(b => b.type === 'paragraph' || b.type === 'heading2').length,
      images: blocks.filter(b => b.type === 'image').length,
      allCentered: blocks.filter(b => b.type === 'paragraph' || b.type === 'heading2').every(b => b.style?.textAlign === 'center'),
    };
  });
  
  console.log('정렬 결과:', JSON.stringify(result));
  
  // 저장
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 저장');
  await f.waitForTimeout(2000);
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

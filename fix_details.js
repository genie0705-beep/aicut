const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i)=>{if(p.url().includes('Redirect=Write'))target=i;});
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  const info = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    const blocks = d.blocks || [];
    
    // 70자 초과 문단 찾기
    const longParas = blocks.filter(b => b.text && b.text.length > 70).map(b => ({
      len: b.text.length,
      text: b.text.substring(0, 80),
      type: b.type,
    }));
    
    // 이미지 컴포넌트 구조
    const imgs = d.components.filter(c => c.fileName);
    const imgKeys = imgs.length > 0 ? Object.keys(imgs[0]) : [];
    const imgSample = imgs.length > 0 ? JSON.parse(JSON.stringify(imgs[0])) : null;
    
    return { longParas, imgKeys, imgSample };
  });
  
  console.log('70자 초과:', JSON.stringify(info.longParas, null, 2));
  console.log('\n이미지 키:', info.imgKeys);
  console.log('\n이미지 샘플:', JSON.stringify(info.imgSample, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  
  if (!page) { console.log('PostWriteForm not found'); return; }
  
  // Get raw document data to find image format
  const docData = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData ? ed.getDocumentData() : {};
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Search for various image-related patterns
    const patterns = {
      img_tag: (dataStr.match(/<img/g) || []).length,
      image_src: (dataStr.match(/src=["'][^"']*\.(png|jpg|jpeg|gif|webp)/gi) || []).length,
      naver_image: (dataStr.match(/postfiles\.pstatic/gi) || []).length,
      data_image: (dataStr.match(/data:image/gi) || []).length,
      blob: (dataStr.match(/blob:/gi) || []).length,
      figure: (dataStr.match(/<figure/gi) || []).length,
      image_inner: dataStr.includes('image') ? dataStr.slice(dataStr.indexOf('image'), dataStr.indexOf('image') + 200) : 'NO_IMAGE_FOUND',
    };
    
    // Check if data contains image-like content
    const imageRelated = dataStr.match(/image|picture|photo|사진|그림|img/gi);
    
    return {
      patterns,
      dataSample: dataStr.slice(dataStr.length - 500),
      imageRelatedCount: imageRelated ? imageRelated.length : 0,
    };
  });
  
  console.log('Document data analysis:');
  console.log(JSON.stringify(docData, null, 2));
  
  // Also try to find images in the rendered DOM
  const domImgs = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img[src]');
    return Array.from(imgs).map(i => ({
      src: i.getAttribute('src')?.slice(0, 100),
      alt: i.getAttribute('alt')?.slice(0, 50),
      cls: i.className?.slice(0, 60),
    }));
  });
  console.log('\nDOM images:', JSON.stringify(domImgs, null, 2));
  
  // Check if there's a separate image service
  const imageService = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const keys = Object.keys(ed);
    const imageRelated = keys.filter(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('photo') || k.toLowerCase().includes('사진'));
    return imageRelated;
  });
  console.log('\nImage-related services:', imageService);
  
  await page.screenshot({ path: 'blog_image_state.png', fullPage: false });
})();

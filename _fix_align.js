const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const ep = pages.find(p => p.url().includes('Redirect=Write'));
  const frames = ep.frames();
  const sf = frames.find(f => f.url().includes('/postwrite'));
  
  // Check current center alignment status
  const status = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    
    // Text alignment check
    const paras = document.querySelectorAll('.se-text-paragraph');
    const centeredParas = document.querySelectorAll('.se-text-paragraph-align-center, .se-text-paragraph[style*="center"]');
    
    // Image alignment check
    const imgSections = document.querySelectorAll('.se-section-image');
    const centeredImgSections = document.querySelectorAll('.se-section-align-center');
    
    return {
      totalParas: paras.length,
      centeredParas: centeredParas.length,
      centerRatio: paras.length > 0 ? `${Math.round(centeredParas.length/paras.length*100)}%` : 'N/A',
      totalImageSections: imgSections.length,
      centeredImageSections: centeredImgSections.length,
      imageCenterRatio: imgSections.length > 0 ? `${Math.round(centeredImgSections.length/imgSections.length*100)}%` : 'N/A',
    };
  });
  
  console.log('정렬 상태:', JSON.stringify(status, null, 2));
  
  // Apply center alignment to both text and images per RULES.md 6-2-3 + blog_worldcup_v3.js
  console.log('센터 정렬 재적용...');
  await sf.evaluate(() => {
    // 1. Text paragraphs — DOM 직접 조작 (RULES.md 6-2-3 방식)
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    
    // 2. Image sections — se-section-align-center 클래스 추가
    document.querySelectorAll('.se-section-image').forEach(s => {
      s.classList.add('se-section-align-center');
      s.style.textAlign = 'center';
      // Also apply to parent containers
      const parent = s.closest('.se-component-content');
      if (parent) parent.style.textAlign = 'center';
      const comp = s.closest('.se-component');
      if (comp) comp.style.textAlign = 'center';
    });
    
    // 3. Notify SE4
    const container = document.querySelector('.se-main-container') || document.querySelector('.se-components-wrap');
    if (container) {
      container.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }
  });
  
  // Verify after fix
  const after = await sf.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    const cp = document.querySelectorAll('.se-text-paragraph-align-center, .se-text-paragraph[style*="center"]');
    const imgS = document.querySelectorAll('.se-section-image');
    const ci = document.querySelectorAll('.se-section-align-center');
    return {
      textCenter: paras.length > 0 ? `${Math.round(cp.length/paras.length*100)}%` : 'N/A',
      imgCenter: imgS.length > 0 ? `${Math.round(ci.length/imgS.length*100)}%` : 'N/A',
    };
  });
  
  console.log('정렬 후:', JSON.stringify(after, null, 2));
  console.log('=== 완료 ===');
  
  await b.close();
})();

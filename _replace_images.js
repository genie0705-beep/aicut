const { chromium } = require('playwright');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Find the good tab (tab 7 with title and full content)
  const eps = pages.filter(p => p.url().includes('Redirect=Write'));
  let goodEp = null;
  for (const ep of eps) {
    const sf = ep.frames().find(f => f.url().includes('PostWriteForm'));
    if (!sf) continue;
    const info = await sf.evaluate(() => {
      const se = SmartEditor.getEditor('blogpc001');
      return { title: se.getDocumentTitle(), len: se.getContentText().length };
    }).catch(() => ({}));
    if (info.title && info.len > 1000) { goodEp = ep; break; }
  }
  
  if (!goodEp) { console.log('올바른 탭을 찾을 수 없습니다'); await b.close(); return; }
  
  console.log('올바른 탭 발견:', goodEp.url().substring(0, 80));
  
  const frames = goodEp.frames();
  const sf = frames.find(f => f.url().includes('PostWriteForm'));
  
  // Remove old images by finding and deleting image components
  await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    const imgComps = document.querySelectorAll('.se-component.se-image');
    imgComps.forEach(comp => {
      // Try SE4 API to delete
      const id = comp.getAttribute('data-component-id') || comp.id;
      if (id && se._editingService.deleteComponents) {
        try { se._editingService.deleteComponents([id]); } catch(e) {}
      }
      // Fallback: remove from DOM
      if (comp.parentNode) comp.parentNode.removeChild(comp);
    });
  });
  
  await goodEp.waitForTimeout(1000);
  
  // Upload new images via 사진 button
  const imgFiles = [
    'aicut_blog_estate_main.png',
    'aicut_blog_estate_cycle.png',
    'aicut_blog_estate_cost.png',
    'aicut_blog_estate_channel.png',
    'aicut_blog_estate_after.png',
    'aicut_blog_estate_cta.png'
  ];
  
  for (let i = 0; i < imgFiles.length; i++) {
    process.stdout.write(`  이미지 ${i+1}/6 ${imgFiles[i]}...`);
    const btn = sf.locator('.se-toolbar-item-image button').first();
    const fcP = goodEp.waitForEvent('filechooser', {timeout:8000}).catch(()=>null);
    await sf.evaluate(() => {
      try { SmartEditor.getEditor('blogpc001')._canvasScrollingService.focusToFirstComp(); } catch(e) {}
    });
    await btn.click();
    await goodEp.waitForTimeout(400);
    const fc = await fcP;
    if (fc) {
      await fc.setFiles(path.join(W, imgFiles[i]));
      await goodEp.waitForTimeout(2500);
      console.log(' ✅');
    } else {
      console.log(' ❌ 파일선택기 없음');
    }
    await sf.evaluate(() => {
      try { const se = SmartEditor.getEditor('blogpc001'); se._editingService.insertTextCompAtLast(); se._canvasScrollingService.focusToFirstComp(); } catch(e) {}
    });
  }
  
  // Apply center alignment
  await sf.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelectorAll('.se-section-image').forEach(s => {
      s.classList.add('se-section-align-center');
      s.style.textAlign = 'center';
    });
  });
  
  // Final verify
  const st = await sf.evaluate(() => {
    const se = SmartEditor.getEditor('blogpc001');
    return {
      title: se.getDocumentTitle(),
      len: se.getContentText().length,
      imgs: document.querySelectorAll('.se-image-resource').length,
      center: document.querySelectorAll('.se-text-paragraph-align-center').length
    };
  });
  
  console.log('\n=== 최종 ===');
  console.log(JSON.stringify(st, null, 2));
  
  await b.close();
  console.log('=== 완료 ===');
})();

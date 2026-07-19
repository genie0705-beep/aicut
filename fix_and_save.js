const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const p = b.contexts()[0].pages()[10]; // 탭 10 = write_v5
  const fe = await p.$('#mainFrame');
  const f = await fe.contentFrame();
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // Canvas HTML 다시 주입
  await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return;
    
    const ed = SmartEditor._editors['blogpc001'];
    const blocks = ed.getDocumentData().document.blocks;
    if (!blocks || blocks.length === 0) return;
    
    let wrap = canvas.querySelector('.se-components-wrap');
    if (!wrap) {
      wrap = document.createElement('article');
      wrap.className = 'se-components-wrap';
      canvas.prepend(wrap);
    }
    
    let textHTML = '';
    blocks.forEach(b => {
      const text = b.text || '';
      if (b.type === 'heading2') {
        textHTML += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><h2 style="text-align:center;">${text}</h2></div></div></div></div>`;
      } else if (b.type === 'paragraph') {
        if (text) {
          textHTML += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><p style="text-align:center;">${text}</p></div></div></div></div>`;
        } else {
          textHTML += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><p style="text-align:center;"><br></p></div></div></div></div>`;
        }
      }
    });
    
    wrap.innerHTML = textHTML;
  });
  await f.waitForTimeout(1000);
  
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    return {
      blocks: d.blocks?.length,
      chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
      canvasTextLen: (c?.innerText || '').length,
      canvasText: (c?.innerText || '').substring(0, 100),
    };
  });
  console.log('📊:', JSON.stringify(check));
  
  if (check.canvasTextLen > 500) {
    // 이미지 업로드
    const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
    for (const file of ['aicut_blog_hospital_main.png','aicut_blog_hospital_01.png','aicut_blog_hospital_02.png','aicut_blog_hospital_03.png','aicut_blog_hospital_cta.png']) {
      console.log(`📸 ${file}`);
      await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
      await f.evaluate(() => document.querySelector('.se-image-toolbar-button')?.click());
      await f.waitForTimeout(1500);
      const fi = await f.$('input[type="file"]');
      if (fi) { await fi.setInputFiles(IMG_DIR + file); await f.waitForTimeout(8000); }
    }
    
    // 스크롤 후 저장
    await f.evaluate(() => window.scrollTo(0, 0));
    await f.waitForTimeout(500);
    
    const sBtn = await f.$('.save_btn__bzc5B');
    if (sBtn) { await sBtn.evaluate(b => b.click()); console.log('💾 저장'); }
    await f.waitForTimeout(2000);
    
    const final = await f.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData().document;
      const c = document.querySelector('.se-canvas');
      return {
        blocks: d.blocks?.length,
        chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
        imgComps: d.components?.filter(x => x.fileName).length,
        canvasTextLen: (c?.innerText || '').length,
      };
    });
    console.log('\n📋 최종:', JSON.stringify(final));
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

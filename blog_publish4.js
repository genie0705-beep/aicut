const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const page = context.pages().find(p => p.url().includes('PostWriteForm'));
    
    if (!page) {
      console.log('PostWriteForm page not found');
      process.exit(1);
    }

    console.log('=== Examining publish dialog and blog category settings ===');
    
    // First, let's find the "발행" button and click it to see the dialog
    const publishBtn = await page.$('.publish_btn__m9KHH, .publish_btn_area__KjA2i button');
    if (publishBtn) {
      console.log('Found publish button, clicking...');
      await publishBtn.click();
      await sleep(2000);
      
      // Now check what appeared
      const dialogState = await page.evaluate(() => {
        const result = {};
        
        // Check for any visible dialogs, modals, overlays
        const dialogs = document.querySelectorAll('[class*="dialog"], [class*="modal"], [class*="overlay"], [class*="popup"], [role="dialog"]');
        result.dialogs = Array.from(dialogs).map(d => ({
          class: d.className?.substring(0, 100),
          visible: d.offsetParent !== null,
          html: d.outerHTML.substring(0, 800)
        }));
        
        // Check for any new layer
        const layers = document.querySelectorAll('[class*="layer"], [class*="Layer"]');
        result.layers = Array.from(layers).filter(l => l.offsetParent !== null).map(l => ({
          class: l.className?.substring(0, 100),
          html: l.innerHTML.substring(0, 600)
        }));
        
        // Look for any visible elements containing 카테고리, 분류, 설정, 픽
        const all = document.querySelectorAll('*');
        const categoryRefs = [];
        all.forEach(el => {
          if (el.offsetParent === null) return;
          const t = el.textContent?.trim() || '';
          if ((t.includes('카테고리') || t.includes('분류') || t.includes('에이컷 오늘')) && t.length < 80) {
            categoryRefs.push({
              text: t,
              tag: el.tagName,
              class: el.className?.substring(0, 60)
            });
          }
        });
        result.categoryRefs = categoryRefs;
        
        // Check for select elements in visible dialogs
        const selects = document.querySelectorAll('select');
        result.visibleSelects = Array.from(selects).filter(s => s.offsetParent !== null).map(s => ({
          options: Array.from(s.options).map(o => ({ text: o.text, value: o.value.substring(0, 30) })),
          selectedIndex: s.selectedIndex
        }));
        
        return result;
      });
      
      console.log('Dialog State:', JSON.stringify(dialogState, null, 2));
    } else {
      console.log('Publish button not found');
    }
    
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();

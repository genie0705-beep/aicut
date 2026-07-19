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

    // The publish dialog should already be open from previous click
    // Check if it's still open
    const checkDialog = await page.evaluate(() => {
      const pubDialog = document.querySelector('.layer_popup__i0QOY.is_show__TMSLq');
      return pubDialog ? true : false;
    });
    
    console.log('Publish dialog open:', checkDialog);
    
    if (!checkDialog) {
      // Click publish button to open dialog
      console.log('Opening publish dialog...');
      const publishBtn = await page.$('.publish_btn__m9KHH');
      if (publishBtn) await publishBtn.click();
      await sleep(2000);
    }
    
    console.log('=== Opening Category Dropdown in Publish Dialog ===');
    
    // Find and click the category button to open dropdown
    const catButton = await page.$('.selectbox_button__jb1Dt');
    if (catButton) {
      const catText = await catButton.textContent();
      console.log('Current category:', catText);
      
      await catButton.click();
      await sleep(1500);
      
      // Now check the dropdown items
      const dropdownItems = await page.evaluate(() => {
        // Look for category list items that appeared
        const items = document.querySelectorAll('[class*="selectbox_option"], [class*="option"], [role="option"], [class*="menu_item"], [class*="list_item"]');
        const result = [];
        items.forEach(el => {
          if (el.offsetParent !== null) {
            const text = el.textContent?.trim() || '';
            if (text.length > 0 && text.length < 60) {
              result.push({
                text,
                tag: el.tagName,
                class: el.className?.substring(0, 80)
              });
            }
          }
        });
        
        // Also check for visible lists/selectbox elements
        const selectBoxLists = document.querySelectorAll('[class*="selectbox_list"], [class*="selectbox-list"], [role="listbox"]');
        result.push('--- listboxes ---');
        selectBoxLists.forEach(l => {
          result.push({
            type: 'listbox',
            class: l.className?.substring(0, 80),
            visible: l.offsetParent !== null,
            html: l.outerHTML.substring(0, 1000)
          });
        });
        
        // Check for any UL elements that became visible
        const uls = document.querySelectorAll('ul');
        uls.forEach(ul => {
          if (ul.offsetParent !== null && ul.children.length > 3) {
            const text = ul.textContent?.trim() || '';
            if (text.includes('영상') || text.includes('카테고리') || text.length < 200) {
              result.push({
                type: 'visible-ul',
                class: ul.className?.substring(0, 80),
                html: ul.outerHTML.substring(0, 1500)
              });
            }
          }
        });
        
        return result;
      });
      
      console.log('Dropdown items:', JSON.stringify(dropdownItems, null, 2));
    } else {
      console.log('Category button not found');
      
      // Check the full dialog HTML
      const dialogHTML = await page.evaluate(() => {
        const dialog = document.querySelector('.layer_popup__i0QOY.is_show__TMSLq');
        return dialog ? dialog.innerHTML.substring(0, 3000) : 'not found';
      });
      console.log('Dialog HTML:', dialogHTML);
    }
    
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();

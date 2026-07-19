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

    // Check if publish dialog is open
    let dialogOpen = await page.evaluate(() => {
      return !!document.querySelector('.layer_popup__i0QOY.is_show__TMSLq');
    });
    
    if (!dialogOpen) {
      console.log('Opening publish dialog...');
      const publishBtn = await page.$('.publish_btn__m9KHH');
      if (publishBtn) await publishBtn.click();
      await sleep(2000);
    }
    
    // Verify the current category selection
    const categoryState = await page.evaluate(() => {
      const selectedRadio = document.querySelector('input[type="radio"][name="radio"]:checked');
      if (selectedRadio) {
        const label = document.querySelector(`label[for="${CSS.escape(selectedRadio.id)}"]`);
        return {
          selectedText: label?.querySelector('.text__sraQE')?.textContent?.trim() || '',
          selectedId: selectedRadio.id,
          testId: selectedRadio.getAttribute('data-testid')
        };
      }
      // Also check the button text
      const btnTextEl = document.querySelector('.selectbox_button__jb1Dt .text__sraQE');
      return {
        selectedText: 'no checked radio found',
        buttonText: btnTextEl?.textContent?.trim() || ''
      };
    });
    
    console.log('=== Final Category State ===');
    console.log(JSON.stringify(categoryState, null, 2));
    
    // Get the full dialog state for reporting
    const dialogDetails = await page.evaluate(() => {
      const dialog = document.querySelector('.layer_popup__i0QOY.is_show__TMSLq');
      if (!dialog) return { error: 'dialog not found' };
      
      const html = dialog.innerHTML;
      
      // Extract key info
      const catText = dialog.querySelector('.selectbox_button__jb1Dt .text__sraQE')?.textContent?.trim() || '';
      const openType = dialog.querySelector('input[type="radio"][name="open_type"]:checked + label')?.textContent?.trim() || '';
      const searchAllowed = dialog.querySelector('#publish-option-search')?.checked;
      const publishBtnText = dialog.querySelector('.confirm_btn__WEaBq .text__sraQE')?.textContent?.trim() || '';
      
      return { catText, openType, searchAllowed, publishBtnText };
    });
    
    console.log('\n=== Publish Dialog Details ===');
    console.log(JSON.stringify(dialogDetails, null, 2));
    
    // Get the post title for reporting
    const postTitle = await page.evaluate(() => {
      const titleEl = document.querySelector('.__se_cover_title .se-ff-nanumgothic, .se-og-title, .se-og-title span');
      if (titleEl) return titleEl.textContent?.trim();
      
      // Try the heading in the editor
      const heading = document.querySelector('h1, h2, h3');
      const spans = document.querySelectorAll('.se-ff-nanumgothic.se-fs32');
      if (spans.length > 0) return spans[0].textContent?.trim();
      
      return 'N/A';
    });
    
    console.log('\n=== Post Info ===');
    console.log('Title:', postTitle);
    
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();

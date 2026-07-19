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

    // Check if the publish dialog is open or open it
    let dialogOpen = await page.evaluate(() => {
      return !!document.querySelector('.layer_popup__i0QOY.is_show__TMSLq');
    });
    
    if (!dialogOpen) {
      console.log('Opening publish dialog...');
      const publishBtn = await page.$('.publish_btn__m9KHH');
      if (publishBtn) await publishBtn.click();
      await sleep(2000);
    }
    
    // Get the full category list to find the right button/radio ID
    const catOptions = await page.evaluate(() => {
      const list = document.querySelector('ul.list__RcvVA');
      if (!list) return [];
      const items = list.querySelectorAll('li.item__sAGX9');
      return Array.from(items).map(li => {
        const span = li.querySelector('.text__sraQE');
        const input = li.querySelector('input');
        const label = li.querySelector('label');
        return {
          text: span?.textContent?.trim() || '',
          inputId: input?.id || '',
          forAttr: label?.getAttribute('for') || '',
          html: li.innerHTML.substring(0, 200)
        };
      });
    });
    
    console.log('Category options:', JSON.stringify(catOptions, null, 2));
    
    // Find "에이컷 오늘의 픽!" option
    const targetOption = catOptions.find(o => o.text.includes('에이컷 오늘'));
    if (targetOption) {
      console.log(`\nFound target: "${targetOption.text}"`);
      console.log(`Input ID: ${targetOption.inputId}`);
      
      // Click the label for the target option
      const labelEl = await page.$(`label[for="${targetOption.inputId}"]`);
      if (labelEl) {
        // Click the label element (radio click)
        await labelEl.click();
        await sleep(1000);
        
        // Verify the selection
        const verifyCat = await page.evaluate(() => {
          const selectedRadio = document.querySelector('input[type="radio"][name="radio"]:checked');
          if (selectedRadio) {
            const label = document.querySelector(`label[for="${selectedRadio.id}"]`);
            return {
              selectedId: selectedRadio.id,
              selectedText: label?.querySelector('.text__sraQE')?.textContent?.trim() || ''
            };
          }
          return { selectedId: 'none', selectedText: 'none' };
        });
        console.log('Category after change:', JSON.stringify(verifyCat));
        
        // Check the button display text has updated
        const btnText = await page.$eval('.selectbox_button__jb1Dt .text__sraQE', el => el.textContent?.trim());
        console.log('Button display text:', btnText);
      } else {
        console.log('Label not found, trying direct radio click');
        const radioInput = await page.$(`#${targetOption.inputId}`);
        if (radioInput) {
          await radioInput.click({ force: true });
          await sleep(1000);
          console.log('Radio clicked directly');
        }
      }
    } else {
      console.log('Target option not found in list');
    }
    
    await browser.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();

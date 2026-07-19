const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const page = context.pages().find(p => p.url().includes('PostWriteForm'));
    if (!page) { console.log('page not found'); await browser.close(); process.exit(1); }

    let dlgOpen = await page.evaluate(() => !!document.querySelector('.layer_popup__i0QOY.is_show__TMSLq'));
    if (!dlgOpen) {
      const pbtn = await page.$('.publish_btn__m9KHH');
      if (pbtn) { await pbtn.click(); await sleep(2000); }
    }

    const cat = await page.$eval('.selectbox_button__jb1Dt .text__sraQE', el => el.textContent?.trim());
    console.log('Category:', cat);

    const pubInfo = await page.evaluate(() => {
      const b = document.querySelector('.confirm_btn__WEaBq');
      return b ? { text: b.textContent?.trim(), disabled: b.disabled, exists: true } : { exists: false };
    });
    console.log('Publish button:', JSON.stringify(pubInfo));

    await browser.close();
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

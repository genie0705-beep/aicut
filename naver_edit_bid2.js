const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  // Check what bulk action buttons are available
  const uiCheck = await page.evaluate(() => {
    // 1. Check all buttons on the page with text
    const allBtns = Array.from(document.querySelectorAll('button'));
    const btnTexts = allBtns.map(b => ({
      text: b.innerText?.replace(/\s+/g, ' ').trim().substring(0, 50),
      visible: b.offsetParent !== null,
      class5: b.className?.substring(0, 60)
    })).filter(b => b.text && b.text.length > 0);

    // 2. Check if there are any bulk action areas
    const bulkAreas = Array.from(document.querySelectorAll('[class*="bulk"], [class*="Bulk"], [class*="batch"], [class*="Batch"]'));
    
    // 3. See the overall structure of the toolbar/action bar
    const toolbars = Array.from(document.querySelectorAll('[class*="toolbar"], [class*="Toolbar"], [class*="action-bar"], [class*="ActionBar"]'));

    return { btnTexts, bulkAreas: bulkAreas.length, toolbars: toolbars.length };
  });

  console.log('=== 버튼 목록 ===');
  uiCheck.btnTexts.forEach(b => console.log('  ' + b.text + ' | visible:' + b.visible + ' | ' + b.class5));
  console.log('bulk areas: ' + uiCheck.bulkAreas);
  console.log('toolbars: ' + uiCheck.toolbars);

  await b.close();
})().catch(e => console.log('ERR:', e.message));

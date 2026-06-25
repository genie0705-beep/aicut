const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('details/aicut.co.kr')) { page = pages[i]; break; }
  }
  if (!page) { console.log('Page not found'); await b.close(); return; }

  await page.bringToFront();

  // Click "+ 새 레코드 추가" 
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.trim().includes('새 레코드') && b.offsetParent !== null);
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Find the inputs by placeholder
  const typeInput = page.locator('input[placeholder=""]').filter({ has: page.locator('input[value="A"]') });
  const hostInput = page.locator('input[placeholder="ex) @, www"]');
  const valueInput = page.locator('input[placeholder="ex) 1.1.1.1"]');
  const ttlInput = page.locator('input[placeholder="ex) 180"]');

  // Try to fill TXT: add by changing the type from A to TXT
  // First, let's check what elements are around
  const allInputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    return Array.from(inputs).slice(-10).map(i => {
      return { placeholder: i.placeholder, value: i.value, id: i.id, type: i.type };
    });
  });
  console.log('Recent inputs:', JSON.stringify(allInputs, null, 2));

  // Let's try to type into the fields directly
  const inputs = await page.locator('input').all();
  
  // Fill TXT record (host=@, value=hosting-site=aicut-28ab5)
  // Change type from A to TXT
  const typeField = inputs.find(i => i.value === 'A');
  if (typeField) {
    await typeField.click();
    await typeField.fill('TXT');
  }

  // Fill host
  const hostField = inputs.find(i => i.placeholder === 'ex) @, www');
  if (hostField) {
    await hostField.click();
    await hostField.fill('@');
  }

  // Fill value
  const valField = inputs.find(i => i.placeholder === 'ex) 1.1.1.1');
  if (valField) {
    await valField.click();
    await valField.fill('hosting-site=aicut-28ab5');
  }

  // TTL stays 180 (default)

  console.log('Filled TXT record');
  await new Promise(r => setTimeout(r, 1000));

  // Look for save/confirm button
  const saveBtn = await page.locator('button:has-text("저장"), button:has-text("추가"), button:has-text("확인")');
  const saveCount = await saveBtn.count();
  console.log('Save buttons found:', saveCount);

  if (saveCount > 0) {
    await saveBtn.first().click();
    console.log('Clicked save');
    await new Promise(r => setTimeout(r, 2000));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message));

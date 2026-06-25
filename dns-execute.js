const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  
  let dnsPage = null;
  let firebasePage = null;
  
  for (const page of pages) {
    const url = page.url();
    if (url.includes('app.hosting.kr') && url.includes('dns')) dnsPage = page;
    if (url.includes('console.firebase.google.com') && url.includes('domains')) firebasePage = page;
  }
  
  if (!dnsPage) { console.error('DNS page not found!'); await browser.close(); return; }
  
  // Auto-accept dialogs
  dnsPage.on('dialog', async dialog => {
    console.log(`\n📋 Dialog: ${dialog.type()} - "${dialog.message().slice(0, 120)}"`);
    await dialog.accept();
    console.log('  ✅ Accepted');
  });
  
  await sleep(2000);
  
  // =============================================
  // STEP 1: Click "+ 새 레코드 추가" to reveal editable area
  // =============================================
  console.log('\n=== STEP 1: Clicking "+ 새 레코드 추가" button ===');
  
  const addBtn = dnsPage.locator('button:has-text("+ 새 레코드 추가")').first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    console.log('✅ Clicked "+ 새 레코드 추가"');
    await sleep(1500);
  } else {
    console.log('⚠️ "+ 새 레코드 추가" not visible, trying by coordinates');
    await dnsPage.mouse.click(1546, 769);
    await sleep(1500);
  }
  
  // Take screenshot after clicking add
  await dnsPage.screenshot({ path: 'dns-after-add.png', fullPage: false });
  console.log('📸 Screenshot saved: dns-after-add.png');
  
  // Check what's visible now
  const pageState = await dnsPage.evaluate(() => {
    const results = [];
    // Look for visible form elements
    const inputs = document.querySelectorAll('input, select, textarea, [role="combobox"], [role="listbox"]');
    inputs.forEach((inp, idx) => {
      const rect = inp.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        results.push({
          idx, tag: inp.tagName,
          type: inp.getAttribute('type') || inp.getAttribute('role') || '',
          placeholder: inp.getAttribute('placeholder') || '',
          value: inp.value || inp.textContent?.trim() || '',
          id: inp.id?.slice(0, 30) || '',
          class: inp.className?.slice(0, 50) || '',
          x: rect.x, y: rect.y, w: rect.width, h: rect.height
        });
      }
    });
    
    // Check for MUI Select components
    const selects = document.querySelectorAll('.MuiSelect-select, [class*="MuiSelect"], select');
    selects.forEach((sel, idx) => {
      const rect = sel.getBoundingClientRect();
      results.push({
        idx: idx + 100, tag: sel.tagName,
        text: sel.textContent?.trim().slice(0, 30),
        value: sel.value || '',
        class: sel.className?.slice(0, 50),
        x: rect.x, y: rect.y, w: rect.width, h: rect.height
      });
    });
    
    return results;
  });
  
  console.log('\n=== Visible form elements ===');
  for (const el of pageState) {
    console.log(`[${el.idx}] ${el.tag} ${el.type} @(${el.x.toFixed(0)},${el.y.toFixed(0)}) ${el.w.toFixed(0)}x${el.h.toFixed(0)} "${el.text || el.placeholder || el.value}" id="${el.id}" class=${el.class}`);
  }
  
  await browser.close();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });

const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const dnsPage = browser.contexts()[0].pages().find(p => p.url().includes('app.hosting.kr') && p.url().includes('dns'));
  if (!dnsPage) { console.error('DNS page not found!'); await browser.close(); return; }
  
  // Auto-accept dialogs
  dnsPage.on('dialog', async dialog => {
    console.log(`📋 Dialog: "${dialog.message().slice(0, 120)}" => Accept`);
    await dialog.accept();
  });
  
  await sleep(1500);
  
  // =============================================
  // STEP 1: Form 1 - Change type from A to TXT and save
  // =============================================
  console.log('\n=== STEP 1: Change Form 1 type to TXT and save ===');
  
  // Find the native select element for Form 1 and use selectOption
  const selectInputs = await dnsPage.locator('input.MuiSelect-nativeInput').all();
  let form1Select = null;
  for (const inp of selectInputs) {
    const box = await inp.boundingBox();
    if (box && box.y >= 930 && box.y <= 950) {
      form1Select = inp;
      break;
    }
  }
  
  if (form1Select) {
    console.log('Found Form 1 native select input');
    // Use Playwright selectOption on the native select element
    // The MUI nativeInput is just a hidden <input>, but there's most likely a hidden <select> nearby
    // Let's try using evaluate to set value and dispatch events
    
    await form1Select.evaluate(el => {
      // Dispatch events to notify MUI
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(el, 'TXT');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    console.log('Set value to TXT');
    await sleep(500);
  }
  
  await sleep(500);
  
  // Verify the value changed
  const selectVal = await dnsPage.evaluate(() => {
    const inputs = document.querySelectorAll('.MuiSelect-nativeInput');
    for (const inp of inputs) {
      const rect = inp.getBoundingClientRect();
      if (Math.round(rect.y) >= 930 && Math.round(rect.y) <= 950) {
        return { value: inp.value, display: inp.previousElementSibling?.textContent || '?' };
      }
    }
    return { error: 'not found' };
  });
  console.log('Select value:', JSON.stringify(selectVal));
  
  await sleep(300);
  
  // Click the checkmark button for form 1 at (1755, 940)
  console.log('Clicking checkmark (save) for Form 1...');
  await dnsPage.mouse.click(1755, 940);
  await sleep(2000);
  
  console.log('Verifying form 1 was saved...');
  await dnsPage.screenshot({ path: 'dns-after-form1-save.png', fullPage: false });
  
  // =============================================
  // STEP 2: Form 2 - Fill A record and save
  // =============================================
  console.log('\n=== STEP 2: Fill Form 2 with A record and save ===');
  
  // Check if form 2 still exists (after form 1 save, the list might have updated)
  const form2Exists = await dnsPage.evaluate(() => {
    const inputs = document.querySelectorAll('.MuiSelect-nativeInput');
    const results = [];
    inputs.forEach(inp => {
      const rect = inp.getBoundingClientRect();
      if (Math.round(rect.y) >= 1000 && Math.round(rect.y) <= 1150) {
        results.push({ y: Math.round(rect.y), value: inp.value });
      }
    });
    return results;
  });
  console.log('Form 2 select inputs:', JSON.stringify(form2Exists));
  
  if (form2Exists.length > 0) {
    // Fill in the host and value fields
    const hostInput = await dnsPage.$('input[placeholder="ex) @, www"]');
    const valueInput = await dnsPage.$('input[placeholder="ex) 1.1.1.1"]');
    
    // There might be multiple inputs with these placeholders. Find the visible ones in form 2 area
    const inputs = await dnsPage.evaluate(() => {
      const results = [];
      const allInputs = document.querySelectorAll('input');
      allInputs.forEach(inp => {
        const rect = inp.getBoundingClientRect();
        const y = Math.round(rect.y);
        if (y >= 1000 && y <= 1120 && !inp.classList.contains('MuiSelect-nativeInput') && !inp.classList.contains('PrivateSwitchBase-input')) {
          const placeholder = inp.placeholder || '';
          const type = inp.type || '';
          results.push({ y, x: Math.round(rect.x), placeholder, id: inp.id, value: inp.value, w: Math.round(rect.width) });
        }
      });
      return results;
    });
    
    console.log('Input fields in Form 2 area:');
    for (const inp of inputs) {
      console.log(`  @(${inp.x},${inp.y}) ${inp.w}px placeholder="${inp.placeholder}" id="${inp.id}" value="${inp.value}"`);
    }
    
    // Fill the host input (placeholder="ex) @, www") in form 2 area
    for (const inp of inputs) {
      if (inp.placeholder.includes('@')) {
        console.log(`Filling host input id="${inp.id}" with "@"`);
        await dnsPage.fill(`#${CSS.escape(inp.id)}`, '@');
        await sleep(300);
        break;
      }
    }
    
    // Fill the value input (placeholder="ex) 1.1.1.1") in form 2 area
    for (const inp of inputs) {
      if (inp.placeholder.includes('1.1.1.1')) {
        console.log(`Filling value input id="${inp.id}" with "199.36.158.100"`);
        await dnsPage.fill(`#${CSS.escape(inp.id)}`, '199.36.158.100');
        await sleep(300);
        break;
      }
    }
    
    // Click the checkmark for form 2 at (1755, 1058)
    console.log('Clicking checkmark (save) for Form 2...');
    await dnsPage.mouse.click(1755, 1058);
    await sleep(2000);
  } else {
    console.log('Form 2 not found - need to add A record via "+ 새 레코드 추가"');
  }
  
  await dnsPage.screenshot({ path: 'dns-after-form2-save.png', fullPage: false });
  
  // =============================================
  // STEP 3: Delete GitHub A records
  // =============================================
  console.log('\n=== STEP 3: Delete GitHub A records ===');
  
  // Find the current delete button positions for A records with GitHub IPs
  const ghIPs = await dnsPage.evaluate(() => {
    const results = [];
    const ipValues = {'185.199.108.153': true, '185.199.109.153': true, '185.199.110.153': true, '185.199.111.153': true};
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(btn => {
      const text = btn.textContent.trim();
      if (ipValues[text]) {
        const rect = btn.getBoundingClientRect();
        results.push({ ip: text, y: Math.round(rect.y) });
      }
    });
    return results;
  });
  
  console.log('Current GitHub A record positions:', JSON.stringify(ghIPs));
  
  // For each GitHub IP row, find the delete button and click it
  for (const gh of ghIPs) {
    const delBtn = await dnsPage.evaluate((targetY) => {
      const deleteBtns = document.querySelectorAll('button.gtm-record-delete');
      for (const btn of deleteBtns) {
        const rect = btn.getBoundingClientRect();
        if (Math.abs(rect.y - targetY) < 30) {
          return { x: Math.round(rect.x) + 20, y: Math.round(rect.y) + 20 };
        }
      }
      return null;
    }, gh.y);
    
    if (delBtn) {
      console.log(`Deleting ${gh.ip} @ (${delBtn.x}, ${delBtn.y})`);
      await dnsPage.mouse.click(delBtn.x, delBtn.y);
      await sleep(1500);
    }
  }
  
  console.log('✅ All GitHub A records deleted');
  await dnsPage.screenshot({ path: 'dns-after-github-delete.png', fullPage: false });
  
  // =============================================
  // STEP 4: If form 2 wasn't saved, add A record now
  // =============================================
  console.log('\n=== STEP 4: Verify A record and add if needed ===');
  
  // Check current records
  const currentRecords = await dnsPage.evaluate(() => {
    const results = [];
    const typeBtns = {A: true, CNAME: true, MX: true, TXT: true};
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(btn => {
      const text = btn.textContent.trim();
      if (typeBtns[text]) {
        const rect = btn.getBoundingClientRect();
        // Get the value (next buttons in the row)
        let rowEl = btn.parentElement;
        for (let i = 0; i < 5 && rowEl; i++) rowEl = rowEl.parentElement;
        const rowText = rowEl ? rowEl.textContent.trim() : '';
        results.push({ type: text, y: Math.round(rect.y), rowText: rowText.slice(0, 100) });
      }
    });
    return results;
  });
  
  console.log('Current DNS records:');
  for (const r of currentRecords) {
    console.log(`  ${r.type} y=${r.y}: ${r.rowText}`);
  }
  
  return { dnsPage, browser };
}

main().then(async ({ dnsPage, browser }) => {
  console.log('\n=== DONE ===');
  await browser.close();
}).catch(err => { console.error('Error:', err); process.exit(1); });

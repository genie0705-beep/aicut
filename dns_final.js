const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('details/aicut.co.kr/dns')) { page = pages[i]; break; }
  }
  if (!page) { console.log('DNS page not found'); await b.close(); return; }
  
  await page.bringToFront();

  // Disable dialogs auto-dismiss to handle confirmations
  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message().substring(0, 100));
    await dialog.accept();
  });

  // Function to click a button by its text content
  async function clickButton(text) {
    const btn = page.locator('button').filter({ hasText: text }).first();
    const count = await btn.count();
    if (count > 0) {
      await btn.click({ timeout: 3000 });
      console.log('Clicked:', text);
      return true;
    }
    console.log('Not found:', text);
    return false;
  }

  await page.waitForTimeout(1000);

  // Step 1: Close any open inline form first - look for cancel/save buttons
  console.log('--- Step 1: Close inline form ---');
  await clickButton('취소');
  await page.waitForTimeout(2000);

  // Step 2: Find and click the delete buttons for remaining 185.199 records
  console.log('\n--- Step 2: Delete GitHub A records ---');
  for (let round = 0; round < 5; round++) {
    let deleted = false;
    const result = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      for (const row of rows) {
        if (row.innerText.includes('185.199')) {
          const btns = row.querySelectorAll('button');
          // Find the last button in the row (usually delete/trash icon)
          let lastBtn = null;
          let lastX = 0;
          for (const btn of btns) {
            if (btn.offsetParent !== null) {
              const rect = btn.getBoundingClientRect();
              if (rect.x > lastX) {
                lastX = rect.x;
                lastBtn = btn;
              }
            }
          }
          if (lastBtn) {
            const rect = lastBtn.getBoundingClientRect();
            lastBtn.click();
            return { found: true, x: Math.round(rect.x), y: Math.round(rect.y), text: row.innerText.substring(0, 50).replace(/\n/g, ' ') };
          }
        }
      }
      return { found: false };
    });

    if (result.found) {
      console.log('Delete clicked:', result.text);
      await page.waitForTimeout(2000);
      
      // Accept confirmation dialog
      await clickButton('삭제');
      await clickButton('확인');
      await page.waitForTimeout(2000);
    } else {
      console.log('No more GitHub records');
      break;
    }
  }

  // Step 3: Close any remaining inline form
  console.log('\n--- Step 3: Close forms ---');
  await clickButton('취소');
  await page.waitForTimeout(1000);

  // Step 4: Add TXT record
  console.log('\n--- Step 4: Add TXT record ---');
  await clickButton('+ 새 레코드 추가');
  await page.waitForTimeout(2000);

  // Fill in form
  const inputs = await page.locator('input').all();
  for (const inp of inputs) {
    const placeholder = await inp.getAttribute('placeholder') || '';
    const val = await inp.inputValue();
    
    if (placeholder === '' && val === 'A') {
      await inp.click();
      await inp.fill('TXT');
    }
    else if (placeholder === 'ex) @, www') {
      await inp.click();
      await inp.fill('@');
    }
    else if (placeholder === 'ex) 1.1.1.1') {
      await inp.click();
      await inp.fill('hosting-site=aicut-28ab5');
    }
  }
  
  await page.waitForTimeout(1000);
  await clickButton('저장');
  await clickButton('확인');
  await page.waitForTimeout(2000);

  // Step 5: Add A record for Firebase
  console.log('\n--- Step 5: Add A record ---');
  await clickButton('+ 새 레코드 추가');
  await page.waitForTimeout(2000);

  const inputs2 = await page.locator('input').all();
  for (const inp of inputs2) {
    const placeholder = await inp.getAttribute('placeholder') || '';
    const val = await inp.inputValue();
    
    if (placeholder === '' && val === 'A') {
      // Keep as A
    }
    else if (placeholder === 'ex) @, www') {
      await inp.click();
      await inp.fill('@');
    }
    else if (placeholder === 'ex) 1.1.1.1') {
      await inp.click();
      await inp.fill('199.36.158.100');
    }
  }
  
  await page.waitForTimeout(1000);
  await clickButton('저장');
  await clickButton('확인');
  await page.waitForTimeout(2000);

  // Show final state
  const finalText = await page.evaluate(() => {
    const body = document.body.innerText;
    const dnsStart = body.indexOf('DNS 레코드 관리');
    return body.substring(dnsStart, dnsStart + 600).replace(/\n/g, ' ');
  });
  console.log('\n=== Final DNS Records ===');
  console.log(finalText);

  await b.close();
})().catch(e => console.log('ERR:', e.message));

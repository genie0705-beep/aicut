const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  
  // Find hosting.kr details page
  for (let i = 0; i < pages.length; i++) {
    const u = pages[i].url();
    if (u.includes('details/aicut.co.kr')) { page = pages[i]; break; }
  }
  
  if (!page) {
    // Go there directly
    console.log('Navigating to hosting.kr DNS...');
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].url().includes('hosting.kr') || pages[i].url().includes('app.hosting.kr')) {
        page = pages[i];
        break;
      }
    }
    if (!page) { console.log('No hosting.kr page'); await b.close(); return; }
    await page.goto('https://app.hosting.kr/ko/domains/portfolio/details/aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  
  await page.bringToFront();
  await page.waitForTimeout(3000);

  // Click '네임서버/DNS' tab
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, span, div'));
    const dnsTab = els.find(el => 
      (el.innerText.trim() === '네임서버/DNS' || el.innerText.trim() === 'DNS') && el.offsetParent !== null
    );
    if (dnsTab) { dnsTab.click(); return true; }
    return false;
  });
  await page.waitForTimeout(2000);

  // Click '+ 새 레코드 추가' and try to add TXT record
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.trim().includes('새 레코드') && b.offsetParent !== null);
    if (addBtn) { addBtn.click(); return true; }
    return false;
  });
  await page.waitForTimeout(2000);

  // Fill in TXT record form
  const inputs = await page.locator('input').all();
  let filled = [];
  
  for (const inp of inputs) {
    const placeholder = await inp.getAttribute('placeholder') || '';
    const val = await inp.inputValue();
    
    if (placeholder === '' && val === 'A') {
      // This is the type field - change to TXT
      await inp.click();
      await inp.fill('TXT');
      filled.push('type->TXT');
    }
    else if (placeholder === 'ex) @, www') {
      await inp.click();
      await inp.fill('@');
      filled.push('host->@');
    }
    else if (placeholder === 'ex) 1.1.1.1') {
      await inp.click();
      await inp.fill('199.36.158.100');
      filled.push('value->199.36.158.100');
    }
    else if (placeholder === 'ex) 180') {
      // Check if this is a NEW record (TTL 180 is for A, for new records it might also be 180)
      // Skip the existing TTL field
    }
  }
  
  console.log('Filled:', filled.join(', '));

  // Now look for save button and submit
  await page.waitForTimeout(1000);
  
  const saveBtns = await page.locator('button').all();
  for (const btn of saveBtns) {
    const text = await btn.innerText();
    if (text.includes('저장') || text.includes('추가') || text.trim() === '확인') {
      await btn.click();
      console.log('Clicked:', text.trim());
      break;
    }
  }
  
  await page.waitForTimeout(3000);
  
  // Verify the result
  const txt = await page.evaluate(() => document.body.innerText.replace(/\n/g, '|'));
  const dnsIdx = txt.indexOf('DNS 레코드 관리');
  if (dnsIdx > 0) {
    console.log('DNS records after update:');
    console.log(txt.substring(dnsIdx, dnsIdx + 600));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message));

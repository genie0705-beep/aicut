const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  
  for (let i = 0; i < pages.length; i++) {
    const u = pages[i].url();
    if (u.includes('details/aicut.co.kr/dns')) { page = pages[i]; break; }
  }
  
  if (!page) {
    // Try to find any app.hosting.kr page
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].url().includes('app.hosting.kr')) { page = pages[i]; break; }
    }
    if (!page) { console.log('No hosting.kr page'); await b.close(); return; }
    await page.goto('https://app.hosting.kr/ko/domains/portfolio/details/aicut.co.kr/dns', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  
  await page.bringToFront();
  await page.goto('https://app.hosting.kr/ko/domains/portfolio/details/aicut.co.kr/dns', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  // Click 네임서버/DNS tab
  await page.evaluate(() => {
    const els = document.querySelectorAll('a, button, span, div');
    for (const el of els) {
      if (el.innerText && el.innerText.trim() === '네임서버/DNS' && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  await page.waitForTimeout(3000);

  // Delete 4 GitHub A records by clicking their delete buttons
  // After refresh, positions should be:
  // Row 1: A @ 185.199.108.153 - delete at y≈895
  // Row 2: A @ 185.199.109.153 - delete at y≈962
  // Row 3: A @ 185.199.110.153 - delete at y≈1028
  // Row 4: A @ 185.199.111.153 - delete at y≈1095
  
  const deleteY = [895, 962, 1028, 1095];
  
  for (const y of deleteY) {
    // Double check: find delete button at position (1783, y)
    const hasRecord = await page.evaluate((yPos) => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        if (b.offsetParent !== null) {
          const rect = b.getBoundingClientRect();
          if (Math.abs(rect.x - 1783) < 20 && Math.abs(rect.y - (yPos - 22)) < 20) {
            b.click();
            return true;
          }
        }
      }
      return false;
    }, y);
    
    if (hasRecord) {
      console.log('Deleted record at y=' + y);
      await page.waitForTimeout(2000);
      
      // Accept any confirmation dialog
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          const txt = b.innerText.trim();
          if ((txt === '삭제' || txt === '확인') && b.offsetParent !== null) {
            b.click();
            return;
          }
        }
      });
      await page.waitForTimeout(2000);
    } else {
      console.log('No delete button at y=' + y);
    }
  }
  
  // Now add TXT record
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText && b.innerText.trim().includes('새 레코드 추가') && b.offsetParent !== null) {
        b.click();
        return;
      }
    }
  });
  await page.waitForTimeout(2000);
  
  // Set type to TXT via native select
  await page.evaluate(() => {
    const nativeSelect = document.querySelector('.MuiSelect-nativeInput');
    if (nativeSelect) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(nativeSelect, 'TXT');
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1000);
  
  // Fill host and value
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const inp of inputs) {
      if (inp.placeholder === 'ex) @, www') {
        setter.call(inp, '@');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (inp.placeholder === 'ex) 1.1.1.1') {
        setter.call(inp, 'hosting-site=aicut-28ab5');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(500);
  
  // Save - click check icon (first form row at y≈799)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        // Look for small 24x24 icon buttons near (1603, 799)
        if (rect.width === 24 && rect.height === 24 && rect.x > 1580 && rect.x < 1620 && rect.y > 785 && rect.y < 815) {
          b.click();
          return;
        }
      }
    }
  });
  await page.waitForTimeout(2000);
  
  // Add A record for Firebase
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText && b.innerText.trim().includes('새 레코드 추가') && b.offsetParent !== null) {
        b.click();
        return;
      }
    }
  });
  await page.waitForTimeout(2000);
  
  // Fill A record - host=@, value=199.36.158.100
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const inp of inputs) {
      if (inp.placeholder === 'ex) @, www') {
        setter.call(inp, '@');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (inp.placeholder === 'ex) 1.1.1.1') {
        setter.call(inp, '199.36.158.100');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(500);
  
  // Check final state
  const txt = await page.evaluate(() => {
    const body = document.body.innerText;
    const idx = body.indexOf('DNS 레코드 관리');
    return body.substring(idx, idx + 600).replace(/\n/g, ' ');
  });
  console.log('=== FINAL DNS ===');
  console.log(txt);

  await b.close();
})().catch(e => console.log('ERR:', e.message));

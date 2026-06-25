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
  if (!page) { console.log('Page not found'); await b.close(); return; }
  
  await page.bringToFront();
  await page.goto('https://app.hosting.kr/ko/domains/portfolio/details/aicut.co.kr/dns', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Click 네임서버/DNS tab
  await page.evaluate(() => {
    const els = document.querySelectorAll('a, button, span, div');
    for (const el of els) {
      if (el.innerText && el.innerText.trim() === '네임서버/DNS' && el.offsetParent !== null) {
        el.click(); return;
      }
    }
  });
  await page.waitForTimeout(3000);

  // Delete ALL inline forms (close/cancel them first)
  // Find and click close buttons at the right side of any open forms
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        // Look for small buttons at far right (x > 1750) in form area (y 750-900)
        if (rect.x > 1750 && rect.y > 750 && rect.y < 920 && rect.width < 40 && rect.height < 40) {
          b.click();
          console.log('Close form btn');
        }
      }
    }
  });
  await page.waitForTimeout(2000);

  // Delete GitHub A records - find all buttons in GitHub IP rows
  let deleted = 0;
  for (let attempt = 0; attempt < 10; attempt++) {
    const result = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      let rightmostBtn = null;
      let maxX = 0;
      
      for (const b of btns) {
        if (b.offsetParent !== null) {
          const parentRow = b.closest('tr') || b.parentElement?.closest('tr') || b.parentElement;
          if (parentRow && parentRow.innerText && parentRow.innerText.includes('185.199.')) {
            const rect = b.getBoundingClientRect();
            if (rect.x > maxX && rect.x > 1700) {
              maxX = rect.x;
              rightmostBtn = { el: b, x: rect.x, y: rect.y };
            }
          }
        }
      }
      return rightmostBtn ? { x: rightmostBtn.x, y: rightmostBtn.y } : null;
    });

    if (!result) {
      console.log('No more GitHub records to delete after ' + deleted + ' deletions');
      break;
    }

    await page.mouse.click(result.x, result.y);
    await page.waitForTimeout(1000);

    // Accept any dialog - find visible dialog buttons
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        const txt = b.innerText.trim();
        if ((txt === '삭제' || txt === '확인' || txt.includes('삭제')) && b.offsetParent !== null) {
          b.click(); return;
        }
      }
    });
    await page.waitForTimeout(1500);
    deleted++;
    console.log('Deleted GitHub record #' + deleted);
  }

  // Close any remaining open form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        if (rect.x > 1750 && rect.y > 750 && rect.y < 920 && rect.width < 40) {
          b.click();
        }
      }
    }
  });
  await page.waitForTimeout(1500);

  // Add TXT record
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText && b.innerText.trim() === '+ 새 레코드 추가' && b.offsetParent !== null) {
        b.click(); return;
      }
    }
  });
  await page.waitForTimeout(2000);

  // Set type to TXT
  await page.evaluate(() => {
    const sel = document.querySelector('.MuiSelect-nativeInput');
    if (sel) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(sel, 'TXT');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(500);

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

  // Find the check/save icon in the new form row
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        // Save icon: 24x24 box in the form area (y 780-820, x 1580-1650)
        if (rect.y > 780 && rect.y < 830 && rect.x > 1580 && rect.x < 1650 && rect.width === 24) {
          b.click(); return;
        }
      }
    }
  });
  await page.waitForTimeout(2000);

  // Add A record
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.innerText && b.innerText.trim() === '+ 새 레코드 추가' && b.offsetParent !== null) {
        b.click(); return;
      }
    }
  });
  await page.waitForTimeout(2000);

  // Fill A record
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

  // Save A record
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        if (rect.y > 780 && rect.y < 830 && rect.x > 1580 && rect.x < 1650 && rect.width === 24) {
          b.click(); return;
        }
      }
    }
  });
  await page.waitForTimeout(2000);

  // Final state
  const finalText = await page.evaluate(() => {
    const body = document.body.innerText;
    const idx = body.indexOf('DNS 레코드 관리');
    return body.substring(idx, idx + 500).replace(/\n/g, ' ');
  });
  console.log('=== RESULT ===');
  console.log(finalText);

  await b.close();
})().catch(e => console.log('ERR:', e.message));

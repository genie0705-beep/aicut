const { chromium } = require('playwright');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  // Connect to existing Chrome via CDP
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  
  // Get all contexts and pages
  const contexts = browser.contexts();
  console.log(`Found ${contexts.length} browser contexts`);
  
  let dnsPage = null;
  let firebasePage = null;
  
  for (const context of contexts) {
    const pages = context.pages();
    for (const page of pages) {
      const url = page.url();
      console.log(`Page: ${url.slice(0, 120)}`);
      if (url.includes('app.hosting.kr') && url.includes('dns')) {
        dnsPage = page;
        console.log('  -> DNS page found!');
      }
      if (url.includes('console.firebase.google.com') && url.includes('domains')) {
        firebasePage = page;
        console.log('  -> Firebase domain page found!');
      }
    }
  }
  
  if (!dnsPage) {
    console.error('ERROR: DNS page not found!');
    await browser.close();
    return;
  }
  
  // Enable dialogs auto-accept
  dnsPage.on('dialog', async dialog => {
    console.log(`Dialog: ${dialog.type()} - ${dialog.message().slice(0, 100)}`);
    if (dialog.type() === 'confirm' || dialog.type() === 'alert') {
      await dialog.accept();
      console.log('  -> Accepted dialog');
    }
  });
  
  // STEP 1: Take a screenshot to see the current state
  await sleep(2000);
  await dnsPage.screenshot({ path: 'dns-before.png', fullPage: true });
  console.log('Screenshot saved: dns-before.png');
  
  // STEP 2: Get the page HTML to understand structure
  const html = await dnsPage.content();
  fs.writeFileSync('dns-page.html', html);
  console.log(`Page HTML saved (${html.length} chars)`);
  
  // STEP 3: Find and click delete buttons for GitHub A records
  // The IPs are: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
  
  // Let's look for delete buttons near cells containing these IPs
  const deleteButtons = await dnsPage.evaluate(() => {
    // Find table rows containing GitHub IPs
    const results = [];
    const ips = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
    
    // Try to find cells containing these IPs
    const allCells = document.querySelectorAll('td, div, span, p, [class*="value"], [class*="ip"], [class*="address"]');
    
    for (const cell of allCells) {
      const text = cell.textContent.trim();
      if (ips.includes(text)) {
        const rect = cell.getBoundingClientRect();
        results.push({ ip: text, x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        
        // Look for nearby delete buttons
        const row = cell.closest('tr, [class*="row"], [class*="item"], li');
        if (row) {
          const deleteBtn = row.querySelector('[data-testid*="delete"], [data-testid*="Delete"], [data-testid*="remove"], [data-testid*="Remove"], button[class*="delete"], button[class*="remove"], button[class*="trash"], svg[class*="delete"], svg[class*="trash"], path[d*="M19"], [aria-label*="delete" i], [aria-label*="remove" i], [aria-label*="trash" i]');
          if (deleteBtn) {
            const dRect = deleteBtn.getBoundingClientRect();
            results.push({ type: 'deleteBtn', ip: text, x: dRect.x, y: dRect.y, width: dRect.width, height: dRect.height, tag: deleteBtn.tagName, className: deleteBtn.className });
          }
        }
        
        // Also search the entire row for any clickable delete icon
        if (row) {
          const allButtons = row.querySelectorAll('button, a, [role="button"], svg, i[class*="trash"], i[class*="delete"], span[class*="trash"], span[class*="delete"]');
          allButtons.forEach(btn => {
            const bRect = btn.getBoundingClientRect();
            results.push({ type: 'rowButton', ip: text, x: bRect.x, y: bRect.y, width: bRect.width, height: bRect.height, tag: btn.tagName, className: btn.className, text: btn.textContent?.trim().slice(0, 30) });
          });
        }
      }
    }
    
    return results;
  });
  
  console.log('Delete buttons found:', JSON.stringify(deleteButtons, null, 2));
  
  // Find the row containing "185" and the A record type
  const dnsRows = await dnsPage.evaluate(() => {
    const rows = document.querySelectorAll('tr, [class*="row"], [class*="list-item"], li');
    const result = [];
    rows.forEach((row, idx) => {
      const text = row.textContent.trim();
      const rect = row.getBoundingClientRect();
      result.push({ index: idx, text: text.slice(0, 200), x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    });
    return result;
  });
  
  console.log('\n=== DNS Table Rows ===');
  for (const row of dnsRows) {
    if (row.text.includes('185.') || row.text.includes('A') || row.text.includes('TXT') || row.text.includes('레코드') || row.text.includes('추가') || row.text.includes('IP')) {
      console.log(`[${row.index}] y=${row.y.toFixed(0)} h=${row.height.toFixed(0)}: ${row.text.slice(0, 150)}`);
    }
  }
  
  // Let's try a different approach - find the delete buttons directly
  const deleteBtnInfo = await dnsPage.evaluate(() => {
    const results = [];
    
    // Find all SVG elements that might be delete buttons
    const allSvgs = document.querySelectorAll('svg');
    allSvgs.forEach((svg, idx) => {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 20 && rect.height > 20) {
        const html = svg.outerHTML.slice(0, 200);
        results.push({ idx, tag: 'svg', x: rect.x, y: rect.y, w: rect.width, h: rect.height, html });
      }
    });
    
    // Find all buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach((btn, idx) => {
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        results.push({ idx, tag: 'button', x: rect.x, y: rect.y, w: rect.width, h: rect.height, text: btn.textContent?.trim().slice(0, 50), class: btn.className?.slice(0, 80), 'data-testid': btn.getAttribute('data-testid') });
      }
    });
    
    return results;
  });
  
  console.log('\n=== All sizable SVG/Button elements ===');
  for (const el of deleteBtnInfo) {
    console.log(`[${el.idx}] ${el.tag} @ (${el.x.toFixed(0)}, ${el.y.toFixed(0)}) ${el.w.toFixed(0)}x${el.h.toFixed(0)} ${el.text || ''} ${el.class || ''} ${el['data-testid'] || ''}`);
  }
  
  // Check for "새 레코드 추가" button
  const addBtnInfo = await dnsPage.evaluate(() => {
    const results = [];
    const allElements = document.querySelectorAll('button, a, span, div, [role="button"]');
    allElements.forEach((el, idx) => {
      const text = el.textContent?.trim() || '';
      if (text.includes('레코드 추가') || text.includes('추가') || text.includes('Add record') || text.includes('add')) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          results.push({ idx, x: rect.x, y: rect.y, w: rect.width, h: rect.height, text: text.slice(0, 40), tag: el.tagName });
        }
      }
    });
    return results;
  });
  
  console.log('\n=== Add Record Buttons ===');
  for (const btn of addBtnInfo) {
    console.log(`@ (${btn.x.toFixed(0)}, ${btn.y.toFixed(0)}) ${btn.w.toFixed(0)}x${btn.h.toFixed(0)} "${btn.text}"`);
  }
  
  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

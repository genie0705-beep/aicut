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
  
  if (!dnsPage) { console.error('DNS page not found'); await browser.close(); return; }
  
  // Auto-accept dialogs
  dnsPage.on('dialog', async dialog => {
    console.log(`Dialog: ${dialog.type()} - ${dialog.message().slice(0, 100)}`);
    await dialog.accept();
  });
  
  await sleep(2000);
  
  // === PART 1: Find all 4 GitHub A records and delete them ===
  console.log('\n=== STEP 1: Finding GitHub A records ===');
  
  const ghRecordInfo = await dnsPage.evaluate(() => {
    const ips = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
    const results = [];
    
    // Find all buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      const text = btn.textContent.trim();
      if (ips.includes(text.trim())) {
        const rect = btn.getBoundingClientRect();
        results.push({ type: 'IP_CELL', idx, text: text.trim(), x: rect.x, y: rect.y, w: rect.width, h: rect.height });
        
        // Find the delete button in the same row
        let parent = btn.parentElement;
        for (let i = 0; i < 10 && parent; i++) {
          const deleteBtns = parent.querySelectorAll('button.gtm-record-delete, button.MuiIconButton-root');
          deleteBtns.forEach(delBtn => {
            const dRect = delBtn.getBoundingClientRect();
            results.push({ type: 'DELETE_BTN', idx: idx, forIp: text.trim(), x: dRect.x, y: dRect.y, w: dRect.width, h: dRect.height, class: delBtn.className });
          });
          parent = parent.parentElement;
        }
      }
    });
    return results;
  });
  
  console.log('GitHub record info:', JSON.stringify(ghRecordInfo, null, 2));
  
  // Also check rows above - maybe 108.153 is in different position
  const allRows = await dnsPage.evaluate(() => {
    const results = [];
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      const rect = btn.getBoundingClientRect();
      if (rect.y >= 880 && rect.y <= 1020 && rect.width >= 30) {
        results.push({ idx, text: btn.textContent.trim().slice(0, 30), x: rect.x, y: rect.y, w: rect.width, h: rect.height, class: btn.className.slice(0, 60) });
      }
    });
    return results;
  });
  
  console.log('\n=== All buttons in y=880..1020 ===');
  for (const r of allRows) {
    console.log(`[${r.idx}] @(${r.x.toFixed(0)},${r.y.toFixed(0)}) ${r.w.toFixed(0)}x${r.h.toFixed(0)} "${r.text}" ${r.class}`);
  }
  
  // Check the row structure more carefully for the area between 880-1020
  const areaInfo = await dnsPage.evaluate(() => {
    const results = [];
    // Check the table structure
    const tables = document.querySelectorAll('table');
    tables.forEach((t, ti) => {
      results.push({ table: ti, rows: t.querySelectorAll('tr').length });
      t.querySelectorAll('tr').forEach((row, ri) => {
        const rect = row.getBoundingClientRect();
        if (rect.y >= 800 && rect.y <= 1300) {
          results.push({ row: ri, y: rect.y, h: rect.height, text: row.textContent.trim().slice(0, 100) });
        }
      });
    });
    return results;
  });
  
  console.log('\n=== Table rows in y=800..1300 ===');
  for (const r of areaInfo) {
    console.log(`table=${r.table} row=${r.row} y=${r.y.toFixed(0)} h=${r.h.toFixed(0)}: "${r.text}"`);
  }
  
  await dnsPage.screenshot({ path: 'dns-row-area.png', fullPage: false, clip: { x: 400, y: 850, width: 1500, height: 500 } });
  console.log('Screenshot taken: dns-row-area.png');
  
  await browser.close();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });

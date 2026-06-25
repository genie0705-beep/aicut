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
  
  // === Find ALL A record rows with GitHub IPs ===
  const gitHubRows = await dnsPage.evaluate(() => {
    const results = [];
    const buttons = document.querySelectorAll('button');
    const gitHubIps = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
    
    buttons.forEach(btn => {
      const text = btn.textContent.trim();
      if (gitHubIps.includes(text)) {
        const rect = btn.getBoundingClientRect();
        results.push({ ip: text, y: rect.y, x: rect.x });
      }
    });
    return results;
  });
  
  console.log('GitHub IP rows found:', JSON.stringify(gitHubRows, null, 2));
  
  // Find all gtm-record-delete buttons (the delete buttons)
  const allDeleteBtns = await dnsPage.evaluate(() => {
    const results = [];
    const deleteBtns = document.querySelectorAll('button.gtm-record-delete');
    deleteBtns.forEach((btn, idx) => {
      const rect = btn.getBoundingClientRect();
      // Get the row content
      let row = btn.parentElement;
      for (let i = 0; i < 5 && row; i++) {
        if (row.textContent.trim().includes('185.199.') || row.textContent.includes('A')) break;
        row = row.parentElement;
      }
      const rowText = row ? row.textContent.trim().slice(0, 100) : 'unknown';
      results.push({ idx, y: rect.y, row_text: rowText });
    });
    return results;
  });
  
  console.log('\nAll gtm-record-delete buttons:');
  for (const db of allDeleteBtns) {
    console.log(`  y=${db.y.toFixed(0)}: ${db.row_text}`);
  }
  
  // The 3 GitHub A record delete buttons should be the first ones (lowest y values for A records)
  // Before CNAME, MX, TXT records which come later
  
  // Filter to find the ones that are in GitHub A record rows
  // Let's get ALL rows data to understand which delete btn corresponds to which record
  const allRecordRows = await dnsPage.evaluate(() => {
    const results = [];
    // Find all buttons that look like record type buttons (A, CNAME, MX, TXT)
    const allBtns = document.querySelectorAll('button');
    const deleteBtns = document.querySelectorAll('button.gtm-record-delete');
    
    // For each "A" or type button, get its row info
    const typeMap = {};
    allBtns.forEach(btn => {
      const text = btn.textContent.trim();
      if (['A', 'CNAME', 'MX', 'TXT'].includes(text)) {
        const rect = btn.getBoundingClientRect();
        // Find closest delete button
        let minDist = Infinity;
        let closestDelete = null;
        deleteBtns.forEach(del => {
          const dRect = del.getBoundingClientRect();
          const dist = Math.abs(dRect.y - rect.y);
          if (dist < minDist) { minDist = dist; closestDelete = dRect; }
        });
        
        // Get the value for this row (look for IP/hostname text)
        let row = btn.parentElement;
        for (let i = 0; i < 10 && row; i++) {
          row = row.parentElement;
        }
        
        results.push({ 
          type: text, 
          btn_y: rect.y,
          delete_y: closestDelete ? closestDelete.y : -1,
          delete_x: closestDelete ? closestDelete.x : -1,
        });
      }
    });
    return results;
  });
  
  console.log('\nRecord rows with delete buttons:');
  for (const row of allRecordRows) {
    console.log(`  Type=${row.type} btn_y=${row.btn_y.toFixed(0)} delete_btn=(${row.delete_x.toFixed(0)}, ${row.delete_y.toFixed(0)})`);
  }
  
  await browser.close();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });

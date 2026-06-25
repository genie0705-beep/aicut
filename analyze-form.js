const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const dnsPage = context.pages().find(p => p.url().includes('app.hosting.kr') && p.url().includes('dns'));
  
  if (!dnsPage) { console.error('DNS page not found'); await browser.close(); return; }
  
  // Get the relevant portion of the page HTML (DNS records area)
  const dnsHtml = await dnsPage.evaluate(() => {
    // Find the DNS records container
    const containers = document.querySelectorAll('[class*="dns"], [class*="record"], [class*="MuiTable"], section, main, div[class*="container"]');
    
    // Find the area containing DNS records (between y=525 to y=1600 roughly)
    const allElements = document.querySelectorAll('*');
    const results = [];
    let capturing = false;
    
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.y >= 500 && rect.y <= 900 && rect.width > 0) {
        const tag = el.tagName.toLowerCase();
        if (['input', 'select', 'textarea', 'button', 'div', 'span', 'svg', 'path'].includes(tag)) {
          const classStr = (typeof el.className === 'string') ? el.className.slice(0, 80) : '';
          const id = el.id?.slice(0, 40) || '';
          const text = (el.textContent || '').trim().slice(0, 60);
          const val = el.value || '';
          const role = el.getAttribute('role') || '';
          const dataTestId = el.getAttribute('data-testid') || el.getAttribute('data-test') || '';
          
          results.push({ tag, y: rect.y.toFixed(0), x: rect.x.toFixed(0), w: rect.width.toFixed(0), h: rect.height.toFixed(0), text, val, id, class: classStr, role, 'data-testid': dataTestId });
        }
      }
    });
    return results;
  });
  
  console.log('=== Elements in y=500..900 ===');
  for (const el of dnsHtml) {
    console.log(`[${el.tag}] @(${el.x},${el.y}) ${el.w}x${el.h} | text="${el.text}" val="${el.val}" id="${el.id}" class="${el.class}" role="${el.role}" data-testid="${el['data-testid']}"`);
  }
  
  // Also check for any inline editing mode (MUI fields)
  const inlineEdits = await dnsPage.evaluate(() => {
    const results = [];
    // Look for input fields that might be inline editing
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    inputs.forEach((inp, idx) => {
      const rect = inp.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.y > 500) {
        const classStr = typeof inp.className === 'string' ? inp.className.slice(0, 80) : '';
        results.push({
          idx, tag: inp.tagName,
          type: inp.type, val: inp.value,
          placeholder: inp.placeholder || '',
          id: inp.id?.slice(0, 40) || '',
          class: classStr,
          x: rect.x.toFixed(0), y: rect.y.toFixed(0), w: rect.width.toFixed(0), h: rect.height.toFixed(0),
          'data-testid': inp.getAttribute('data-testid') || ''
        });
      }
    });
    
    // Also look for MUI select triggers
    const selectTriggers = document.querySelectorAll('[role="combobox"], [role="listbox"], .MuiSelect-select');
    selectTriggers.forEach((sel, idx) => {
      const rect = sel.getBoundingClientRect();
      if (rect.y > 500) {
        const classStr = typeof sel.className === 'string' ? sel.className.slice(0, 80) : '';
        results.push({
          idx: idx + 100, tag: sel.tagName,
          role: sel.getAttribute('role') || '',
          text: sel.textContent?.trim().slice(0, 40) || '',
          id: sel.id?.slice(0, 40) || '',
          class: classStr,
          x: rect.x.toFixed(0), y: rect.y.toFixed(0), w: rect.width.toFixed(0), h: rect.height.toFixed(0)
        });
      }
    });
    
    return results;
  });
  
  console.log('\n=== Input/Select elements (y>500) ===');
  for (const el of inlineEdits) {
    console.log(`[${el.idx}] ${el.tag} type="${el.type}" role="${el.role}" @(${el.x},${el.y}) ${el.w}x${el.h} val="${el.val}" placeholder="${el.placeholder}" id="${el.id}" class="${el.class}" data-testid="${el['data-testid']}" text="${el.text}"`);
  }
  
  // Also find any visible MUI select boxes
  const muiSelects = await dnsPage.evaluate(() => {
    const results = [];
    document.querySelectorAll('[class*="MuiSelect"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.y > 500 && rect.width > 0) {
        const classStr = typeof el.className === 'string' ? el.className.slice(0, 80) : '';
        results.push({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 30) || '',
          y: rect.y.toFixed(0),
          class: classStr
        });
      }
    });
    return results;
  });
  
  console.log('\n=== MUI Select elements ===');
  for (const el of muiSelects) {
    console.log(`  ${el.tag} y=${el.y} text="${el.text}" class="${el.class}"`);
  }
  
  await browser.close();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });

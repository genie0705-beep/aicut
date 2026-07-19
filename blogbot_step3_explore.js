const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find the postupdate page
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postupdate') && p.url().includes('224341544476')) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('❌ Editor page not found');
    return;
  }

  console.log('Editor page found!');
  await page.bringToFront();
  await page.waitForTimeout(2000);

  // The SE4 editor is directly on the page, not in an iframe
  const f = page;  // Use page directly (SmartEditor on the page)

  // Explore EditingService in detail
  console.log('\n=== EditingService API ===');
  const esInfo = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const es = ed._editingService;
    if (!es) return 'no editingService';

    const result = {};
    // Get all method names
    let obj = es;
    const methods = new Set();
    while (obj && obj !== Object.prototype) {
      Object.getOwnPropertyNames(obj).forEach(p => {
        if (typeof obj[p] === 'function' && p !== 'constructor') methods.add(p);
      });
      obj = Object.getPrototypeOf(obj);
    }

    methods.forEach(m => {
      try {
        result[m] = es[m].length;
      } catch(e) {}
    });

    return result;
  });
  console.log(JSON.stringify(esInfo, null, 2));

  // Explore DocumentService
  console.log('\n=== DocumentService API ===');
  const dsInfo = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    if (!ds) return 'no documentService';

    const methods = new Set();
    let obj = ds;
    while (obj && obj !== Object.prototype) {
      Object.getOwnPropertyNames(obj).forEach(p => {
        if (typeof obj[p] === 'function' && p !== 'constructor') methods.add(p);
      });
      obj = Object.getPrototypeOf(obj);
    }

    const result = {};
    methods.forEach(m => {
      try {
        result[m] = ds[m].length;
      } catch(e) {}
    });
    return result;
  });
  console.log(JSON.stringify(dsInfo, null, 2));

  // Get current document body structure
  console.log('\n=== Document Structure ===');
  const docStruct = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed._document;

    try {
      if (doc && doc.getBody) {
        const body = doc.getBody();
        if (body && body.getChildren) {
          const children = body.getChildren();
          return Array.from(children).map((c, i) => {
            const type = c['@ctype'] || c.type || c.constructor?.name || '?';
            let text = '';
            try { text = (c.innerText || '').substring(0, 40); } catch(e) {}
            return { idx: i, type, text };
          });
        }
      }
    } catch(e) {
      return { error: e.message };
    }

    // Alternative: get document data
    try {
      const data = ed.getDocumentData();
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      // Find all component types
      const comps = str.match(/se-component[^>]*se-(image|text|video|line|sticker|link)/g) || [];
      return { dataLength: str.length, components: comps.slice(0, 30) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(JSON.stringify(docStruct, null, 2));

  // Check the save/publish buttons
  console.log('\n=== 저장/발행 버튼 ===');
  const saveBtns = await f.evaluate(() => {
    const results = [];
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = btn.textContent.trim();
      if (text === '발행' || text === '저장' || text === '저장하기' || text.includes('발행') || text.includes('저장')) {
        const r = btn.getBoundingClientRect();
        results.push({
          text: text,
          rect: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
          visible: btn.offsetParent !== null,
          cls: (btn.className || '').substring(0, 50),
          id: btn.id || ''
        });
      }
    }
    return results;
  });

  if (saveBtns.length > 0) {
    console.log(JSON.stringify(saveBtns, null, 2));
  } else {
    console.log('No save/publish buttons in frame. Checking main page...');
    // Also check the main page
    const mainBtns = await page.evaluate(() => {
      const results = [];
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = btn.textContent.trim();
        if (text === '발행' || text === '저장' || text === '저장하기' || text.includes('발행') || text.includes('저장')) {
          results.push({
            text: text,
            visible: btn.offsetParent !== null,
            cls: (btn.className || '').substring(0, 50)
          });
        }
      }
      return results;
    });
    console.log(JSON.stringify(mainBtns, null, 2));
  }

  // Test if we can use the 사진 (photo) button
  console.log('\n=== 사진 버튼 찾기 ===');
  const photoBtns = await f.evaluate(() => {
    const results = [];
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = btn.textContent.trim();
      const title = btn.getAttribute('title') || '';
      const html = btn.innerHTML.toLowerCase();
      if (text.includes('사진') || title.includes('사진') || html.includes('사진') || text.includes('photo') || text.includes('image')) {
        results.push({
          text: text,
          title: title,
          visible: btn.offsetParent !== null,
          cls: (btn.className || '').substring(0, 50),
          html: btn.innerHTML.substring(0, 50)
        });
      }
    }
    return results;
  });
  console.log(JSON.stringify(photoBtns, null, 2));

})().catch(e => console.log('E:', e.message));

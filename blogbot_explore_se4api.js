const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find editor page
  let editorPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postupdate')) {
      editorPage = p;
      break;
    }
  }

  if (!editorPage) {
    // Open blog → click 수정
    editorPage = await ctx.newPage();
    await editorPage.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 15000 });
    await editorPage.waitForTimeout(4000);

    const mfEl = await editorPage.$('iframe[name="mainFrame"]');
    if (mfEl) {
      const mf = await mfEl.contentFrame();
      if (mf) {
        await mf.evaluate(() => {
          const links = document.querySelectorAll('a');
          for (const link of links) {
            if (link.textContent.trim() === '수정' && link.getAttribute('href')?.includes('suggestConvert')) {
              link.click();
              return;
            }
          }
        });
        await editorPage.waitForTimeout(5000);
      }
    }

    // Find postupdate page
    for (const p of ctx.pages()) {
      if (p.url().includes('postupdate')) {
        editorPage = p;
        break;
      }
    }
  }

  if (!editorPage) {
    console.log('❌ Editor page not found');
    return;
  }

  console.log('Editor URL:', editorPage.url());

  // Get the editor frame (mainFrame)
  const mfEl = await editorPage.$('iframe[name="mainFrame"]');
  if (!mfEl) {
    console.log('❌ mainFrame not found');
    return;
  }

  const f = await mfEl.contentFrame();
  if (!f) {
    console.log('❌ Cannot access mainFrame');
    return;
  }

  // Explore EditingService API
  console.log('\n=== _editingService Methods ===');
  const editingMethods = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const es = ed._editingService;
    if (!es) return 'editingService is null';

    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(es));
    const own = Object.getOwnPropertyNames(es);
    return {
      proto: proto.filter(p => p !== 'constructor'),
      own: own.filter(p => !p.startsWith('_')),
    };
  });
  console.log(JSON.stringify(editingMethods, null, 2));

  // Explore DocumentService API
  console.log('\n=== _documentService Methods ===');
  const docMethods = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    if (!ds) return 'documentService is null';

    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(ds));
    return proto.filter(p => p !== 'constructor');
  });
  console.log(JSON.stringify(docMethods, null, 2));

  // Explore document object
  console.log('\n=== Document info ===');
  const docInfo = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed._document;
    if (!doc) return { error: 'no document' };

    const docMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(doc));
    const docOwn = Object.getOwnPropertyNames(doc);

    // Get document data (the raw data)
    let data = null;
    try {
      data = ed.getDocumentData();
    } catch(e) {
      data = 'error: ' + e.message;
    }

    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    return {
      methods: docMethods.filter(p => p !== 'constructor'),
      own: docOwn.filter(p => !p.startsWith('_')),
      dataLength: dataStr.length,
      dataPreview: dataStr.substring(0, 200),
    };
  });
  console.log(JSON.stringify(docInfo, null, 2));

  // Check the editingService.write function
  console.log('\n=== _editingService.write() details ===');
  const writeInfo = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const es = ed._editingService;
    if (es && es.write) {
      return {
        writeType: typeof es.write,
        writeLength: es.write.length,
        writeStr: es.write.toString().substring(0, 300),
      };
    }
    return 'write not found';
  });
  console.log(JSON.stringify(writeInfo, null, 2));

  // Get document body components structure
  console.log('\n=== 현재 문서 컴포넌트 구조 ===');
  const docStructure = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed._document;
    if (!doc) return 'no doc';
    
    // Try to get document body
    try {
      // getBody if available
      if (doc.getBody) {
        const body = doc.getBody();
        if (body) {
          const children = body.getChildren ? body.getChildren() : [];
          return {
            childCount: children.length,
            children: Array.from(children).slice(0, 20).map((c, i) => ({
              index: i,
              type: c.constructor ? c.constructor.name : 'unknown',
              '@ctype': c['@ctype'] || c.type || 'unknown',
              tag: c.tag || '',
              text: (c.innerText || '').substring(0, 60),
            }))
          };
        }
      }
    } catch(e) {
      return { error: e.message };
    }

    // Alternative: get document data as JSON and parse
    try {
      const data = ed.getDocumentData();
      if (typeof data === 'string') {
        return { dataType: 'string', length: data.length, preview: data.substring(0, 300) };
      }
      // Try HTML
      return { dataType: typeof data };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(JSON.stringify(docStructure, null, 2));

  // Close without exiting browser
})().catch(e => console.log('E:', e.message));

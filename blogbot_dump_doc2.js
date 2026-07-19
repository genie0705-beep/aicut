const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find the page that has mainFrame with postupdate
  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        const url = f.url();
        if (url.includes('postupdate')) {
          console.log('Found postupdate in mainFrame:', url.substring(0, 80));

          // Check SmartEditor
          const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
          console.log('Has SE4:', hasSE);

          if (hasSE) {
            // Get document data
            const docData = await f.evaluate(() => {
              const ed = SmartEditor._editors['blogpc001'];
              return ed.getDocumentData();
            });

            console.log('Doc type:', typeof docData);
            console.log('Doc keys:', Object.keys(docData));

            const doc = docData.document;
            console.log('\nDocument keys:', Object.keys(doc));

            for (const key of Object.keys(doc)) {
              const val = doc[key];
              if (Array.isArray(val)) {
                console.log(`${key}: Array(${val.length})`);
                if (val.length > 0) {
                  console.log('  First:', JSON.stringify(val[0]).substring(0, 400));
                }
              } else if (typeof val === 'object' && val !== null) {
                console.log(`${key}: Object {${Object.keys(val).join(', ')}}`);
                if (val.components) {
                  console.log(`  components: Array(${val.components.length})`);
                  val.components.forEach((c, i) => {
                    const str = JSON.stringify(c);
                    console.log(`    [${i}]: ${str.substring(0, 300)}`);
                  });
                }
              } else {
                console.log(`${key}: ${typeof val} =`, String(val).substring(0, 100));
              }
            }

            // Save full dump
            fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\se4_doc_dump.json', JSON.stringify(docData, null, 2));
            console.log('\nSaved to se4_doc_dump.json');
          }
          break;
        }
      }
    }
  }

  await b.close();
})().catch(e => console.log('E:', e.message));

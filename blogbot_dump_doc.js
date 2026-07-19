// SE4 Document 데이터 구조 분석
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url() === 'https://blog.naver.com/aicut') {
      page = p;
      break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }

  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('no mf'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('no mf content'); await b.close(); return; }

  // Get document data
  const docData = await mf.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    return data;
  });

  console.log('=== Document Data Structure ===');
  console.log('Type:', typeof docData);
  console.log('Keys:', Object.keys(docData));

  // Save full dump
  const dumpPath = path.join('C:\\Users\\paul\\.openclaw\\workspace', 'se4_doc_dump.json');
  fs.writeFileSync(dumpPath, JSON.stringify(docData, null, 2));
  console.log('Saved to se4_doc_dump.json');

  // Analyze document structure
  const doc = docData.document;
  console.log('\n=== document object ===');
  console.log('Keys:', Object.keys(doc));

  // Look at each key
  for (const key of Object.keys(doc)) {
    const val = doc[key];
    if (Array.isArray(val)) {
      console.log(`\n${key}: Array(${val.length})`);
      if (val.length > 0) {
        console.log('  First item keys:', Object.keys(val[0]).slice(0, 10));
        console.log('  First item preview:', JSON.stringify(val[0]).substring(0, 400));
      }
    } else if (typeof val === 'object' && val !== null) {
      console.log(`\n${key}: Object`);
      console.log('  Keys:', Object.keys(val));
      // If it has components, show them
      if (val.components) {
        console.log(`  components: Array(${val.components.length})`);
        val.components.forEach((c, i) => {
          console.log(`    [${i}]: ${JSON.stringify(c).substring(0, 200)}`);
        });
      }
      if (val.paragraphs) {
        console.log(`  paragraphs: Array(${val.paragraphs.length})`);
      }
    } else {
      console.log(`\n${key}: ${typeof val} =`, String(val).substring(0, 100));
    }
  }

  await b.close();
})().catch(e => console.log('E:', e.message));

// SE4 데이터 포맷 상세 분석
const { chromium } = require('playwright');
const fs = require('fs');

const LOG_NO = '224341544476';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postupdate') && p.url().includes(LOG_NO)) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('❌ Editor page not found'); await b.close(); return; }

  console.log('✅ Editor page found');

  // Get raw document data
  const rawData = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    return data;
  });

  console.log('Data type:', typeof rawData);
  if (typeof rawData === 'object') {
    console.log('Is array:', Array.isArray(rawData));
    console.log('Keys:', Object.keys(rawData).slice(0, 20));
    console.log('JSON length:', JSON.stringify(rawData).length);

    // Save to file for analysis
    fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\se4_data_dump.json', JSON.stringify(rawData, null, 2));
    console.log('Saved to se4_data_dump.json');

    // Show first 10 items if array, or top-level structure
    if (Array.isArray(rawData)) {
      rawData.slice(0, 3).forEach((item, i) => {
        console.log(`\nItem ${i}:`, JSON.stringify(item).substring(0, 500));
      });
    } else if (rawData.body) {
      console.log('Has body:', typeof rawData.body);
      console.log('Body keys:', Object.keys(rawData.body).slice(0, 10));
      if (rawData.body.components) {
        console.log('Body components:', rawData.body.components.length);
        rawData.body.components.slice(0, 5).forEach((c, i) => {
          console.log(`  Comp ${i}:`, JSON.stringify(c).substring(0, 400));
        });
      }
    } else if (rawData.components) {
      console.log('Has components array:', rawData.components.length);
      rawData.components.slice(0, 5).forEach((c, i) => {
        console.log(`  Comp ${i}:`, JSON.stringify(c).substring(0, 400));
      });
    }
  } else if (typeof rawData === 'string') {
    console.log('String data (first 500 chars):', rawData.substring(0, 500));
  }

  // Also check _editingService.append() signature
  console.log('\n\n=== _editingService.append method ===');
  const appendInfo = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const es = ed._editingService;
    if (es && es.append) {
      return {
        params: es.append.length,
        str: es.append.toString().substring(0, 400)
      };
    }
    return 'not found';
  });
  console.log(JSON.stringify(appendInfo, null, 2));

  // Check insert method
  console.log('\n=== _editingService.insert method ===');
  const insertInfo = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    if (ed._editingService && ed._editingService.insert) {
      return {
        params: ed._editingService.insert.length,
        str: ed._editingService.insert.toString().substring(0, 400)
      };
    }
    return 'not found';
  });
  console.log(JSON.stringify(insertInfo, null, 2));

  // Check _editingService.insertComponentsWithData
  console.log('\n=== insertComponentsWithData method ===');
  const icwdInfo = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    if (ed._editingService && ed._editingService.insertComponentsWithData) {
      return {
        params: ed._editingService.insertComponentsWithData.length,
        str: ed._editingService.insertComponentsWithData.toString().substring(0, 400)
      };
    }
    return 'not found';
  });
  console.log(JSON.stringify(icwdInfo, null, 2));

  await b.close();
})().catch(e => console.log('E:', e.message));

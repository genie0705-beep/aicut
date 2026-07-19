// SE4 이미지 업로드 v3 - SE4 내부 uploadService 활용
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BLOG_ID = 'aicut';
const LOG_NO = '224341544476';
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

const images = [
  { file: 'aicut_implant_main.png', label: '대표 이미지' },
  { file: 'aicut_implant_card1.png', label: '본문카드1' },
  { file: 'aicut_implant_card2.png', label: '본문카드2' },
  { file: 'aicut_implant_card3.png', label: '본문카드3' },
  { file: 'aicut_implant_cta.png', label: 'CTA 이미지' },
];

(async () => {
  console.log('=== SE4 내부 uploadService 활용 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find editor page
  let page = null;
  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
            page = p;
            break;
          }
        } catch(e) {}
      }
    }
    if (page) break;
  }

  if (!page) {
    page = await ctx.newPage();
    page.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    const mfEl = await page.$('iframe[name="mainFrame"]');
    if (!mfEl) { console.log('mainFrame 없음'); await b.close(); return; }
    const mf = await mfEl.contentFrame();
    if (!mf) { console.log('접근 불가'); await b.close(); return; }
    await mf.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.trim() === '수정' && link.getAttribute('href')?.includes('suggestConvert')) {
          link.click(); break;
        }
      }
    });
    await page.waitForTimeout(5000);
  }

  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('mainFrame 없음'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('접근 불가'); await b.close(); return; }

  // Wait for SE4
  for (let i = 0; i < 10; i++) {
    try {
      if (await mf.evaluate(() => typeof SmartEditor !== 'undefined')) break;
    } catch(e) {}
    await page.waitForTimeout(1000);
  }

  console.log('SE4 준비 완료');

  // First, let's explore what upload-related services are available
  console.log('\n=== SE4 서비스 탐색 ===');
  const services = await mf.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const keys = Object.keys(ed).filter(k => k.startsWith('_'));
    const serviceInfo = {};
    keys.forEach(k => {
      const val = ed[k];
      if (val && typeof val === 'object') {
        const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(val));
        const ownKeys = Object.getOwnPropertyNames(val);
        serviceInfo[k] = {
          type: val.constructor?.name || 'Object',
          methods: proto.filter(p => p !== 'constructor' && typeof val[p] === 'function').slice(0, 15),
          ownKeys: ownKeys.filter(p => !p.startsWith('_')).slice(0, 10)
        };
      }
    });
    return serviceInfo;
  });

  // Print just upload-related services
  Object.keys(services).forEach(k => {
    if (k.toLowerCase().includes('upload') || k.toLowerCase().includes('image') || k.toLowerCase().includes('file')) {
      console.log(`  ${k}:`, JSON.stringify(services[k]).substring(0, 300));
    }
  });

  // List ALL services names (no details)
  console.log('\n모든 서비스:');
  Object.keys(services).sort().forEach(k => console.log(`  ${k}`));

  // Now try to find how to upload an image
  console.log('\n=== 이미지 업로드 시도 ===');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) { console.log(`❌ ${img.file} 없음`); continue; }

    console.log(`\n${i+1}/${images.length} ${img.label}...`);

    // Read file as base64
    const fileBuffer = fs.readFileSync(imgPath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = 'image/png';

    // Create File object in SE4 context
    const uploadResult = await mf.evaluate(({ base64, mime, fname }) => {
      const results = {};

      // 1. Convert base64 to File
      const bs = atob(base64);
      const ab = new ArrayBuffer(bs.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
      const blob = new Blob([ab], { type: mime });
      const file = new File([blob], fname, { type: mime });

      const ed = SmartEditor._editors['blogpc001'];

      // 2. Method 1: imageUploadService
      if (ed._imageUploadService) {
        results.imageUploadService = Object.getOwnPropertyNames(Object.getPrototypeOf(ed._imageUploadService));
      }

      // 3. Method 2: Use upload api directly
      // Look for any upload-related method in all services
      let uploadMethod = null;
      Object.keys(ed).forEach(k => {
        const val = ed[k];
        if (val && typeof val === 'object') {
          Object.getOwnPropertyNames(Object.getPrototypeOf(val)).forEach(m => {
            if (m.toLowerCase().includes('upload') || m.toLowerCase().includes('insert') && m.toLowerCase().includes('image')) {
              if (!results['_uploadMethods']) results['_uploadMethods'] = [];
              results['_uploadMethods'].push(k + '.' + m);
            }
          });
        }
      });

      // 4. Try createComponentWithCompData for image
      try {
        const factory = ed['_componentFactory'];
        if (factory) {
          const availableTypes = factory.getAvailableCompType();
          results.availableTypes = availableTypes;
          
          // Try creating an image component
          const comp = factory.createComponentWithCompData({ ctype: 'image' });
          results.createdComponent = comp ? Object.keys(comp).filter(k => k !== 'id') : 'null';
        }
      } catch(e) {
        results.factoryError = e.message;
      }

      return results;
    }, { base64, mime: mimeType, fname: img.file });

    console.log(`  결과: ${JSON.stringify(uploadResult, null, 2)}`);
  }

  await b.close();
})().catch(e => console.error('❌', e.message));

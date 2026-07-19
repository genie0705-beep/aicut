// SE4 API 직접 사용 - 이미지 삽입
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_NO = '224341544476';
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

// Read images as base64
function imgToBase64(fileName) {
  const p = path.join(WORKSPACE, fileName);
  return fs.readFileSync(p).toString('base64');
}

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

  if (!page) {
    console.log('❌ Editor page not found');
    await b.close();
    return;
  }

  console.log('✅ Editor page found');

  // Step 1: Check SE4 API details
  console.log('\n[1] SE4 API 탐색...');
  const apiInfo = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const result = {};

    // Document data (getDocumentData)
    try {
      const data = ed.getDocumentData();
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      result.getDocumentData = { type: typeof data, length: str.length };
    } catch(e) {
      result.getDocumentData = { error: e.message };
    }

    // Check setDocumentData
    if (ed._documentService && typeof ed._documentService.setDocumentData === 'function') {
      result.setDocumentData = { exists: true, params: ed._documentService.setDocumentData.length };
    } else {
      result.setDocumentData = { exists: false };
    }

    // Check editingService.write
    if (ed._editingService) {
      const es = ed._editingService;
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(es)).filter(p => p !== 'constructor' && typeof es[p] === 'function');
      result.editingServiceMethods = methods;
      if (es.write) {
        result.write = { exists: true, params: es.write.length, str: es.write.toString().substring(0, 200) };
      }
    }

    // Check getBody
    if (ed._document && ed._document.getBody) {
      const body = ed._document.getBody();
      if (body && body.getChildren) {
        const children = body.getChildren();
        result.bodyChildren = Array.from(children).map((c, i) => {
          const type = c['@ctype'] || c.constructor?.name || '?';
          let text = '';
          try { text = (c.innerText || '').substring(0, 30); } catch(e2) {}
          return { idx: i, '@ctype': type, text };
        });
      }
    }

    return result;
  });
  console.log(JSON.stringify(apiInfo, null, 2));

  // Step 2: Get current HTML data
  console.log('\n[2] 현재 문서 HTML 구조 파악...');
  const docHtml = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      return data;
    } catch(e) {
      return { error: e.message };
    }
  });

  if (typeof docHtml === 'string') {
    console.log(`  HTML 길이: ${docHtml.length}`);
    console.log(`  HTML 앞부분: ${docHtml.substring(0, 300)}`);

    // Find all image components
    const imgMatches = docHtml.match(/<div class="se-component se-image[^>]*>.*?<\/div>\s*<\/div>\s*<\/div>/gs) || [];
    console.log(`  기존 이미지 컴포넌트: ${imgMatches.length}개`);

    // Find all text components
    const textMatches = docHtml.match(/<div class="se-component se-text[^>]*>.*?<\/div>\s*<\/div>\s*<\/div>/gs) || [];
    console.log(`  텍스트 컴포넌트: ${textMatches.length}개`);
  }

  // Step 3: Try image insertion using _editingService
  console.log('\n[3] _editingService.write() 시도...');

  const images = [
    { file: 'aicut_implant_main.png', label: '대표 이미지', w: 700, h: 700 },
    { file: 'aicut_implant_card1.png', label: '본문카드1', w: 600, h: 338 },
    { file: 'aicut_implant_card2.png', label: '본문카드2', w: 600, h: 338 },
    { file: 'aicut_implant_card3.png', label: '본문카드3', w: 600, h: 338 },
    { file: 'aicut_implant_cta.png', label: 'CTA 이미지', w: 500, h: 300 },
  ];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const base64 = imgToBase64(img.file);
    const mime = 'image/png';
    const dataUri = `data:${mime};base64,${base64}`;

    console.log(`\n  ${i+1}/${images.length} ${img.label} 삽입 시도...`);

    // Method 1: Create image component HTML and append via setDocumentData
    const result1 = await page.evaluate(({ dataUri, w, h }) => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        const uid = 'SE-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        
        // Create image component HTML
        const imgHtml = `<div class="se-component se-image se-l-default" id="${uid}">
  <div class="se-component-content">
    <div class="se-section se-section-image se-l-default se-section-align-center" style="">
      <div class="se-module se-module-image">
        <img src="${dataUri}" alt="" class="se-image-resource" style="width: 100%; max-width: ${w}px; height: auto;"/>
      </div>
    </div>
  </div>
</div>`;

        // Get current document data
        const currentData = ed.getDocumentData();
        const currentStr = typeof currentData === 'string' ? currentData : JSON.stringify(currentData);

        // Find </div class="se-components-wrap"> and insert before it
        const wrapEnd = '</div>';
        const componentsWrap = '<div class="se-components-wrap">';
        const wrapStartIdx = currentStr.indexOf(componentsWrap);
        const wrapEndIdx = currentStr.lastIndexOf(wrapEnd);
        
        if (wrapEndIdx > 0) {
          // Insert before the closing of components-wrap
          const newData = currentStr.substring(0, wrapEndIdx) + imgHtml + currentStr.substring(wrapEndIdx);
          ed._documentService.setDocumentData(newData);
          return { ok: true, method: 'setDocumentData' };
        }

        return { ok: false, error: 'cannot find components-wrap' };
      } catch(e) {
        return { ok: false, error: e.message, stack: e.stack?.substring(0, 200) };
      }
    }, { dataUri, w: img.w, h: img.h });

    console.log(`  결과1: ${JSON.stringify(result1)}`);

    if (!result1.ok) {
      // Method 2: Try editingService.write
      const result2 = await page.evaluate(({ dataUri, w, h }) => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          const es = ed._editingService;
          
          if (es && es.write) {
            es.write(dataUri);
            return { ok: true, method: 'editingService.write' };
          }
          return { ok: false, error: 'no write method' };
        } catch(e) {
          return { ok: false, error: e.message };
        }
      }, { dataUri, w: img.w, h: img.h });
      console.log(`  결과2: ${JSON.stringify(result2)}`);
    }

    await page.waitForTimeout(1000);
  }

  // Step 4: Check result
  console.log('\n[4] 결과 확인...');
  const finalCheck = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      const imgMatch = str.match(/se-component[^>]*se-image/g);
      return {
        totalImages: imgMatch ? imgMatch.length : 0,
        dataLen: str.length
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(JSON.stringify(finalCheck));

  // Step 5: Save
  if (finalCheck.totalImages > 0) {
    console.log('\n[5] 저장...');
    page.on('dialog', async dialog => {
      console.log(`  다이얼로그: ${dialog.type()} - ${dialog.message().substring(0, 80)}`);
      await dialog.accept();
    });

    const saveResult = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
          btn.click();
          return { ok: true, text: '발행' };
        }
      }
      return { ok: false };
    });
    console.log(`  저장 결과: ${JSON.stringify(saveResult)}`);
    await page.waitForTimeout(5000);
    console.log('  저장 후 URL:', page.url());
  } else {
    console.log('\n⚠️ 이미지가 0장입니다. 삽입 실패.');
  }

  await b.close();
})().catch(e => console.log('E:', e.message));

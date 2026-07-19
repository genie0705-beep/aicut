// 사진 버튼의 동작 방식 분석
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

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

  if (!page) { console.log('No editor page'); return; }

  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('no mf'); return; }
  const mf = await mfEl.contentFrame();

  // 1. Analyze the 사진 button
  console.log('=== 사진 버튼 분석 ===');
  const btnInfo = await mf.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim().includes('사진')) {
        // Get event listeners
        const listeners = [];
        const cls = btn.className;
        
        // Check for onClick or data attributes
        const dataAttrs = {};
        for (const attr of btn.attributes) {
          if (attr.name.startsWith('data-') || attr.name === 'onclick') {
            dataAttrs[attr.name] = attr.value;
          }
        }
        
        // Get parent structure
        const parent = btn.parentElement;
        const grandparent = parent?.parentElement;
        
        return {
          className: cls,
          text: btn.textContent.trim(),
          id: btn.id,
          dataAttrs,
          parentClass: parent?.className || '',
          grandparentClass: grandparent?.className || '',
          parentHTML: parent?.innerHTML?.substring(0, 300) || '',
          rect: (() => { const r = btn.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()
        };
      }
    }
    return 'not found';
  });
  console.log(JSON.stringify(btnInfo, null, 2));

  // 2. Check for hidden file inputs
  console.log('\n=== 파일 input 검색 ===');
  const fileInputs = await mf.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    return Array.from(inputs).map(inp => ({
      id: inp.id,
      className: inp.className,
      accept: inp.accept,
      style: inp.getAttribute('style') || '',
      hidden: inp.hidden,
      visible: inp.offsetParent !== null,
      parentTag: inp.parentElement?.tagName || '',
      parentClass: inp.parentElement?.className || ''
    }));
  });
  console.log(JSON.stringify(fileInputs, null, 2));

  // 3. Monitor network requests for image upload
  console.log('\n=== 사진 버튼 클릭 + 네트워크 모니터링 ===');
  
  // Listen for all XHR/fetch requests
  const requests = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('upload') || url.includes('image') || url.includes('naver') && (url.includes('files') || url.includes('attach'))) {
      requests.push({ url: url.substring(0, 120), method: req.method() });
      console.log(`  ➡️ 요청: ${url.substring(0, 100)}`);
    }
  });

  page.on('response', resp => {
    const url = resp.url();
    if (url.includes('upload') || url.includes('image') || url.includes('attach') || url.includes('files')) {
      console.log(`  ⬅️ 응답: ${url.substring(0, 100)} (${resp.status()})`);
    }
  });

  // Click the 사진 button
  console.log('\n사진 버튼 클릭...');
  await mf.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim().includes('사진') && btn.offsetParent !== null) {
        btn.click();
        console.log('Clicked 사진 button');
        return;
      }
    }
  });

  // Wait for filechooser
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
    new Promise(resolve => setTimeout(resolve, 100))
  ]);

  if (fileChooser) {
    console.log('✅ FileChooser 캡처됨');
    console.log('FileChooser input element:', fileChooser.element()?.tagName || 'unknown');
    
    // Check the input element
    const inputInfo = await mf.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="file"]');
      return Array.from(inputs).map(inp => ({
        id: inp.id,
        className: inp.className,
        accept: inp.accept,
        style: inp.getAttribute('style') || '',
        files: inp.files?.length || 0,
        parentHTML: inp.parentElement?.innerHTML?.substring(0, 100) || ''
      }));
    });
    console.log('Inputs after click:', JSON.stringify(inputInfo, null, 2));

    // Set file
    const imgPath = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_main.png';
    await fileChooser.setFiles([imgPath]);
    console.log('✅ 파일 설정됨');

    // Now check the input after setting files
    const afterInfo = await mf.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="file"]');
      return Array.from(inputs).map(inp => ({
        id: inp.id,
        files: inp.files?.length || 0,
        fileName: inp.files?.[0]?.name || 'none'
      }));
    });
    console.log('Inputs after setFiles:', JSON.stringify(afterInfo, null, 2));

    // Wait for network activity (upload to CDN)
    console.log('\n⏳ 네트워크 응답 대기 중...');
    await page.waitForTimeout(15000);
    console.log(`총 요청 캡처: ${requests.length}개`);
    requests.forEach(r => console.log(`  ${r.method} ${r.url}`));

    // Check document for new images
    const docAfter = await mf.evaluate(() => {
      const data = SmartEditor._editors['blogpc001'].getDocumentData();
      const comps = data.document.components;
      const imgCount = comps.filter(c => c['@ctype'] === 'image').length;
      return { totalComps: comps.length, imgCount };
    });
    console.log('\n문서 상태:', JSON.stringify(docAfter));
  } else {
    console.log('❌ FileChooser 없음');
  }

  await b.close();
})().catch(e => console.log('E:', e.message));

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const page = await b.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  // URLs to analyze (key posts for SEO check)
  const targets = [
    { id: '224346527054', title: '병원 마케팅(REF)' },
    { id: '224330380033', title: '부동산 중개사무소' },
    { id: '224329284493', title: '피부과 여름 숏폼' },
    { id: '224329573617', title: 'FP 상반기-하반기' },
    { id: '224333770986', title: 'C-커머스 라이브' },
    { id: '224339467024', title: '치과 영상 마케팅' },
  ];
  
  for (const t of targets) {
    try {
      await page.goto(`https://m.blog.naver.com/aicut/${t.id}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
      
      const info = await page.evaluate(() => {
        const title = document.querySelector('meta[property="og:title"]')?.content || document.title || '';
        const desc = document.querySelector('meta[property="og:description"]')?.content || '';
        const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ');
        
        // Count images with their actual sizes
        const imgs = Array.from(document.querySelectorAll('.se-image-resource, ._lazy-loading-target-image'));
        const imgInfo = [];
        imgs.forEach((img, i) => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const displayW = img.clientWidth;
          const displayH = img.clientHeight;
          if (w > 0) {
            imgInfo.push({ idx: i, w: w, h: h, displayW: displayW, displayH: displayH, alt: (img.alt || '').substring(0, 30) });
          }
        });
        
        // Count paragraphs
        const paras = bodyText.split('.').length;
        const wordCount = bodyText.length;
        
        // Check for H2/H3 headings
        const h2Count = (bodyText.match(/##/g) || []).length;
        
        return { title: title.substring(0, 60), desc: desc.substring(0, 80), bodyLen: wordCount, paraApprox: paras, imgs: imgInfo, h2Approx: h2Count, textSample: bodyText.substring(0, 100) };
      });
      
      console.log(`\n=== [${t.id}] ${t.title} ===`);
      console.log(`제목: ${info.title}`);
      console.log(`본문 길이: ${info.bodyLen}자`);
      console.log(`문단 수(approx): ${info.paraApprox}`);
      console.log(`이미지 수: ${info.imgs.length}`);
      info.imgs.forEach(ig => console.log(`  img${ig.idx}: ${ig.w}x${ig.h} (display: ${ig.displayW}x${ig.displayH}) alt=${ig.alt}`));
      console.log(`샘플: ${info.textSample.substring(0, 80)}`);
      
    } catch(e) {
      console.log(`\n=== [${t.id}] ERROR: ${e.message}`);
    }
  }
  
  await page.close();
  b.disconnect();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
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
      await page.goto(`https://m.blog.naver.com/aicut/${t.id}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);
      
      const info = await page.evaluate(() => {
        const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ');
        
        const imgs = Array.from(document.querySelectorAll('img'));
        const imgInfo = [];
        imgs.forEach((img, i) => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          if (w > 0 && (w >= 80 || src.includes('blog'))) {
            imgInfo.push({ idx: i, w, h, alt: (img.alt || '').substring(0,30) });
          }
        });
        
        return { bodyLen: bodyText.length, imgs: imgInfo, textSample: bodyText.substring(0, 150) };
      });
      
      console.log(`\n[${t.id}] ${t.title}`);
      console.log(`  본문: ${info.bodyLen}자`);
      console.log(`  이미지: ${info.imgs.length}개`);
      info.imgs.forEach(ig => console.log(`    ${ig.idx}: ${ig.w}x${ig.h} alt=[${ig.alt}]`));
      console.log(`  시작: ${info.textSample.substring(0, 80)}`);
      
    } catch(e) {
      console.log(`\n[${t.id}] ${t.title} - ERROR: ${e.message.substring(0,60)}`);
    }
  }
  
  console.log('\n=== DONE ===');
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

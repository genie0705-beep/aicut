const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Check PC version for alignment
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224350581299', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  const data = await page.evaluate(() => {
    const results = [];
    
    // Get all se-section elements
    const sections = document.querySelectorAll('.se-section, [class*=se-section]');
    console.log('Sections found:', sections.length);
    
    sections.forEach((s, i) => {
      const cls = s.className;
      const style = s.style.cssText || '';
      const isImage = cls.includes('se-section-image');
      const alignCe = cls.includes('se-section-align-ce');
      const textAlign = isImage ? (s.querySelector('img') ? 'has-img' : 'no-img') : (s.textContent || '').replace(/\s+/g,' ').trim().substring(0,50);
      results.push({ idx: i, isImage, alignCe, style: style.substring(0,40), class: cls.substring(0,50), text: textAlign });
    });
    
    return results;
  });
  
  console.log('=== PC VERSION STRUCTURE ===');
  data.forEach(s => console.log(`${s.idx}: img=${s.isImage} center=${s.alignCe} ${s.class} | ${s.text}`));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

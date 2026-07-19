const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://m.blog.naver.com/aicut/224348885801', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  // Analyze structure
  const structure = await page.evaluate(() => {
    const modules = document.querySelectorAll('section.se-section, .se-module, .se-module-image, .se-module-text');
    const result = [];
    modules.forEach((el, i) => {
      const cls = el.className;
      const isImg = cls.includes('image') || cls.includes('Image');
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 80);
      result.push({ idx: i, type: isImg ? 'IMAGE' : 'TEXT', class: cls.substring(0,40), text: text || '(empty)' });
    });
    return result;
  });
  
  console.log('=== STRUCTURE ===');
  structure.forEach(s => console.log(`${s.idx}: [${s.type}] ${s.class} | ${s.text}`));
  
  // Get all images
  const imgs = await page.evaluate(() => {
    const allImgs = Array.from(document.querySelectorAll('img'));
    return allImgs.map((img, i) => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const src = img.getAttribute('src') || '';
      if (w > 0) {
        return { idx: i, w, h, alt: (img.alt || '').substring(0,30), src: src.substring(0, 80) };
      }
      return null;
    }).filter(Boolean);
  });
  
  console.log('\n=== IMAGES ===');
  imgs.forEach(ig => console.log(`  ${ig.idx}: ${ig.w}x${ig.h} alt=[${ig.alt}]`));
  
  // Count hashtags
  const text = await page.evaluate(() => document.body.innerText);
  const hashtags = text.match(/#[가-힣a-zA-Z0-9]+/g);
  console.log(`\n해시태그: ${hashtags ? hashtags.length : 0}개`);
  console.log(`본문 길이: ${text.length}자`);
  
  // Check for CTA
  const hasKakao = text.includes('pf.kakao.com') || text.includes('카카오톡');
  const hasEmail = text.includes('master@aicut.co.kr');
  const hasHomepage = text.includes('aicut.co.kr');
  console.log(`CTA: 카카오톡=${hasKakao} 이메일=${hasEmail} 홈페이지=${hasHomepage}`);
  
  // Check center alignment
  const centered = await page.evaluate(() => {
    const sections = document.querySelectorAll('[class*=se-section]');
    let c = 0, total = 0;
    sections.forEach(s => {
      total++;
      if (s.className.includes('align-ce') || s.style.textAlign === 'center') c++;
    });
    return { centered: c, total };
  });
  console.log(`정렬: ${centered.centered}/${centered.total} 센터`);
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

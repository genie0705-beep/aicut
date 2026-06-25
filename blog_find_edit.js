const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('blog.naver.com') && pg.url().includes('224315585369')) {
      p = pg; break;
    }
  }
  // Fallback to any blog page
  if (!p) {
    for (const pg of pages) {
      if (pg.url().includes('blog.naver.com/aicut')) { p = pg; break; }
    }
  }
  if (!p) { console.log('no blog page'); await b.close(); return; }
  
  await p.bringToFront();
  await p.waitForTimeout(3000);
  
  const info = await p.evaluate(() => {
    const url = window.location.href;
    const body = document.body.innerText;
    // Find edit button
    const editLinks = Array.from(document.querySelectorAll('a')).filter(a => {
      const t = a.innerText || '';
      return t.includes('수정') || t.includes('편집') || a.href.includes('PostEditor') || a.href.includes('PostWrite');
    }).map(a => ({ text: a.innerText.substring(0, 20), href: (a.href || '').substring(0, 120) }));
    
    // Find the post content
    const hasLawyer = body.includes('변호사') || body.includes('세무사') || body.includes('보험설계사');
    
    return { url: url.substring(0, 100), bodyPreview: body.substring(0, 300), editLinks, hasLawyer };
  });
  
  console.log('URL:', info.url);
  console.log('전문직 포스팅?', info.hasLawyer);
  console.log('본문:', info.bodyPreview.substring(0, 200));
  console.log('수정 링크:', JSON.stringify(info.editLinks));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));

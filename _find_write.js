const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  let blogPage = pages.find(p => p.url().includes('blog.naver.com/aicut'));
  
  const frames = blogPage.frames();
  const prologueFrame = frames.find(f => f.url().includes('PrologueList'));
  
  // Check login status in prologue frame
  const nick = await prologueFrame.locator('.gnb_nick').textContent().catch(() => 'no-nick');
  console.log('Nick:', nick.trim());
  
  // Get all buttons and links within the frame
  const allElements = await prologueFrame.locator('*').all();
  console.log('Total DOM elements:', allElements.length);
  
  // Search for any element with 'write' or '글' in text, id, class, onclick, or href
  const writeElements = [];
  for (const el of allElements) {
    const tagName = await el.evaluate(e => e.tagName).catch(() => '');
    const text = await el.textContent().catch(() => '');
    const id = await el.getAttribute('id').catch(() => '');
    const cls = await el.getAttribute('class').catch(() => '');
    const href = await el.getAttribute('href').catch(() => '');
    const onclick = await el.getAttribute('onclick').catch(() => '');
    
    const combined = (text + ' ' + id + ' ' + cls + ' ' + href + ' ' + onclick).toLowerCase();
    if (combined.includes('write') || combined.includes('글쓰') || combined.includes('새글')) {
      const outer = await el.evaluate(e => e.outerHTML.substring(0, 200)).catch(() => '');
      writeElements.push({ tag: tagName, text: (text || '').trim().substring(0, 40), id: (id || '').substring(0, 30), href: (href || '').substring(0, 80), onclick: (onclick || '').substring(0, 80), outer: (outer || '').substring(0, 150) });
    }
  }
  
  console.log('Write-related elements:', writeElements.length);
  writeElements.forEach((e, i) => {
    console.log(i+1 + ':', JSON.stringify(e));
  });
  
  await b.close();
})();

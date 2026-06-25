const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  // Full page text analysis
  const fullText = await page.evaluate(() => document.body.innerText);
  
  // Find 태그 관련 sections
  const tagSection = fullText.split('\n').filter(l => l.includes('#') || l.includes('태그') || l.includes('tag'));
  console.log('=== 태그 관련 텍스트 ===');
  console.log(tagSection.join('\n'));
  
  // Find ALL inputs with their placeholders and values
  const allInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea')).map(i => ({
      tag: i.tagName,
      type: i.type,
      placeholder: (i.placeholder || '').substring(0, 30),
      value: (i.value || '').substring(0, 50),
      id: i.id,
      cls: (i.className || '').substring(0, 30),
      visible: i.offsetHeight > 0,
      x: Math.round(i.getBoundingClientRect().x),
      y: Math.round(i.getBoundingClientRect().y)
    }));
  });
  
  console.log('\n=== 모든 입력창 ===');
  allInputs.forEach(i => console.log(`[${i.tag}] type=${i.type} ph="${i.placeholder}" val="${i.value}" cls=${i.cls} (${i.x},${i.y})`));
  
  // Look for hashtag display area (태그가 표시되는 영역)
  const tagDisplay = await page.evaluate(() => {
    // 태그가 화면에 표시되는 영역 찾기
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      const r = el.getBoundingClientRect();
      const text = (el.innerText || '').trim();
      if (text.includes('#') && r.width > 50 && r.height > 20 && !el.closest('.se-content')) {
        results.push({ text: text.substring(0, 100), x: Math.round(r.x), y: Math.round(r.y), tag: el.tagName, cls: (el.className||'').substring(0,30) });
      }
    }
    return results.slice(0, 10);
  });
  
  console.log('\n=== 태그 표시 영역 ===');
  tagDisplay.forEach(t => console.log(t.text, `(${t.x},${t.y})`, t.tag, t.cls));
  
  await page.screenshot({ path: 'tag_full_page.png', fullPage: true });
  await b.close();
})();

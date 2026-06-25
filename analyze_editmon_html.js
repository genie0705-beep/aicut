const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('editmon'));
  if (!p) return;
  
  // 페이지 HTML에서 게시물 링크 패턴 찾기
  const postData = await p.evaluate(() => {
    const html = document.body.innerHTML;
    const text = document.body.innerText;
    const results = [];
    
    // Find all table rows with multiple cells
    const rows = document.querySelectorAll('tr');
    rows.forEach((row, ri) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const cellTexts = [];
        cells.forEach(c => cellTexts.push(c.textContent.trim().substring(0, 30)));
        const rowHTML = row.innerHTML.substring(0, 300);
        results.push({ row: ri, cells: cellTexts, html: rowHTML });
      }
    });
    
    return results.slice(0, 15);
  });
  
  console.log('Table rows:');
  postData.forEach((r, i) => {
    console.log('--- Row', i, '---');
    console.log('Cells:', r.cells.join(' | '));
    console.log('HTML:', r.html.substring(0, 200));
  });
})();

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('editmon'));
  if (!p) return;

  // Find all clickable post titles in the table
  const posts = await p.evaluate(() => {
    const data = [];
    const allTds = document.querySelectorAll('td');
    allTds.forEach(td => {
      const text = td.textContent.trim();
      // Find company names followed by job titles
      if (text.length > 5 && text.length < 50 && !text.includes('회사명') && !text.includes('모집제목') && !text.includes('안내') && !text.includes('아이디')) {
        const parentRow = td.closest('tr');
        if (parentRow) {
          const allCellText = parentRow.textContent.trim();
          if (allCellText.includes('편집') || allCellText.includes('영상') || allCellText.includes('프리랜서')) {
            const links = parentRow.querySelectorAll('a');
            const linkInfo = Array.from(links).map(a => ({ text: a.textContent.trim().substring(0, 40), href: a.href }));
            data.push({ cellText: text.substring(0, 40), rowText: allCellText.substring(0, 100), links: linkInfo });
          }
        }
      }
    });
    return data.slice(0, 15);
  });
  
  console.log('Posts found:', posts.length);
  posts.forEach((post, i) => {
    console.log((i+1) + '.', post.cellText);
    console.log('   Row:', post.rowText.substring(0, 60));
    console.log('   Links:', JSON.stringify(post.links));
  });
})();

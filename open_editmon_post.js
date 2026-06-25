const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('editmon'));
  if (!p) return;
  
  // 첫 번째 게시물 제목 링크 찾아서 클릭
  const postLink = await p.evaluate(() => {
    const rows = document.querySelectorAll('tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      for (const cell of cells) {
        const a = cell.querySelector('a');
        if (a && a.textContent.trim().length > 10 && !a.textContent.includes('전체') && !a.textContent.includes('안내')) {
          return { text: a.textContent.trim().substring(0, 50), href: a.href };
        }
      }
    }
    return null;
  });
  
  if (postLink && postLink.href) {
    console.log('Found post:', postLink.text);
    await p.goto(postLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p.waitForTimeout(2000);
    
    const detail = await p.evaluate(() => ({
      url: window.location.href.substring(0, 100),
      text: document.body.innerText.replace(/\n/g, ' ').trim().substring(0, 1500)
    }));
    console.log('DETAIL:', JSON.stringify(detail, null, 2));
    
    // 이메일 주소 찾기
    const email = await p.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      return match ? match[0] : 'NO EMAIL FOUND';
    });
    console.log('EMAIL:', email);
    
    // 연락처 정보 찾기
    const contact = await p.evaluate(() => {
      const text = document.body.innerText;
      const phone = text.match(/01[0-9][-\s]?[0-9]{3,4}[-\s]?[0-9]{4}/);
      return phone ? phone[0] : 'NO PHONE';
    });
    console.log('PHONE:', contact);
    
  } else {
    console.log('No post link found');
  }
})();

// 테스트: 생성된 페이지들이 브라우저에서 정상 표시되는지 확인
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages.find(p => p.url().includes('aicut.co.kr'));
    if (!page) page = pages[0];

    // 로컬 파일로 각 페이지 열기
    const files = ['index.html', 'pricing.html', 'service.html', 'faq.html'];
    for (const file of files) {
      const filePath = 'file:///C:/Users/paul/.openclaw/workspace/' + file;
      await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const info = await page.evaluate(() => {
        const title = document.title;
        const bodyText = document.body.innerText.slice(0, 300).replace(/\n/g, ' ').trim();
        const errorText = document.body.innerText.includes('404') || document.body.innerText.includes('Error');
        const hasContent = bodyText.length > 50;
        const navLinks = document.querySelectorAll('a[href]');
        const links = Array.from(navLinks).map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim().slice(0, 30) }));
        return { title, hasContent, errorText, bodyPreview: bodyText.slice(0, 200), navLinks: links.slice(0, 10) };
      });
      
      console.log(`\n=== ${file} ===`);
      console.log('Title:', info.title);
      console.log('Has content:', info.hasContent);
      console.log('Errors:', info.errorText);
      console.log('Body preview:', info.bodyPreview);
      console.log('Nav links:', JSON.stringify(info.navLinks));
    }

    console.log('\n✅ Test complete');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

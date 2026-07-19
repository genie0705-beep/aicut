const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages.find(p => p.url().includes('aicut.co.kr'));
    if (!page) page = pages[0];

    await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Get full HTML structure for link and navigation analysis
    const htmlContent = await page.evaluate(() => {
      // Look at nav, header, footer - navigation areas
      const nav = document.querySelector('nav, header, .nav, .header, .navbar, .menu');
      const footer = document.querySelector('footer, .footer');
      
      // All links with their href and surrounding context
      const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.getAttribute('href'),
        text: a.innerText.trim().slice(0, 60),
        class: a.className.slice(0, 60),
        id: a.id,
        onclick: a.getAttribute('onclick')?.slice(0, 80),
      }));

      // All buttons
      const allButtons = Array.from(document.querySelectorAll('button, [role="button"]')).map(b => ({
        text: b.innerText.trim().slice(0, 60),
        class: b.className.slice(0, 60),
        onclick: b.getAttribute('onclick')?.slice(0, 80),
      }));

      // Check for any data- attributes that might indicate routing
      const allElements = Array.from(document.querySelectorAll('[data-route], [data-link], [data-path], [data-to], [data-page], [data-target]')).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim().slice(0, 40),
        dataRoute: el.getAttribute('data-route') || el.getAttribute('data-link') || el.getAttribute('data-path') || el.getAttribute('data-to') || el.getAttribute('data-page') || el.getAttribute('data-target'),
      }));

      return { nav: nav?.innerHTML?.slice(0, 500), footer: footer?.innerHTML?.slice(0, 500), allLinks, allButtons, allElements };
    });

    console.log('=== ALL LINKS ===');
    htmlContent.allLinks.forEach(l => console.log(`href=${l.href} text=[${l.text}] onclick=${l.onclick || '-'}`));
    
    console.log('\n=== ALL BUTTONS ===');
    htmlContent.allButtons.forEach(b => console.log(`text=[${b.text}] onclick=${b.onclick || '-'}`));
    
    console.log('\n=== ROUTE DATA ATTRS ===');
    htmlContent.allElements.forEach(e => console.log(`${e.tag} text=[${e.text}] data=${e.dataRoute}`));
    
    console.log('\n=== NAV HTML ===');
    console.log(htmlContent.nav?.slice(0, 1000));
    
  } catch(e) {
    console.error('Script Error:', e.message);
  }
})();

const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages.find(p => p.url().includes('aicut.co.kr'));
    if (!page) page = pages[0];

    // Navigate with domcontentloaded - faster
    await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Get all internal links
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href]');
      const internal = [];
      anchors.forEach(a => {
        const href = a.getAttribute('href');
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin === window.location.origin) {
            internal.push({ path: url.pathname, text: a.innerText.trim().slice(0, 50), hash: url.hash });
          }
        } catch(e) {}
      });
      return [...new Map(internal.map(i => [i.path + i.hash, i])).values()];
    });

    console.log('=== INTERNAL LINKS ===');
    links.forEach(l => console.log(l.path + (l.hash || '') + '  [' + l.text + ']'));

    // Check SPA structure
    const info = await page.evaluate(() => {
      const nextData = document.getElementById('__NEXT_DATA__');
      const root = document.getElementById('__next') || document.getElementById('root');
      const metaDesc = document.querySelector('meta[name="description"]');
      return {
        title: document.title,
        hasNextData: !!nextData,
        hasRoot: !!root,
        description: metaDesc?.getAttribute('content')?.slice(0, 100),
        bodyClass: document.body.className,
        pageHtml: document.documentElement.outerHTML.includes('<script') ? 'has scripts' : 'no scripts',
      };
    });

    console.log('\n=== SITE INFO ===');
    console.log(JSON.stringify(info, null, 2));

    // Also try navigating to some possible routes (with shorter timeout)
    const routes = ['/service', '/services', '/pricing', '/faq', '/contact', '/about', '/portfolio', '/estimate', '/price', '/request', '/quote'];
    for (const route of routes) {
      try {
        const resp = await page.goto('https://aicut.co.kr' + route, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        const status = resp ? resp.status() : 'error';
        console.log(`Route ${route}: status=${status}, finalUrl=${currentUrl}`);
      } catch(e) {
        console.log(`Route ${route}: error=${e.message.slice(0, 80)}`);
      }
    }

    await browser.disconnect();
  } catch(e) {
    console.error('Script Error:', e.message);
  }
})();

const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    let page = ctx.pages().find(p => p.url().includes('memorial_admin'));
    if (!page) {
      page = await ctx.newPage();
      await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'commit' });
      await page.waitForTimeout(5000);
    }
    if (await page.locator('#login-overlay').isVisible()) {
      await page.selectOption('#login-account', 'admin');
      await page.fill('#login-password', '1234');
      await page.click('#login-btn');
      await page.waitForTimeout(2000);
    }
    
    const debug = await page.evaluate(() => {
      const app = document.querySelector('.app');
      const sidebar = document.querySelector('.sidebar');
      const mainDiv = document.querySelector('.main');
      
      const as = app ? window.getComputedStyle(app) : null;
      const ss = sidebar ? window.getComputedStyle(sidebar) : null;
      const ms = mainDiv ? window.getComputedStyle(mainDiv) : null;
      
      const ar = app?.getBoundingClientRect();
      const sr = sidebar?.getBoundingClientRect();
      const mr = mainDiv?.getBoundingClientRect();
      
      // Check all computed CSS that might affect width
      let mainRules = '';
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes('main')) {
              mainRules += rule.selectorText + ' { ' + rule.style.cssText + ' }\n';
            }
          }
        } catch(e) {}
      }
      
      return {
        app: {
          display: as?.display,
          width: as?.width,
          rect: ar ? {w:Math.round(ar.width), l:Math.round(ar.left)} : null,
          flexDirection: as?.flexDirection
        },
        sidebar: {
          display: ss?.display,
          width: ss?.width,
          flex: ss?.flex,
          rect: sr ? {w:Math.round(sr.width), l:Math.round(sr.left)} : null
        },
        mainDiv: {
          display: ms?.display,
          width: ms?.width,
          flexGrow: ms?.flexGrow,
          flexShrink: ms?.flexShrink,
          flexBasis: ms?.flexBasis,
          flex: ms?.flex,
          overflow: ms?.overflow,
          minWidth: ms?.minWidth,
          rect: mr ? {w:Math.round(mr.width), l:Math.round(mr.left), h:Math.round(mr.height)} : null
        },
        mainCssRules: mainRules,
        allLinkStylesheets: Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(l => l.href)
      };
    });
    
    console.log('=== Detailed Debug ===');
    console.log(JSON.stringify(debug, null, 2));
    
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

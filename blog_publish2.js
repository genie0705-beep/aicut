const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const page = context.pages().find(p => p.url().includes('PostWriteForm'));
    
    if (!page) {
      console.log('PostWriteForm page not found');
      process.exit(1);
    }

    console.log('=== Looking for Blog Category Settings ===');
    
    // Check for blog category - this is different from 글감 (material) category
    // Blog categories (카테고리) are usually in the settings panel on the right
    const blogCategoryInfo = await page.evaluate(() => {
      const info = {};
      
      // Check right sidebar settings panel
      const settingsPanel = document.querySelector('[class*="settings"], [class*="Setting"], [class*="sidebar"], #right-panel, [class*="right_panel"]');
      if (settingsPanel) {
        info.settingsPanel = settingsPanel.className?.substring(0, 100);
        info.settingsHTML = settingsPanel.innerHTML.substring(0, 1000);
      }
      
      // Check the header menu for category
      const headerItems = document.querySelectorAll('.header_menu__UJgdY *, [class*="header"] a, [class*="header"] button, [class*="header"] span, [class*="header"] div');
      const catRelated = [];
      headerItems.forEach(el => {
        const t = el.textContent?.trim() || '';
        if (t && (t.includes('카테고리') || t.includes('설정') || t.includes('분류') || t.includes('관리'))) {
          catRelated.push({ text: t.substring(0, 40), class: el.className?.substring(0, 60), tag: el.tagName });
        }
      });
      info.catRelatedHeader = catRelated;
      
      // Check the entire page for "에이컷 오늘 픽" - this is a blog category name
      const allElements = document.querySelectorAll('*');
      const aicutPick = [];
      allElements.forEach(el => {
        const t = el.textContent?.trim() || '';
        if (t.includes('에이컷 오늘') || t === '에이컷') {
          aicutPick.push({
            text: t.substring(0, 50),
            class: el.className?.substring(0, 60),
            tag: el.tagName
          });
        }
      });
      info.aicutPickReferences = aicutPick;
      
      // Look for blog category selector - check overflow menu
      // The overflow_menu_btn might have more options
      const overflowBtn = document.querySelector('.overflow_menu_btn__AzKxF, [class*="overflow"] button');
      info.overflowBtn = overflowBtn ? {
        exists: true,
        html: overflowBtn.outerHTML.substring(0, 300)
      } : { exists: false };
      
      // Check all dropdown/select related to "blog category"
      const selects = document.querySelectorAll('select, [role="listbox"], [class*="dropdown_menu"], [class*="dropdown-menu"]');
      info.selectElements = Array.from(selects).map(s => ({
        class: s.className?.substring(0, 80),
        tag: s.tagName,
        visible: s.offsetParent !== null,
        text: s.textContent?.trim().substring(0, 100)
      }));
      
      // Check if "내 블로그 관리" or blog management is linked
      const blogMgmt = [];
      allElements.forEach(el => {
        const t = el.textContent?.trim() || '';
        if (t.includes('내 블로그') || t.includes('블로그 관리') || t.includes('관리')) {
          blogMgmt.push({
            text: t.substring(0, 40),
            tag: el.tagName,
            class: el.className?.substring(0, 60),
            href: el.href || el.getAttribute?.('href') || ''
          });
        }
      });
      info.blogMgmt = blogMgmt;
      
      // Check for a specific blog category dropdown area
      // In Naver blog, the category is set in the "설정" (settings) which is in the overflow menu
      // Let's check the overflow menu area more carefully
      const overflowArea = document.querySelector('.overflow_menu_btn_area__H01D4');
      if (overflowArea) {
        info.overflowAreaHTML = overflowArea.innerHTML.substring(0, 1500);
        info.overflowAreaBtn = overflowArea.querySelector('.overflow_menu_btn__AzKxF')?.outerHTML?.substring(0, 300);
      }
      
      // Check for gear/settings icon in the header
      const allImgs = document.querySelectorAll('img, svg, [class*="icon"]');
      const gearIcons = [];
      allImgs.forEach(el => {
        const alt = el.getAttribute?.('alt') || '';
        const cls = typeof el.className === 'string' ? el.className : '';
        const src = el.getAttribute?.('src') || '';
        if (alt.includes('설정') || cls.includes('settings') || cls.includes('setting') || 
            alt.includes('기본') || cls.includes('gear') || alt.includes('category')) {
          gearIcons.push({ alt, class: cls, src: src.substring(0, 80), tag: el.tagName });
        }
      });
      info.gearIcons = gearIcons;
      
      return info;
    });
    
    console.log('Blog Category Info:', JSON.stringify(blogCategoryInfo, null, 2));
    
    // Let's also check what the overflow menu button does by clicking it
    console.log('\n=== Clicking overflow menu button ===');
    
    // First let's try clicking the overflow menu
    const overflowBtn = await page.$('.overflow_menu_btn__AzKxF, .overflow_menu_btn_area__H01D4 button');
    if (overflowBtn) {
      await overflowBtn.click();
      await sleep(1500);
      
      const afterClick = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const result = [];
        
        // Find any visible popup/menu/dialog that appeared
        allElements.forEach(el => {
          const t = el.textContent?.trim() || '';
          if (el.offsetParent !== null && 
              (t.includes('카테고리') || t.includes('분류') || t.includes('설정') || 
               t.includes('에이컷') || t.includes('글 분류') || t.includes('카테고리 관리') ||
               t.includes('기본') || t.includes('공개') || t.includes('댓글'))) {
            result.push({
              text: t.substring(0, 50),
              tag: el.tagName,
              class: el.className?.substring(0, 80),
              rect: el.getBoundingClientRect ? true : false
            });
          }
        });
        return result;
      });
      
      console.log('After overflow click:', JSON.stringify(afterClick, null, 2));
      
      // Check for any visible popup
      const allVisiblePopups = await page.evaluate(() => {
        // Look for menu/popup elements with any category-related content
        const visible = [];
        document.querySelectorAll('*').forEach(el => {
          if (el.offsetParent === null) return;
          const t = el.textContent?.trim() || '';
          if ((t.length > 0 && t.length < 100) && 
              el.children.length === 0 && 
              !['SCRIPT', 'STYLE', 'META', 'LINK'].includes(el.tagName)) {
            visible.push({
              text: t,
              tag: el.tagName,
              class: el.className?.substring(0, 60)
            });
          }
        });
        // Return only unique texts near the header area
        const texts = new Set();
        const unique = [];
        visible.forEach(v => {
          if (!texts.has(v.text) && v.text.length > 0) {
            texts.add(v.text);
            unique.push(v);
          }
        });
        return unique.filter(v => v.text.length < 50).slice(0, 100);
      });
      
      console.log('Visible short texts:', JSON.stringify(allVisiblePopups, null, 2));
    }
    
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();

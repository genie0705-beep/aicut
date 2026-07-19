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

    console.log('=== Looking for Blog Category (블로그 분류/카테고리) ===');
    
    // Examine the right sidebar content more closely
    const sidebarInfo = await page.evaluate(() => {
      const info = {};
      
      // Get the sidebar
      const sidebar = document.querySelector('.se-sidebar');
      if (sidebar) {
        info.sidebarClass = sidebar.className;
        info.sidebarHTML = sidebar.innerHTML.substring(0, 3000);
      }
      
      // Check for current document tab - click on it if not already selected
      const currentDocTab = document.querySelector('.current_document, button[value="current_document"]');
      if (currentDocTab) {
        info.currentDocTabExists = true;
        info.currentDocTabHTML = currentDocTab.outerHTML.substring(0, 300);
      }
      
      // Look for all content in the sidebar
      const sidebarContainer = document.querySelector('.se-sidebar-container');
      if (sidebarContainer) {
        info.sidebarContainer = sidebarContainer.className;
        info.sidebarContainerHTML = sidebarContainer.innerHTML.substring(0, 3000);
      }
      
      // Look for "현재 문서" tab content
      const tabContent = document.querySelector('.se-tab-content-document-library, .se-tab-content.se-is-on');
      if (tabContent) {
        info.tabContentClass = tabContent.className;
        info.tabContentHTML = tabContent.innerHTML.substring(0, 3000);
      }
      
      return info;
    });
    
    console.log('Sidebar Info:', JSON.stringify(sidebarInfo, null, 2));
    
    // Check if the sidebar tab is "현재 문서" - this might show post settings
    // In some SE4 versions, clicking "현재 문서" shows the category
    
    // Let's also check if there's a "설정" or "카테고리" button anywhere in the page
    const moreCheck = await page.evaluate(() => {
      const result = {};
      
      // Look for any button/link with 분류, 카테고리, 설정 text
      const allElements = document.querySelectorAll('button, a, li, span, div');
      const catRefs = [];
      allElements.forEach(el => {
        const t = el.textContent?.trim() || '';
        if ((t.includes('분류') || t.includes('카테고리') || t.includes('글 분류')) && t.length < 50) {
          catRefs.push({ text: t, tag: el.tagName, class: el.className?.substring(0, 80) });
        }
      });
      result.catRefs = catRefs;
      
      // Check entire HTML for hidden/aria labels
      const ariaLabels = [];
      allElements.forEach(el => {
        const aria = el.getAttribute('aria-label');
        if (aria && (aria.includes('분류') || aria.includes('카테고리') || aria.includes('글 분류'))) {
          ariaLabels.push({ aria, tag: el.tagName, class: el.className?.substring(0, 80) });
        }
      });
      result.ariaLabels = ariaLabels;
      
      // Check the right sidebar for all tab contents
      const tabContents = document.querySelectorAll('.se-tab-content');
      result.tabContents = Array.from(tabContents).map(tc => ({
        class: tc.className,
        visible: tc.offsetParent !== null,
        html: tc.innerHTML.substring(0, 500)
      }));
      
      // Check for all visible panel contents
      const panelContents = document.querySelectorAll('.se-panel-content');
      result.panelContents = Array.from(panelContents).map(pc => ({
        class: pc.className?.substring(0, 100),
        visible: pc.offsetParent !== null,
        html: pc.innerHTML.substring(0, 500)
      }));
      
      return result;
    });
    
    console.log('\nMore Check:', JSON.stringify(moreCheck, null, 2));
    
    // Click "현재 문서" tab if available to see category settings
    const currentDocTab = await page.$('.current_document, button[value="current_document"]');
    if (currentDocTab) {
      console.log('\n=== Clicking Current Document tab ===');
      await currentDocTab.click();
      await sleep(1500);
      
      const afterTabClick = await page.evaluate(() => {
        // Check all visible tab contents now
        const tabs = document.querySelectorAll('.se-tab-content');
        const result = [];
        tabs.forEach(tc => {
          if (tc.offsetParent !== null) {
            result.push({
              class: tc.className?.substring(0, 100),
              html: tc.innerHTML.substring(0, 2000)
            });
          }
        });
        return result;
      });
      
      console.log('After tab click:', JSON.stringify(afterTabClick, null, 2));
    }
    
    // Also check: maybe the category is set from the main blog page,
    // not the SE4 editor. Let's look at the URL more carefully.
    // In the old SmartEditor, the blog category was set on the main blog page.
    // It might be that "에이컷 오늘 픽" is a blog category, not 글감 category
    
    console.log('\n=== Checking if category is in another location ===');
    const urlInfo = page.url();
    console.log('Current URL:', urlInfo);
    
    // Check for any hidden iframe or settings overlay
    const hiddenSettings = await page.evaluate(() => {
      const result = {};
      
      // Look for post settings dialog
      const dialogs = document.querySelectorAll('[class*="dialog"], [class*="modal"], [class*="overlay"], [role="dialog"]');
      result.dialogs = Array.from(dialogs).map(d => ({
        class: d.className?.substring(0, 80),
        visible: d.offsetParent !== null,
        text: d.textContent?.trim().substring(0, 100)
      }));
      
      // Look for post settings area below editor or in header
      const settingsAreas = document.querySelectorAll('[class*="post_option"], [class*="PostOption"], [class*="post_setting"], [class*="PostSetting"]');
      result.settingsAreas = Array.from(settingsAreas).map(s => ({
        class: s.className?.substring(0, 80),
        html: s.outerHTML.substring(0, 300)
      }));
      
      return result;
    });
    
    console.log('Hidden Settings:', JSON.stringify(hiddenSettings, null, 2));
    
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();

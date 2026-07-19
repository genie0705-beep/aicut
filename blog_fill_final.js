const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    
    let page = context.pages().find(p => p.url().includes('PostWriteForm'));
    if (!page) {
      page = await context.newPage();
      await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
    }
    
    console.log('URL:', page.url());
    
    // === STEP 1: Set title ===
    const titleText = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
    await page.evaluate((t) => {
      SmartEditor._editors['blogpc001'].setDocumentTitle(t);
    }, titleText);
    console.log('✅ Title set');
    
    // === STEP 2: Find and focus the editable area ===
    // Click on the contenteditable div
    await page.evaluate(() => {
      const div = document.querySelector('div[contenteditable="true"]');
      if (div) {
        div.focus();
        div.click();
      }
    });
    await page.waitForTimeout(500);
    
    // === STEP 3: Set clipboard and paste ===
    const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
    
    // Normalize quotes for PowerShell
    const escapedHtml = bodyHtml.replace(/'/g, "''");
    
    const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText('${escapedHtml}')`;
    execSync(`powershell -Command "${psCmd}"`, { timeout: 10000 });
    console.log('✅ Clipboard set');
    await page.waitForTimeout(500);
    
    // Paste
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(2000);
    console.log('✅ Ctrl+V pressed');
    
    // === STEP 4: Check result ===
    const check = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const content = ed.getContent ? ed.getContent() : '';
      const data = ed.getDocumentData ? ed.getDocumentData() : '';
      return { 
        title: ed.getDocumentTitle(),
        contentLength: content.length,
        dataLength: data.length,
        hasContent: content.length > 100,
      };
    });
    console.log('Content:', JSON.stringify(check));
    
    // Also try to find the SE4 insertText method
    const insertMethods = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      // Find all methods
      const all = [];
      for (const key in ed) {
        if (typeof ed[key] === 'function') all.push(key);
      }
      return all.slice(0, 30);
    });
    console.log('Editor methods:', insertMethods);
    
    await page.screenshot({ path: 'blog_final_state.png', fullPage: false });
    console.log('Screenshot saved');
    
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

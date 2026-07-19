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
    
    // === STEP 1: Set TITLE ===
    const titleText = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
    await page.evaluate((t) => {
      SmartEditor._editors['blogpc001'].setDocumentTitle(t);
    }, titleText);
    console.log('✅ Title set');
    await page.waitForTimeout(300);
    
    // === STEP 2: Set clipboard via PowerShell ps1 file ===
    const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
    
    // Write temp HTML to a file for PowerShell to read
    fs.writeFileSync(path.join(__dirname, '_clip_content.html'), bodyHtml, 'utf8');
    
    // Create PowerShell script to set clipboard
    const psScript = `Add-Type -AssemblyName System.Windows.Forms
$content = Get-Content -Path "${__dirname.replace(/\\/g, '\\\\')}\\\\_clip_content.html" -Raw
[System.Windows.Forms.Clipboard]::SetText($content)
Write-Host "OK"`;
    
    fs.writeFileSync(path.join(__dirname, '_set_clip.ps1'), psScript, 'utf8');
    const psResult = execSync(`powershell -ExecutionPolicy Bypass -File "${__dirname}\\_set_clip.ps1"`, { timeout: 10000 });
    console.log('PowerShell:', psResult.toString().trim());
    
    // === STEP 3: Find editor area and paste ===
    // Find the editable content area
    const editorInfo = await page.evaluate(() => {
      // SE4 uses a contenteditable div for editing
      const cEditable = document.querySelector('div[contenteditable="true"]');
      
      // Also check for the SmartEditor iframe
      const editorIframe = document.querySelector('#smart_editor_blogpc001 iframe, iframe[title*="에디터"], .se_editor_iframe iframe');
      
      return {
        hasContentEditable: !!cEditable,
        ceTag: cEditable ? cEditable.tagName + '#' + cEditable.id : null,
        hasEditorIframe: !!editorIframe,
        iframeSrc: editorIframe ? editorIframe.src?.slice(0, 100) : null,
      };
    });
    console.log('Editor info:', JSON.stringify(editorInfo));
    
    // Click on the contenteditable area to focus it
    await page.evaluate(() => {
      const div = document.querySelector('div[contenteditable="true"]');
      if (div) {
        div.focus();
        // Create a click event at the center
        const rect = div.getBoundingClientRect();
        div.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        }));
      }
    });
    await page.waitForTimeout(500);
    
    // Press Ctrl+V
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(3000);
    
    // === STEP 4: Check content ===
    const check = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const content = ed.getContent ? ed.getContent() : '';
      return { 
        title: ed.getDocumentTitle(),
        contentLength: content ? content.length : 0,
        hasPTags: content ? content.includes('<p') : false,
        hasH2: content ? content.includes('<h2') : false,
      };
    });
    console.log('Content:', JSON.stringify(check));
    
    await page.screenshot({ path: 'blog_final_state.png', fullPage: false });
    console.log('Screenshot saved');
    
    // Cleanup temp files
    try {
      fs.unlinkSync(path.join(__dirname, '_clip_content.html'));
      fs.unlinkSync(path.join(__dirname, '_set_clip.ps1'));
    } catch(e) {}
    
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

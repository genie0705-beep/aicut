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
    await page.waitForTimeout(500);
    
    // === STEP 2: Set clipboard content via PowerShell ===
    const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
    
    // Write a temp PowerShell script to set clipboard
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$html = @'
${bodyHtml.replace(/'/g, "''")}
'@
[System.Windows.Forms.Clipboard]::SetText($html, [System.Windows.Forms.TextDataFormat]::Html)
Write-Host "Clipboard set: OK"
`;
    const psFile = path.join(__dirname, '_set_clip.ps1');
    fs.writeFileSync(psFile, psScript, 'utf8');
    
    const result = execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, { timeout: 10000 });
    console.log('PowerShell:', result.toString().trim());
    
    // === STEP 3: Focus editor and paste ===
    await page.evaluate(() => {
      const editor = SmartEditor._editors['blogpc001'];
      const area = editor.getEditorArea();
      if (area) {
        area.focus();
        area.click();
      }
    });
    await page.waitForTimeout(500);
    
    // Press Ctrl+V to paste
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(2000);
    
    // === STEP 4: Check content ===
    const check = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const content = ed.getContent ? ed.getContent() : '';
      return { 
        title: ed.getDocumentTitle(),
        contentLength: content.length,
        hasPTags: content.includes('<p'),
      };
    });
    console.log('Content check:', JSON.stringify(check));
    
    await page.screenshot({ path: 'blog_editor_v3.png', fullPage: false });
    console.log('Screenshot saved');
    
    // Clean up
    try { fs.unlinkSync(psFile); } catch(e) {}
    
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  }
  
  console.log('URL:', page.url());
  
  // === Set Title ===
  const titleText = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
  await page.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, titleText);
  console.log('✅ Title set');
  
  // === Set clipboard ===
  const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
  
  const psScript = `Add-Type -AssemblyName System.Windows.Forms
$c = @'
${bodyHtml}
'@
[System.Windows.Forms.Clipboard]::SetText($c)
Write-Host "OK"`;
  fs.writeFileSync('_ps_clip.ps1', psScript, 'utf8');
  execSync(`powershell -ExecutionPolicy Bypass -File "${__dirname}\\_ps_clip.ps1"`, { timeout: 10000 });
  console.log('✅ Clipboard set');
  
  // === Use _canvasScrollingService.focusFirstText() to focus first text element ===
  const focused = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed._canvasScrollingService && ed._canvasScrollingService.focusFirstText) {
        ed._canvasScrollingService.focusFirstText();
        return 'focusFirstText OK';
      }
      return 'focusFirstText not available';
    } catch(e) { return 'Error: ' + e.message; }
  });
  console.log('Focus:', focused);
  await page.waitForTimeout(500);
  
  // Try pressing Ctrl+V
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(2000);
  
  // === Alternative: Try to paste into the iframe's editable area ===
  const iframePaste = await page.evaluate(() => {
    try {
      // Try to find the SE4 editor iframe
      const iframe = document.querySelector('#smart_editor_blogpc001 iframe') || 
                     document.querySelector('iframe[title*="에디터"]') ||
                     document.querySelector('iframe.se_editor_iframe');
      if (iframe && iframe.contentDocument) {
        const body = iframe.contentDocument.body;
        if (body) {
          body.focus();
          return 'iframe body focused';
        }
      }
      return 'no iframe found';
    } catch(e) { return 'Error: ' + e.message; }
  });
  console.log('Iframe focus:', iframePaste);
  
  // Paste again in case iframe was focused
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(2000);
  
  // === Check result ===
  const check = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const content = ed.getDocumentData ? ed.getDocumentData() : '';
    return { 
      title: ed.getDocumentTitle(),
      dataLength: content.length,
      hasContent: content.length > 100,
    };
  });
  console.log('Result:', JSON.stringify(check));
  
  await page.screenshot({ path: 'blog_paste_result.png', fullPage: false });
  console.log('Screenshot saved');
  
  // Cleanup
  try { fs.unlinkSync('_ps_clip.ps1'); } catch(e) {}
})();

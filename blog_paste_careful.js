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
  
  // === 1. TITLE ===
  const title = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
  await page.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), title);
  console.log('✅ Title set');
  
  // === 2. CLIPBOARD: Set HTML content using proper CF_HTML format ===
  const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
  
  // CF_HTML format requires specific header with byte offsets
  const prefix = 'Version:1.0\r\nStartHTML:0000000000\r\nEndHTML:0000000000\r\nStartFragment:0000000000\r\nEndFragment:0000000000\r\n';
  const fragment = bodyHtml;
  const fullHtml = '<!DOCTYPE html><html><body>' + fragment + '</body></html>';
  
  const startFrag = prefix.length + fullHtml.indexOf(fragment);
  const endFrag = startFrag + fragment.length;
  const startHtml = prefix.length;
  const endHtml = prefix.length + fullHtml.length;
  
  const cfHtml = prefix.slice(0, 77) + 
    String(startHtml).padStart(10, '0') + '\r\n' +
    'EndHTML:' + String(endHtml).padStart(10, '0') + '\r\n' +
    'StartFragment:' + String(startFrag).padStart(10, '0') + '\r\n' +
    'EndFragment:' + String(endFrag).padStart(10, '0') + '\r\n' +
    fullHtml;
  
  const psScript = `Add-Type -AssemblyName System.Windows.Forms
$html = @'
${cfHtml.replace(/'/g, "''")}
'@
[System.Windows.Forms.Clipboard]::SetText($html, [System.Windows.Forms.TextDataFormat]::Html)
Write-Host "OK"`;
  
  fs.writeFileSync('_ps_clip.ps1', psScript, 'utf8');
  execSync(`powershell -ExecutionPolicy Bypass -File "${__dirname}\\_ps_clip.ps1"`, { timeout: 10000 });
  console.log('✅ Clipboard set (CF_HTML)');
  await page.waitForTimeout(300);
  
  // === 3. FOCUS and PASTE ===
  // First focus using canvasScrollingService
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
  });
  await page.waitForTimeout(300);
  
  // Paste
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(2000);
  
  // === 4. VERIFY ===
  const result = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData ? ed.getDocumentData() : '';
    const content = ed.getContent ? ed.getContent() : '';
    return {
      title: ed.getDocumentTitle(),
      dataLen: data ? data.length : 0,
      contentLen: content ? content.length : 0,
      hasPTags: data ? data.includes('<p') : false,
    };
  });
  console.log('Result:', JSON.stringify(result));
  
  await page.screenshot({ path: 'blog_careful_paste.png', fullPage: false });
  console.log('Screenshot saved');
  
  try { fs.unlinkSync('_ps_clip.ps1'); } catch(e) {}
})();

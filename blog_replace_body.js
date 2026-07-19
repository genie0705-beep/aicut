const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  const pages = context.pages();
  
  console.log('Open pages:');
  pages.forEach((p, i) => {
    const url = p.url();
    console.log('  ' + i + ': ' + (url.length > 80 ? url.slice(0, 80) + '...' : url));
  });
  
  // 찾기: 이미 열려있는 PostWriteForm 페이지
  let page = pages.find(p => p.url().includes('PostWriteForm'));
  
  if (!page) {
    // 없으면 임시저장 목록에서 찾아보기
    page = await context.newPage();
    
    // 블로그 관리 페이지로 이동
    await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&categoryNo=9', { 
      waitUntil: 'domcontentloaded', timeout: 20000 
    });
    await page.waitForTimeout(2000);
    console.log('\nBlog manage URL:', page.url());
    
    // 임시저장 글 목록 확인
    const tempPosts = await page.evaluate(() => {
      // 네이버 블로그 포스트 목록에서 임시저장 글 찾기
      const items = document.querySelectorAll('.post_list a, [class*="post"] a, td a, .title a');
      return Array.from(items).slice(0, 5).map(a => ({
        text: a.innerText.trim().slice(0, 60),
        href: a.getAttribute('href'),
      }));
    });
    console.log('Post links:', JSON.stringify(tempPosts, null, 2));
    
    // 부동산 관련 링크 찾기
    const realEstateLink = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const l of links) {
        if (l.innerText.includes('부동산') || l.href.includes('PostWriteForm')) {
          return l.href;
        }
      }
      return null;
    });
    console.log('Found link:', realEstateLink);
    
    if (realEstateLink) {
      await page.goto(realEstateLink, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
    }
  }
  
  if (page && page.url().includes('PostWriteForm')) {
    console.log('\n✅ PostWriteForm page found/opened');
    
    // Read v3 body
    const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body_v3.html'), 'utf8');
    
    // Check current content
    const before = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      return {
        title: ed.getDocumentTitle(),
        hasContent: typeof ed.getDocumentData === 'function' ? (ed.getDocumentData() || '').length > 100 : false,
      };
    });
    console.log('Before:', JSON.stringify(before));
    
    // Set clipboard with v3 content
    const psScript = `Add-Type -AssemblyName System.Windows.Forms
$c = @'
${bodyHtml}
'@
[System.Windows.Forms.Clipboard]::SetText($c)
Write-Host "OK"`;
    fs.writeFileSync('_ps_clip.ps1', psScript, 'utf8');
    const { execSync } = require('child_process');
    execSync(`powershell -ExecutionPolicy Bypass -File "${__dirname}\\_ps_clip.ps1"`, { timeout: 10000 });
    console.log('✅ Clipboard set');
    
    // Grant clipboard permissions and use navigator.clipboard API (more reliable for HTML)
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const plainText = bodyHtml.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
    await page.evaluate(async ({html, text}) => {
      try {
        const htmlBlob = new Blob([html], {type: 'text/html'});
        const textBlob = new Blob([text], {type: 'text/plain'});
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ]);
      } catch(e) {
        throw new Error('clipboard: ' + e.message);
      }
    }, { html: bodyHtml, text: plainText });
    console.log('✅ navigator.clipboard.write done');
    await page.waitForTimeout(300);
    
    // Focus and paste to overwrite
    await page.evaluate(() => {
      SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
    });
    await page.waitForTimeout(300);
    
    // Select all first, then paste (to replace existing content)
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(2000);
    
    // Check result
    const after = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData ? ed.getDocumentData() : '';
      return {
        title: ed.getDocumentTitle(),
        dataLen: data ? data.length : 0,
        hasPTags: data ? data.includes('<p') : false,
        hasH2: data ? data.includes('<h2') : false,
      };
    });
    console.log('After:', JSON.stringify(after));
    
    await page.screenshot({ path: 'blog_replaced.png', fullPage: false });
    
    // Save
    const saved = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText.trim() === '저장' || b.innerText.includes('저장')) {
          b.click();
          return 'clicked: ' + b.innerText.trim();
        }
      }
      return 'save button not found';
    });
    console.log('Save:', saved);
    await page.waitForTimeout(2000);
    
    console.log('\n✅ 본문 교체 완료!');
    
    try { fs.unlinkSync('_ps_clip.ps1'); } catch(e) {}
  } else {
    console.log('❌ PostWriteForm page not available');
  }
})();

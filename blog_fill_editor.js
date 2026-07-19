const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    
    // Find the PostWriteForm page
    let page = pages.find(p => p.url().includes('PostWriteForm'));
    if (!page) {
      page = await context.newPage();
      await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
    }
    
    console.log('Current URL:', page.url());
    
    // ===== STEP 1: Set TITLE =====
    const titleText = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
    
    const titleResult = await page.evaluate((title) => {
      const editor = SmartEditor._editors['blogpc001'];
      if (editor && editor.setDocumentTitle) {
        editor.setDocumentTitle(title);
        return 'title set via API';
      }
      // Fallback: find the title input
      const titleInput = document.querySelector('#title, .se-title-input, [name="title"], .write_title');
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        return 'title set via input';
      }
      return 'title NOT set';
    }, titleText);
    console.log('Title result:', titleResult);
    await page.waitForTimeout(500);
    
    // ===== STEP 2: Load blog body HTML =====
    const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
    
    // Build full HTML with images
    // Images need to be uploaded first through SE4's file upload
    // For now, insert text content first
    
    // Focus the editor
    await page.evaluate(() => {
      const editor = SmartEditor._editors['blogpc001'];
      if (editor && editor.getEditorArea) {
        const area = editor.getEditorArea();
        if (area) area.focus();
      }
    });
    await page.waitForTimeout(500);
    
    // Use clipboard paste approach (React-friendly)
    await page.evaluate((html) => {
      // Create a clipboard event with HTML content
      const handler = (e) => {
        e.clipboardData.setData('text/html', html);
        e.clipboardData.setData('text/plain', html.replace(/<[^>]+>/g, ''));
        e.preventDefault();
        e.stopPropagation();
      };
      document.addEventListener('paste', handler, true);
      
      // Trigger paste via execCommand or dispatch
      const editor = SmartEditor._editors['blogpc001'];
      if (editor && editor.getEditorArea) {
        const area = editor.getEditorArea();
        if (area) {
          area.dispatchEvent(new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer()
          }));
        }
      }
      
      document.removeEventListener('paste', handler, true);
    }, bodyHtml);
    
    console.log('Body paste attempted');
    await page.waitForTimeout(2000);
    
    // ===== STEP 3: Check if content was inserted =====
    const bodyCheck = await page.evaluate(() => {
      const editor = SmartEditor._editors['blogpc001'];
      let content = '';
      try { content = editor.getContent ? editor.getContent() : ''; } catch(e) {}
      return {
        title: editor.getDocumentTitle ? editor.getDocumentTitle() : '',
        contentLength: content.length,
        contentPreview: content.replace(/<[^>]+>/g, '').slice(0, 100),
      };
    });
    console.log('Editor content check:', JSON.stringify(bodyCheck));
    
    // ===== STEP 4: Try uploading images =====
    const imageFiles = [
      'aicut_blog_realestate_main.png',
      'aicut_blog_realestate_card1.png',
      'aicut_blog_realestate_card2.png',
      'aicut_blog_realestate_card3.png',
      'aicut_blog_realestate_cta.png'
    ];
    
    // Find the image upload button
    const uploadBtn = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"], span, div');
      for (const b of buttons) {
        const text = b.innerText.trim();
        if (text === '사진' || text === '이미지' || text === '사진 추가' || text === '파일') {
          return text;
        }
        // Look for icons
        if (b.querySelector('svg, img[alt*="사진"], img[alt*="이미지"], .icon-image, [class*="photo"], [class*="image"]')) {
          return b.tagName + ' ' + (b.className || '');
        }
      }
      return 'not found via text';
    });
    console.log('Upload button:', uploadBtn);
    
    // Try to click the image upload button and get file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      page.evaluate(() => {
        // SE4 toolbar buttons - try finding the image insert button
        const toolbar = document.querySelector('.se-toolbar, .smart_editor_toolbar, .editor_toolbar, .cke_toolbox');
        if (toolbar) {
          const btns = toolbar.querySelectorAll('button, a, span[role="button"]');
          for (const b of btns) {
            if (b.innerText.includes('사진') || b.innerText.includes('이미지') || 
                b.getAttribute('title')?.includes('사진') || b.getAttribute('title')?.includes('이미지')) {
              b.click();
              return 'clicked via toolbar';
            }
          }
        }
        return 'not found in toolbar';
      }).catch(() => 'evaluate error')
    ]);
    
    console.log('File chooser:', fileChooser ? 'captured' : 'not captured');
    
    await page.screenshot({ path: 'blog_editor_final.png', fullPage: false });
    console.log('\nScreenshot saved: blog_editor_final.png');
    console.log('✅ Editor fill attempt complete');
    
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

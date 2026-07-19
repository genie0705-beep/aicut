const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    
    // Find the PostWriteForm page
    let page = context.pages().find(p => p.url().includes('PostWriteForm'));
    if (!page) {
      page = await context.newPage();
      await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
    }
    
    console.log('URL:', page.url());
    
    // ===== STEP 1: Set TITLE =====
    const titleText = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
    await page.evaluate((t) => {
      SmartEditor._editors['blogpc001'].setDocumentTitle(t);
    }, titleText);
    console.log('✅ Title set');
    await page.waitForTimeout(500);
    
    // ===== STEP 2: Paste body content via keyboard =====
    const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
    
    // Method: Use SE4 API to set content directly + trigger React update
    // First try setDocumentData
    await page.evaluate((html) => {
      const editor = SmartEditor._editors['blogpc001'];
      editor.setDocumentData(html);
    }, bodyHtml);
    console.log('✅ setDocumentData called');
    await page.waitForTimeout(1000);
    
    // Check if content was set
    let check = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      return { 
        title: ed.getDocumentTitle(),
        dataLen: ed.getContent ? ed.getContent().length : 0,
        docDataLen: ed.getDocumentData ? ed.getDocumentData().length : 0
      };
    });
    console.log('After setDocumentData:', JSON.stringify(check));
    
    if (check.dataLen === 0 && check.docDataLen > 0) {
      // Data is set but not rendered - need to force React update
      // Try focusing and using insertHTML command
      console.log('Data set but not rendered - trying execCommand...');
      await page.evaluate(() => {
        const editor = SmartEditor._editors['blogpc001'];
        const area = editor.getEditorArea();
        if (area) {
          area.focus();
          // Try to trigger React update
          area.dispatchEvent(new Event('focus', { bubbles: true }));
          area.dispatchEvent(new Event('click', { bubbles: true }));
        }
      });
      await page.waitForTimeout(1000);
      
      // Try the clipboard approach using CDP's clipboard capabilities
      // Use Keyboard to type
      const plainText = bodyHtml.replace(/<[^>]+>/g, '').slice(0, 200);
      await page.keyboard.type(plainText, { delay: 10 });
      await page.waitForTimeout(500);
    }
    
    // Check again
    check = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      return { 
        title: ed.getDocumentTitle(),
        dataLen: ed.getContent ? ed.getContent().length : 0
      };
    });
    console.log('Final check:', JSON.stringify(check));
    
    // ===== STEP 3: Upload images =====
    const imageDir = __dirname;
    const imageFiles = [
      'aicut_blog_realestate_main.png',
      'aicut_blog_realestate_card1.png',
      'aicut_blog_realestate_card2.png',
      'aicut_blog_realestate_card3.png',
      'aicut_blog_realestate_cta.png'
    ].map(f => path.join(imageDir, f));
    
    console.log('\n=== Image Upload ===');
    // Find the image upload input in SE4
    const uploadInput = await page.evaluate(() => {
      // SE4 often has a hidden file input for image uploads
      const inputs = document.querySelectorAll('input[type="file"]');
      for (const inp of inputs) {
        if (inp.accept && (inp.accept.includes('image') || inp.accept.includes('jpg') || inp.accept.includes('png'))) {
          return inp.id || inp.className;
        }
      }
      // Look for the image upload button in toolbar
      const toolbarBtns = document.querySelectorAll('.se-toolbar button, .smart_editor_toolbar button');
      for (const btn of toolbarBtns) {
        if (btn.innerText.includes('사진') || btn.title?.includes('사진') || btn.title?.includes('그림')) {
          return 'button found: ' + btn.innerText;
        }
      }
      return 'not found';
    });
    console.log('Upload input:', uploadInput);
    
    // Try clicking image button and using file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      page.evaluate(() => {
        // Simpler: look for any button/icon related to image
        const all = document.querySelectorAll('button, [role="button"], a');
        for (const el of all) {
          const title = el.getAttribute('title') || '';
          const text = el.innerText || '';
          const cls = el.className || '';
          if (title.includes('사진') || title.includes('이미지') || 
              text.includes('사진') || cls.includes('photo') || cls.includes('image') ||
              title.includes('Picture') || title.includes('Image')) {
            el.click();
            return 'clicked: ' + (title || text).slice(0, 30);
          }
        }
        return 'nothing clicked';
      })
    ]);
    
    console.log('File chooser:', fileChooser ? 'READY' : 'NOT CAPTURED');
    if (fileChooser) {
      await fileChooser.setFiles(imageFiles);
      console.log('✅ Image files uploaded');
      await page.waitForTimeout(5000);
    }
    
    await page.screenshot({ path: 'blog_editor_final2.png', fullPage: false });
    console.log('\nScreenshot saved');
    
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

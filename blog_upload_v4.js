const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

const IMAGES = [
  'aicut_blog_freelancer_thumb.png',
  'aicut_blog_freelancer_01.png',
  'aicut_blog_freelancer_02.png',
  'aicut_blog_freelancer_03.png',
  'aicut_blog_freelancer_cta.png',
];

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Title
  console.log('=== 제목 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅');
  
  // 2. Upload images - use JS injection method
  console.log('\n=== 이미지 업로드 (new approach) ===');
  
  for (let i = 0; i < IMAGES.length; i++) {
    const imgName = IMAGES[i];
    const imgPath = path.join(WORKSPACE, imgName);
    process.stdout.write(`  ${i+1}/5: ${imgName}... `);
    
    // Create a file input programmatically and trigger it
    const uploadResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Create a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        // Listen for file change
        input.addEventListener('change', function() {
          resolve({ files: this.files.length > 0 ? this.files[0].name : 'none' });
        });
        
        // Also listen for cancel
        setTimeout(() => {
          resolve({ error: 'timeout', files: 'none' });
        }, 10000);
        
        // Click the 사진 button which should trigger the file selection
        input.click();
      });
    });
    
    console.log('create result:', JSON.stringify(uploadResult));
    
    // Actually, this won't work because the file input needs to be handled by Playwright
    // Let's try a different approach
    
    // Use the editor's own upload mechanism
    const fileInput = await page.evaluate(() => {
      // Click 사진 button and wait for the file input
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim().startsWith('사진')) {
          btn.click();
          break;
        }
      }
      
      // After click, check for any dynamically created file inputs
      return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
          for (const mut of mutations) {
            if (mut.addedNodes) {
              for (const node of mut.addedNodes) {
                if (node.tagName === 'INPUT' && node.type === 'file') {
                  observer.disconnect();
                  resolve({ id: node.id, accept: node.accept });
                  return;
                }
              }
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
          observer.disconnect();
          resolve({ error: 'No file input created within 5s' });
        }, 5000);
      });
    });
    
    console.log('After 사진 click:', JSON.stringify(fileInput));
    
    if (fileInput.id) {
      const inputEl = await page.$('#' + fileInput.id);
      if (inputEl) {
        await inputEl.setInputFiles(imgPath);
        console.log('✅ uploaded via dynamic input');
        await page.waitForTimeout(2000);
      }
    } else {
      // The 사진 button might directly trigger a filechooser
      // Let's try with a fresh waitForEvent
      const fcPromise = page.waitForEvent('filechooser', { timeout: 8000 });
      
      // Click the 사진 button again
      const btnPos = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if ((btn.innerText || '').trim().startsWith('사진')) {
            const r = btn.getBoundingClientRect();
            return { x: r.x + r.width/2, y: r.y + r.height/2 };
          }
        }
        return null;
      });
      
      if (btnPos) {
        // Click using dispatchEvent to avoid issues with Playwright mouse
        await page.evaluate((x, y) => {
          const el = document.elementFromPoint(x, y);
          if (el) {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
          }
        }, btnPos.x, btnPos.y);
        
        await page.waitForTimeout(2000);
        const fc = await fcPromise.catch(() => null);
        
        if (fc) {
          await fc.setFiles(imgPath);
          console.log('✅ uploaded via filechooser');
          await page.waitForTimeout(2000);
        } else {
          console.log('❌ no filechooser');
        }
      } else {
        console.log('❌ no button');
      }
    }
  }
  
  // 3. Body and hashtags
  console.log('\n=== 본문 붙여넣기 ===');
  const BODY_HTML = `<p style="text-align: center; line-height: 1.6;">💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"<br>💭 "수정 요청 30회, 편집자가 연락 두절"<br>💭 "이번 달 편집자, 또 바꿔야 하나?"</p><p style="text-align: center;"><br></p><p style="text-align: center; line-height: 1.6;">영상 편집 아웃소싱을 해본 브랜드라면 누구나 한 번쯤 겪는 상황입니다.</p>`;
  await page.evaluate((html) => { navigator.clipboard.writeText(html); }, BODY_HTML);
  await page.waitForTimeout(300);
  await page.mouse.click(400, 300);
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(2000);
  console.log('✅');
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_final_attempt.png'), fullPage: true });
  console.log('\nScreenshot saved. Check blog_final_attempt.png');
  
  await browser.close();
})();

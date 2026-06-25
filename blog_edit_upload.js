const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const LOGNO = '224326361515';
const IMG_NAMES = [
  'aicut_blog_5q_thumb.png',
  'aicut_blog_5q_q1.png',
  'aicut_blog_5q_q2.png',
  'aicut_blog_5q_q3.png',
  'aicut_blog_5q_q4.png'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = null;
  for (const p of pages) {
    if (p.url().includes('blog.naver.com')) { target = p; break; }
  }
  if (!target) { target = await b.contexts()[0].newPage(); }
  
  target.on('dialog', async d => { await d.dismiss(); });
  await target.bringToFront();
  
  // Open edit page
  console.log('Opening edit page...');
  await target.goto('https://blog.naver.com/PostUpdate.nhn?blogId=aicut&logNo=' + LOGNO, { timeout: 30000 }).catch(() => {});
  await sleep(6000);
  
  // Check editor
  const check = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const imgComponents = document.querySelectorAll('.se-component.se-image');
      const actualImgs = document.querySelectorAll('.se-component.se-image img');
      return {
        ok: true,
        title: ed.getDocumentTitle(),
        len: ed.getContentText().length,
        imgComponents: imgComponents.length,
        actualImgs: actualImgs.length
      };
    } catch(e) {
      return { ok: false, err: e.message, url: location.href.substring(0, 100) };
    }
  });
  console.log('EDITOR:', JSON.stringify(check));
  
  if (!check.ok) {
    console.log('Editor not available');
    b.close();
    return;
  }
  
  // Upload images by clicking each image component
  console.log('\n=== IMAGE UPLOAD ===');
  
  // Method: Click image component → popup appears → Click "내 PC" → file chooser
  for (let i = 0; i < IMG_NAMES.length; i++) {
    const imgPath = path.join(__dirname, IMG_NAMES[i]);
    if (!fs.existsSync(imgPath)) {
      console.log(`  [${i+1}] MISSING: ${IMG_NAMES[i]}`);
      continue;
    }
    
    console.log(`  [${i+1}] ${IMG_NAMES[i]} (${(fs.statSync(imgPath).size/1024).toFixed(0)}KB)`);
    
    // Click the image component to select it
    const imgComponents = await target.$$('.se-component.se-image');
    if (i >= imgComponents.length) {
      console.log(`       No more image components at index ${i}`);
      break;
    }
    
    // Try clicking center of image component
    await imgComponents[i].click();
    await sleep(1500);
    
    // Check if a popup menu appeared with image options
    const hasPopup = await target.evaluate(() => {
      // Look for visible popup/menu related to images
      const popups = document.querySelectorAll('[class*="popup"], [class*="layer"], [class*="menu"]');
      for (const p of popups) {
        if (p.offsetParent !== null && p.innerText.includes('사진')) {
          return p.innerText.replace(/\s+/g, ' ').trim().substring(0, 200);
        }
      }
      return null;
    });
    
    if (hasPopup) {
      console.log(`       Popup: ${hasPopup.substring(0, 80)}`);
      
      // Look for "내 PC" or "파일 선택" button
      const pcBtn = await target.evaluate(() => {
        const all = document.querySelectorAll('button, span, div');
        for (const el of all) {
          if (el.offsetParent === null) continue;
          const t = (el.innerText || '').trim();
          if (t.includes('내 PC') || t.includes('사진 선택') || t.includes('파일 선택')) {
            el.click();
            return t.substring(0, 30);
          }
        }
        return null;
      });
      
      if (pcBtn) {
        console.log(`       Clicked: "${pcBtn}"`);
        await sleep(2000);
        
        // Try file chooser
        const [fc] = await Promise.all([
          target.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
          Promise.resolve() // already clicked
        ]);
        
        if (fc) {
          await fc.setFiles([imgPath]);
          console.log(`       ✅ File set`);
          await sleep(5000);
        } else {
          console.log(`       No file chooser`);
        }
      }
    } else {
      // Try direct file chooser from component click
      const [fc] = await Promise.all([
        target.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
        imgComponents[i].click({ position: { x: 200, y: 100 } })
      ]);
      
      if (fc) {
        await fc.setFiles([imgPath]);
        console.log(`       ✅ Direct file chooser`);
        await sleep(5000);
      } else {
        console.log(`       ❌ No response`);
      }
    }
  }
  
  // Check result
  const result = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const imgs = document.querySelectorAll('.se-component.se-image img');
      return {
        len: ed.getContentText().length,
        actualImgCount: imgs.length
      };
    } catch(e) {
      return { err: e.message };
    }
  });
  console.log('\nRESULT:', JSON.stringify(result));
  
  b.close();
  console.log('\nDone');
})().catch(e => console.log('FATAL: ' + e.message.substring(0, 300)));

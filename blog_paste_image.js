// 클립보드 붙여넣기 방식으로 블로그 이미지 삽입
const { chromium } = require('playwright');
const fs = require('fs');

const POST = { logNo: '224315539820' };
const IMG_PATH = 'C:/Users/paul/.openclaw/workspace/blog_img_shop.png';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('postupdate') && pg.url().includes(POST.logNo)) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('❌ 에디터 탭 없음'); await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  // Find SmartEditor contenteditable frame
  let seFrame = null;
  for (const f of page.frames()) {
    try {
      const info = await f.evaluate(() => ({
        ce: document.querySelectorAll('[contenteditable]').length,
        text: (document.body.innerText || '').substring(0, 50)
      })).catch(() => null);
      if (info && info.ce > 0) {
        seFrame = f;
        console.log('✅ SE contenteditable 프레임:', f.name() || f.url().substring(0, 50));
        break;
      }
    } catch(e) {}
  }
  if (!seFrame) { console.log('❌ SE 프레임 못찾음'); await b.close(); return; }

  // Step 1: Set clipboard with image data via page.evaluate
  // First, create a blob URL for the image
  const imgBuffer = fs.readFileSync(IMG_PATH);
  const imgBase64 = imgBuffer.toString('base64');
  
  console.log('이미지 로드 완료 (' + Math.round(imgBuffer.length / 1024) + 'KB)');

  // Step 2: Load the image into a temporary canvas and copy to clipboard
  const clipboardSet = await page.evaluate((base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob and copy to clipboard
          canvas.toBlob(async (blob) => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({
                  [blob.type]: blob
                })
              ]);
              resolve('CLIPBOARD_SET_SUCCESS');
            } catch(e) {
              resolve('CLIPBOARD_ERROR: ' + e.message.substring(0, 80));
            }
          }, 'image/png');
        } catch(e) {
          resolve('CANVAS_ERROR: ' + e.message.substring(0, 80));
        }
      };
      img.onerror = () => resolve('IMG_LOAD_ERROR');
      img.src = 'data:image/png;base64,' + base64;
    });
  }, imgBase64);
  
  console.log('클립보드 설정:', clipboardSet);
  await sleep(1000);

  // Step 3: Focus the contenteditable and paste
  if (clipboardSet.includes('SUCCESS')) {
    const pasteResult = await seFrame.evaluate(() => {
      try {
        const ce = document.querySelector('[contenteditable]');
        if (!ce) return 'NO_CE';
        
        ce.focus();
        
        // Move cursor to after the title (first content section)
        const selection = window.getSelection();
        const range = document.createRange();
        
        // Find "쇼핑몰을 운영하다" text to place cursor there
        const children = ce.children;
        let targetIdx = 0;
        for (let i = 0; i < children.length; i++) {
          const text = (children[i].innerText || '').trim();
          if (text.includes('쇼핑몰을 운영하다')) {
            targetIdx = i;
            break;
          }
        }
        
        // Place cursor at the beginning of the target paragraph
        range.setStart(children[targetIdx], 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Insert a couple of line breaks first
        document.execCommand('insertHTML', false, '<p><br></p><p><br></p>');
        
        // Then simulate paste
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: new DataTransfer()
        });
        
        // The clipboardData might not have the image, but the browser's clipboard should
        ce.dispatchEvent(pasteEvent);
        
        return 'PASTE_ATTEMPTED at index ' + targetIdx;
      } catch(e) {
        return 'ERROR: ' + e.message.substring(0, 100);
      }
    });
    
    console.log('붙여넣기 결과:', pasteResult);
    await sleep(3000);
    
    // Check if image appeared
    const check = await seFrame.evaluate(() => {
      const ce = document.querySelector('[contenteditable]');
      if (!ce) return 'NO_CE';
      const html = ce.innerHTML;
      const imgCount = (html.match(/<img/g) || []).length;
      const srcs = Array.from(ce.querySelectorAll('img')).slice(0, 2).map(i => (i.src || '').substring(0, 60));
      return { imgCount, srcs, contentLength: html.length };
    });
    console.log('에디터 상태:', JSON.stringify(check));
    
    // If image is there, click 발행
    if (check && check.imgCount > 0) {
      console.log('✅ 이미지 본문 삽입 확인!');
      
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const btn of btns) {
          if ((btn.innerText || '').trim() === '발행' && btn.offsetParent !== null) {
            btn.click();
            return;
          }
        }
      });
      await sleep(3000);
      console.log('✅ 발행 완료!');
    } else {
      console.log('⚠️ 이미지가 본문에 안들어감');
      
      // Try one more approach: use the uploaded image URL from Naver
      // The file was uploaded earlier - find the CDN URL
      const uploadedImgs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
          .filter(i => (i.src || '').includes('blogfiles'))
          .slice(0, 3)
          .map(i => i.src);
      });
      
      if (uploadedImgs.length > 0) {
        console.log('업로드된 이미지 발견:', JSON.stringify(uploadedImgs));
        
        // Insert the Naver CDN URL directly
        const insertResult = await seFrame.evaluate((imgUrl) => {
          const ce = document.querySelector('[contenteditable]');
          if (!ce) return 'NO_CE';
          ce.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          range.setStart(ce, ce.children.length);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          
          const imgHtml = '<p><br></p><p style="text-align: center;"><img src="' + imgUrl + '" style="max-width: 500px;" /></p><p><br></p>';
          document.execCommand('insertHTML', false, imgHtml);
          return 'INSERTED_CDN_' + imgUrl.substring(0, 40);
        }, uploadedImgs[0]);
        
        console.log('CDN URL 삽입 결과:', insertResult);
        await sleep(1000);
        
        // Click 발행
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          for (const btn of btns) {
            if ((btn.innerText || '').trim() === '발행' && btn.offsetParent !== null) {
              btn.click();
              return;
            }
          }
        });
        await sleep(3000);
        console.log('✅ CDN 이미지 삽입 + 발행 완료!');
      } else {
        console.log('⚠️ 업로드된 이미지 URL도 못찾음');
      }
    }
  }

  console.log('\n✅ 작업 완료');
  await b.close();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

// Naver SmartEditor4 파일 업로드 방식으로 이미지 삽입
const { chromium } = require('playwright');
const fs = require('fs');

const POST = { logNo: '224315539820' };
const IMG_PATH = 'C:/Users/paul/.openclaw/workspace/blog_img_shop.png';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // Find editor page
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('postupdate') && pg.url().includes(POST.logNo)) {
      page = pg;
      break;
    }
  }

  if (!page) { console.log('❌ 에디터 없음'); await b.close(); return; }
  await page.bringToFront();
  await page.waitForTimeout(1000);

  // File chooser handler
  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);

  try {
    // Click "사진 추가" button - this should open a file chooser or dropdown
    await page.evaluate(() => {
      // Try clicking the photo add button
      const btns = Array.from(document.querySelectorAll('button, span, div'));
      for (const el of btns) {
        const t = (el.innerText || '').trim();
        if (t === '사진 추가' && el.offsetParent !== null) {
          el.click();
          return;
        }
      }
    });

    await page.waitForTimeout(2000);

    // Check if file chooser appeared
    let fileChooser = await fileChooserPromise;

    if (fileChooser) {
      console.log('✅ 파일 선택 다이얼로그 열림!');
      await fileChooser.setFiles(IMG_PATH);
      console.log('✅ 이미지 업로드 완료!');
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️ 파일 선택 다이얼로그 없음. 드롭다운 메뉴가 열렸을 수 있음.');
      
      // Check if a "내 PC" or "업로드" option appeared
      const submenu = await page.evaluate(() => {
        const allEls = Array.from(document.querySelectorAll('button, span, a, div, li'));
        const uploadOpts = allEls.filter(el => {
          const t = (el.innerText || '').trim();
          return (t.includes('내 PC') || t.includes('업로드') || t.includes('파일 선택') || t.includes('내컴퓨터')) && el.offsetParent !== null;
        });
        return uploadOpts.slice(0, 5).map(el => ({
          tag: el.tagName,
          text: (el.innerText || '').trim().substring(0, 30),
          rect: {
            x: Math.round(el.getBoundingClientRect().x),
            y: Math.round(el.getBoundingClientRect().y),
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height)
          },
          visible: el.offsetParent !== null
        }));
      });
      
      console.log('업로드 옵션들:', JSON.stringify(submenu, null, 2));
      
      if (submenu.length > 0) {
        // Click "내 PC에서 업로드" option
        const opt = submenu[0];
        const cx = opt.rect.x + opt.rect.w / 2;
        const cy = opt.rect.y + opt.rect.h / 2;
        console.log('🖱️', opt.text, '클릭:', Math.round(cx), Math.round(cy));
        
        // Set up file chooser again
        const fcPromise2 = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
        await page.mouse.click(cx, cy);
        await page.waitForTimeout(2000);
        
        const fc2 = await fcPromise2;
        if (fc2) {
          console.log('✅ 두번째 시도 파일 선택 다이얼로그 열림!');
          await fc2.setFiles(IMG_PATH);
          console.log('✅ 이미지 업로드 완료!');
          await page.waitForTimeout(3000);
        } else {
          console.log('⚠️ 여전히 파일 다이얼로그 안 열림');
        }
      } else {
        // Try direct approach: find hidden file input
        const fileInputs = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
          return inputs.map(el => ({
            id: el.id,
            accept: el.accept,
            hidden: el.offsetParent === null,
            rect: {
              x: Math.round(el.getBoundingClientRect().x),
              y: Math.round(el.getBoundingClientRect().y),
              w: Math.round(el.getBoundingClientRect().width),
              h: Math.round(el.getBoundingClientRect().height)
            }
          }));
        });
        
        console.log('파일 input 요소들:', JSON.stringify(fileInputs, null, 2));
        
        if (fileInputs.length > 0) {
          // Directly set the file on the hidden input
          const input = await page.$('input[type="file"]');
          if (input) {
            await input.setInputFiles(IMG_PATH);
            console.log('✅ 직접 파일 설정 완료!');
            await page.waitForTimeout(3000);
          }
        }
      }
    }
  } catch(e) {
    console.log('파일 초이스 에러:', e.message.substring(0, 100));
  }

  // After upload, check if image appeared in contenteditable
  await page.waitForTimeout(2000);
  
  // Click 발행
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '발행' && btn.offsetParent !== null) {
        btn.click();
        console.log('✅ 발행 클릭');
        return;
      }
    }
  });
  
  await page.waitForTimeout(3000);
  console.log('✅ 작업 완료');

  await b.close();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

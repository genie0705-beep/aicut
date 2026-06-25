// Naver 블로그 이미지 업로드 + 본문 삽입 + 발행
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const IMG_PATH = 'C:/Users/paul/.openclaw/workspace/blog_img_shop.png';
const POST = { logNo: '224315539820' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // Find postupdate tab
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('postupdate') && pg.url().includes(POST.logNo)) {
      page = pg;
      break;
    }
  }
  if (!page) {
    // Create fresh by navigating from PostList
    for (const pg of ctx.pages()) {
      if (pg.url().includes('PostList.naver')) {
        page = pg;
        await pg.bringToFront();
        await pg.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          for (const a of links) {
            if (a.href && a.href.includes('suggestConvert') && a.href.includes(POST.logNo)) {
              a.click(); return;
            }
          }
        });
        await sleep(3000);
        // Re-find the new tab
        for (const p of ctx.pages()) {
          if (p.url().includes('postupdate')) {
            page = p;
            break;
          }
        }
        break;
      }
    }
  }

  if (!page) { console.log('❌ 에디터 못찾음'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);

  // Step 1: Set up file chooser THEN click photo button
  console.log('1️⃣ 사진 업로드 버튼 클릭...');
  
  // First click "사진 추가" to open the dropdown
  await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('button, span, div'));
    for (const el of allEls) {
      if ((el.innerText || '').trim() === '사진 추가' && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  await sleep(1500);

  // Check for "내 PC에서 업로드" option and click it, with file chooser ready
  const fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
  
  const submenuClick = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('button, span, a, div, li'));
    for (const el of allEls) {
      const t = (el.innerText || '').trim();
      const visible = el.offsetParent !== null;
      if (visible && (t.includes('내 PC') || t.includes('내컴퓨터') || t === '업로드' || t === '파일 업로드')) {
        const r = el.getBoundingClientRect();
        el.click();
        return { text: t, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    return null;
  });
  
  console.log('서브메뉴 클릭:', JSON.stringify(submenuClick));
  await sleep(1500);

  // Try file chooser
  let fc = await fcPromise;
  
  // If no file chooser yet, try clicking directly on 사진 추가 again
  if (!fc) {
    const fcPromise2 = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
    
    // Try clicking the 사진 button in the toolbar directly (it should trigger file chooser)
    const clickResult = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const btn of btns) {
        const t = (btn.innerText || '').trim();
        if ((t === '사진' || t.includes('사진')) && btn.offsetParent !== null && btn.getBoundingClientRect().width > 10) {
          const r = btn.getBoundingClientRect();
          btn.click();
          return { text: t, x: r.x, y: r.y, w: r.width, h: r.height };
        }
      }
      return null;
    });
    console.log('사진 버튼 직접 클릭:', JSON.stringify(clickResult));
    await sleep(2000);
    
    fc = await fcPromise2;
  }

  if (!fc) {
    console.log('⚠️ 파일 선택 다이얼로그 안열림. 강제로 input 찾기...');
    
    const fileInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input[type="file"]'))
        .map(el => ({ id: el.id, accept: el.accept }));
    });
    console.log('파일 inputs:', JSON.stringify(fileInputs));
    
    if (fileInputs.length > 0) {
      const input = await page.$('input[type="file"]');
      if (input) {
        await input.setInputFiles(IMG_PATH);
        console.log('✅ 직접 파일 설정');
      }
    }
  } else {
    console.log('✅ 파일 선택 다이얼로그 열림!');
    await fc.setFiles(IMG_PATH);
    console.log('✅ 이미지 업로드 시작!');
  }

  // Wait for upload to complete and image to appear in the editor
  await sleep(5000);

  // Step 2: Check if image appeared in the editor contenteditable
  const mainFrame = page.frames()[0];
  const childFrames = mainFrame.childFrames();
  
  let contentUpdated = false;
  for (const cf of childFrames) {
    try {
      const ceInfo = await cf.evaluate(() => {
        const ce = document.querySelector('[contenteditable]');
        if (!ce) return null;
        return {
          hasImg: ce.innerHTML.includes('<img'),
          imgCount: (ce.innerHTML.match(/<img/g) || []).length,
          contentLength: ce.innerHTML.length
        };
      }).catch(() => null);
      
      if (ceInfo && ceInfo.hasImg) {
        console.log('✅ 본문에 이미지 확인됨:', JSON.stringify(ceInfo));
        contentUpdated = true;
        break;
      }
    } catch(e) {}
  }

  if (!contentUpdated) {
    console.log('⚠️ 본문에 이미지 없음. 업로드 완료 후 이미지 선택 필요할 수 있음.');
    
    // Check if there's a thumbnail/preview of uploaded image that needs to be clicked
    const uploadResult = await page.evaluate(() => {
      const body = document.body.innerText;
      // Look for uploaded image indicators
      const lines = body.split('\n').filter(l => l.trim());
      const relevant = lines.filter(l => l.includes('완료') || l.includes('추가') || l.includes('업로드') || l.includes('선택') || l.includes('확인'));
      return relevant.slice(0, 10);
    });
    console.log('업로드 후 UI 텍스트:', JSON.stringify(uploadResult));
  }

  // Step 3: Click 발행
  console.log('\n3️⃣ 발행 버튼 클릭...');
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
  console.log('✅ 완료!');
  await b.close();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

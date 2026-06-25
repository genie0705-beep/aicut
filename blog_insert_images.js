// 쇼핑몰 포스트 이미지 삽입 + 발행
const { chromium } = require('playwright');
const fs = require('fs');

const POST = { logNo: '224315539820' };
const IMG_PATH = 'C:/Users/paul/.openclaw/workspace/blog_img_shop.png';
const imgBase64 = fs.readFileSync(IMG_PATH).toString('base64');
const imgDataUrl = 'data:image/png;base64,' + imgBase64;

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

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

  // Find SE contenteditable frame
  let seFrame = null;
  const mainFrame = page.frames()[0];
  for (const cf of mainFrame.childFrames()) {
    try {
      if (await cf.evaluate(() => document.querySelectorAll('[contenteditable]').length > 0)) {
        seFrame = cf; break;
      }
    } catch(e) {}
  }
  if (!seFrame) { console.log('❌ SE 프레임 없음'); await b.close(); return; }

  // Insert image at beginning of content (after first paragraph)
  const imgHtml = '<p><br></p><p style="text-align: center;"><img src="' + imgDataUrl + '" style="max-width: 500px; width: 100%;" /></p><p><br></p>';
  
  const result = await seFrame.evaluate((html) => {
    try {
      const ce = document.querySelector('[contenteditable]');
      if (!ce) return 'NO_CE';
      ce.focus();
      
      // Move cursor to after the title section (first 2-3 paragraphs)
      const children = ce.children;
      let insertAfter = 0;
      for (let i = 0; i < Math.min(5, children.length); i++) {
        const text = (children[i].innerText || '').trim();
        if (text.includes('필요한 이유') || text.includes('쇼핑몰을 운영하다')) {
          insertAfter = i;
          break;
        }
      }
      
      // Insert after position
      const refNode = children[insertAfter] || children[0];
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      while (temp.firstChild) {
        if (refNode && refNode.parentNode) {
          refNode.parentNode.insertBefore(temp.firstChild, refNode.nextSibling);
        }
      }
      
      return 'SUCCESS inserted after index ' + insertAfter;
    } catch(e) {
      return 'ERROR: ' + (e.message || '').substring(0, 100);
    }
  }, imgHtml);

  console.log('삽입 결과:', result);
  await page.waitForTimeout(1500);

  // Click 발행 button
  const pubResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pubBtn = btns.find(el => (el.innerText || '').trim() === '발행');
    if (pubBtn) { pubBtn.click(); return '발행 클릭!'; }
    return '발행 버튼 없음';
  });
  console.log(pubResult);
  await page.waitForTimeout(3000);

  // Click 확인 on any confirmation dialog
  try {
    const dialogs = await page.evaluate(() => {
      const confirmBtns = Array.from(document.querySelectorAll('button'));
      return confirmBtns
        .filter(el => ['확인', '예', '저장', 'OK'].includes((el.innerText || '').trim()))
        .map(el => el.innerText);
    });
    console.log('확인 버튼들:', dialogs);
    
    // Try clicking confirmation
    for (const text of ['확인', '예', '저장']) {
      const btn = await page.evaluate((t) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(el => (el.innerText || '').trim() === t);
        if (b) { b.click(); return t + ' clicked'; }
        return t + ' not found';
      }, text);
      if (btn.includes('clicked')) {
        console.log('✅', btn);
        await page.waitForTimeout(2000);
        break;
      }
    }
  } catch(e) {
    console.log('다이얼로그 처리 오류:', (e.message || '').substring(0, 50));
  }

  // Final page state
  await page.waitForTimeout(2000);
  const finalUrl = page.url();
  console.log('최종 URL:', finalUrl.substring(0, 100));
  
  const finalText = await page.evaluate(() => {
    return (document.body.innerText || '').substring(0, 200);
  });
  console.log('최종 상태:', finalText.substring(0, 100));

  console.log('\n✅ 쇼핑몰 포스트 이미지 삽입 + 발행 완료!');
  await b.close();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

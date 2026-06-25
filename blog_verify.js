const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224315539820', { 
    waitUntil: 'domcontentloaded', timeout: 15000 
  });
  await page.waitForTimeout(5000);
  
  // Try mainFrame
  const frame = page.frame({ name: 'mainFrame' });
  if (frame) {
    const info = await frame.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const postImgs = [];
      imgs.forEach(function(img) {
        const src = img.src || '';
        // Filter out Naver UI images (spc.gif, icons, etc)
        if (!src.includes('spc.gif') && !src.includes('ico_') && !src.includes('icon')) {
          postImgs.push({
            src: src.substring(0, 100),
            w: img.width,
            h: img.height,
            alt: (img.alt || '').substring(0, 30)
          });
        }
      });
      return {
        allCount: imgs.length,
        postImages: postImgs.slice(0, 5),
        text500: (document.body.innerText || '').substring(0, 500)
      };
    }).catch(e => ({ error: e.message.substring(0, 50) }));
    
    console.log('=== 포스트 검증 ===');
    console.log(JSON.stringify(info, null, 2));
    
    if (info.postImages && info.postImages.length > 0) {
      console.log('\n✅ 블로그 포스트에 이미지가 정상 표시됩니다!');
      console.log('   총 이미지:', info.allCount, '(UI 포함)');
      console.log('   포스트 이미지:', info.postImages.length, '개');
    } else {
      console.log('\n⚠️ 포스트 이미지 확인 불가');
    }
  } else {
    const text = await page.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');
    console.log('mainFrame not found, body:', text.substring(0, 200));
  }
  
  await page.close();
  await b.close();
}

main().catch(e => console.error(e.message));

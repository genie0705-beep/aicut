// 블로그 포스트 이미지 최종 작업
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const POSTS = [
  { 
    logNo: '224315539820', 
    title: '쇼핑몰·이커머스 운영자라면',
    image: path.join(__dirname, 'blog_img_shop.png'),
    label: '쇼핑몰'
  },
  { 
    logNo: null, // 아직 발행 안됨
    draftFile: path.join(__dirname, 'blog_draft_20260615_v2.md'),
    image: path.join(__dirname, 'blog_img_realestate.png'),
    title: '부동산 중개사·공인중개사라면 영상 마케팅을 시작해야 하는 이유',
    label: '부동산'
  }
];

async function checkPostView(page, logNo) {
  try {
    await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=' + logNo, { 
      waitUntil: 'domcontentloaded', timeout: 15000 
    });
    await page.waitForTimeout(4000);
    
    // Try mainFrame
    const frame = page.frame({ name: 'mainFrame' });
    if (frame) {
      const imgData = await frame.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return {
          count: imgs.length,
          firstFew: Array.from(imgs).slice(0, 3).map(i => ({
            src: (i.src || '').substring(0, 60),
            width: i.width,
            height: i.height
          })),
          textStart: (document.body.innerText || '').substring(0, 100)
        };
      }).catch(() => null);
      return imgData;
    }
    return null;
  } catch(e) {
    return null;
  }
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // Step 1: Check if 쇼핑몰 post has the image
  console.log('1️⃣ 쇼핑몰 포스트 이미지 확인 중...');
  const checkPage = await ctx.newPage();
  const imgStatus = await checkPostView(checkPage, POSTS[0].logNo);
  
  if (imgStatus) {
    console.log('   이미지 수:', imgStatus.count);
    console.log('   첫 이미지:', imgStatus.firstFew.length > 0 ? imgStatus.firstFew[0].src : '없음');
    
    if (imgStatus.count > 0 && !imgStatus.firstFew[0].src.includes('data:')) {
      console.log('✅ 이미 이미지가 정상 등록되어 있습니다!');
    } else {
      console.log('⚠️ 이미지 미등록 또는 data URL만 있음. 업로드 다시 시도...');
    }
  } else {
    console.log('⚠️ 포스트 확인 실패');
  }
  await checkPage.close();

  // Step 2: For 쇼핑몰 - re-edit and properly upload
  console.log('\n2️⃣ 쇼핑몰 포스트 재수정...');
  
  let editorPage = null;
  
  // Find existing editor tab
  for (const pg of ctx.pages()) {
    if (pg.url().includes('postupdate') && pg.url().includes(POSTS[0].logNo)) {
      editorPage = pg;
      break;
    }
  }

  // If no editor tab exists, navigate from PostList
  if (!editorPage) {
    for (const pg of ctx.pages()) {
      if (pg.url().includes('PostList.naver')) {
        editorPage = pg;
        await pg.bringToFront();
        await pg.waitForTimeout(1000);
        
        // Click edit button
        await pg.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          for (const a of links) {
            if (a.href && a.href.includes('suggestConvert') && a.href.includes('224315539820')) {
              a.click(); return;
            }
          }
        });
        await pg.waitForTimeout(3000);
        break;
      }
    }
  }

  if (!editorPage) {
    console.log('❌ 에디터 페이지 접근 실패');
  } else {
    await editorPage.bringToFront();
    await editorPage.waitForTimeout(2000);
    console.log('✅ 에디터 접근 완료');
    
    // Try using the photo upload button
    // Naver editor has "사진 추가" button that opens file dialog
    const uploadResult = await editorPage.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('button, a, span, div'));
      
      // Find "사진" or "사진 추가" button
      const photoBtns = allEls.filter(el => {
        const t = (el.innerText || '').trim();
        return t === '사진' || t === '사진 추가' || t === '사진추가';
      });
      
      return photoBtns.slice(0, 5).map(el => ({
        tag: el.tagName,
        text: (el.innerText || '').trim().substring(0, 20),
        rect: {
          x: Math.round(el.getBoundingClientRect().x),
          y: Math.round(el.getBoundingClientRect().y),
          w: Math.round(el.getBoundingClientRect().width),
          h: Math.round(el.getBoundingClientRect().height)
        },
        visible: el.offsetParent !== null
      }));
    });
    
    console.log('사진 버튼:', JSON.stringify(uploadResult, null, 2));
    
    // Try clicking "사진 추가" button
    const photoBtn = uploadResult.find(b => b.text.includes('사진') && b.visible);
    if (photoBtn) {
      const cx = photoBtn.rect.x + photoBtn.rect.w / 2;
      const cy = photoBtn.rect.y + photoBtn.rect.h / 2;
      console.log('🖱️ 사진 추가 클릭:', Math.round(cx), Math.round(cy));
      await editorPage.mouse.click(cx, cy);
      await editorPage.waitForTimeout(3000);
      
      // Check if file upload dialog appeared
      const afterClick = await editorPage.evaluate(() => {
        return (document.body.innerText || '').substring(0, 300);
      });
      console.log('클릭 후 내용:', afterClick.substring(0, 200));
    }
  }

  console.log('\n✅ 작업 완료');
  await b.close();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

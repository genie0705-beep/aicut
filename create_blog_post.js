const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  
  // 1. Create main image (700x700)
  const mainPage = await browser.newPage({ viewport: { width: 700, height: 700 } });
  const mainHTML = `<!DOCTYPE html><html lang="ko"><head>
  <meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{width:700px;height:700px;display:flex;flex-direction:column;justify-content:center;align-items:center;
      background:linear-gradient(135deg,#1A1A2E 0%,#2D2D4A 100%);
      font-family:'Noto Sans KR','Malgun Gothic',sans-serif;padding:60px;text-align:center;}
    .tag{background:#5C3DE8;color:#fff;font-size:14px;padding:6px 16px;border-radius:999px;margin-bottom:20px;font-weight:600;}
    h1{color:#fff;font-size:42px;font-weight:800;line-height:1.4;margin-bottom:16px;}
    .sub{color:rgba(255,255,255,.6);font-size:18px;line-height:1.6;}
    .price{color:#7C6BF0;font-size:28px;font-weight:700;margin-top:20px;}
  </style></head><body>
    <div class="tag">에이컷 블로그</div>
    <h1>월 30만 원으로 시작하는<br>영상 마케팅</h1>
    <p class="sub">소상공인·스타트업을 위한<br>현실적인 숏폼 영상 편집 가이드</p>
    <p class="price">aicut.co.kr</p>
  </body></html>`;
  await mainPage.setContent(mainHTML, { waitUntil: 'networkidle' });
  await mainPage.waitForTimeout(2000);
  await mainPage.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_images\\aicut_blog_marketing_start.png', fullPage: true });
  console.log('Main image saved (700x700)');
  await mainPage.close();
  
  // 2. Create content image (800x450)
  const contentPage = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const contentHTML = `<!DOCTYPE html><html lang="ko"><head>
  <meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{width:800px;height:450px;display:flex;flex-direction:column;justify-content:center;align-items:center;
      background:linear-gradient(135deg,#F5F6FA 0%,#EEEBFF 100%);
      font-family:'Noto Sans KR','Malgun Gothic',sans-serif;padding:50px;text-align:center;}
    .badge{background:#5C3DE8;color:#fff;font-size:12px;padding:4px 12px;border-radius:999px;margin-bottom:14px;font-weight:600;}
    h2{color:#1A1D26;font-size:32px;font-weight:700;line-height:1.4;margin-bottom:12px;}
    .desc{color:#6B7280;font-size:15px;line-height:1.7;margin-bottom:16px;}
    .cta{background:#5C3DE8;color:#fff;font-size:14px;font-weight:600;padding:8px 24px;border-radius:8px;display:inline-block;}
  </style></head><body>
    <div class="badge">숏폼 마케팅</div>
    <h2>48시간이면 숏폼 1개 완성</h2>
    <p class="desc">월 30만 원부터 시작하는 영상 편집 구독 서비스<br>원본만 보내주세요, 편집은 에이컷이 합니다</p>
    <div class="cta">aicut.co.kr →</div>
  </body></html>`;
  await contentPage.setContent(contentHTML, { waitUntil: 'networkidle' });
  await contentPage.waitForTimeout(2000);
  await contentPage.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_images\\aicut_blog_marketing_content.png', fullPage: true });
  console.log('Content image saved (800x450)');
  await contentPage.close();
  
  // 3. Update dashboard blogStore
  const ctx2 = browser.contexts()[0];
  const dashPage = ctx2.pages().find(x => x.url().includes('aicut_marketing'));
  if (dashPage) {
    await dashPage.evaluate(() => {
      var posts = blogStore.load();
      posts.unshift({
        title: '월 30만 원으로 시작하는 영상 마케팅, 우리도 가능할까?',
        status: '그림 완성',
        progress: 80,
        date: '6/24'
      });
      blogStore.save(posts);
      renderBlogDashboard();
    });
    console.log('Dashboard blogStore updated');
  }
  
  // 4. Save to drafts
  const draftContent = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_new_article.md', 'utf8');
  fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\projects\\aicut\\drafts\\2026-06-24-marketing-start-blog.md', 
    '# [신규] 월 30만 원으로 시작하는 영상 마케팅\n\n**작성일:** 2026.06.24\n**이미지:** 준비 완료 (700x700 + 800x450)\n\n' + draftContent);
  console.log('Draft saved');
  
  console.log('All done!');
})();

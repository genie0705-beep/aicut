const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  
  // 1. Main image (700x700)
  const mainPage = await browser.newPage({ viewport: { width: 700, height: 700 } });
  await mainPage.setContent(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{width:700px;height:700px;display:flex;flex-direction:column;justify-content:center;align-items:center;
      background:linear-gradient(135deg,#2D2D4A 0%,#1A1A2E 100%);
      font-family:'Noto Sans KR','Malgun Gothic',sans-serif;padding:60px;text-align:center;}
    .tag{background:#5C3DE8;color:#fff;font-size:13px;padding:5px 14px;border-radius:999px;margin-bottom:18px;font-weight:600;}
    h1{color:#fff;font-size:40px;font-weight:800;line-height:1.4;margin-bottom:14px;}
    .sub{color:rgba(255,255,255,.55);font-size:17px;line-height:1.6;max-width:500px;}
    .check{color:#7C6BF0;font-size:22px;font-weight:700;margin-top:18px;letter-spacing:-.01em;}
  </style></head><body>
    <div class="tag">에이컷 가이드</div>
    <h1>영상 편집 외주<br>처음이라면<br>물어봐야 할 5가지</h1>
    <p class="sub">외주사 계약 전 반드시 체크하세요</p>
    <p class="check">aicut.co.kr</p>
  </body></html>`, { waitUntil: 'networkidle' });
  await mainPage.waitForTimeout(2000);
  await mainPage.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_images\\aicut_blog_5questions.png', fullPage: true });
  console.log('Main image done');
  await mainPage.close();

  // 2. Content image (800x450)
  const contentPage = await browser.newPage({ viewport: { width: 800, height: 450 } });
  await contentPage.setContent(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{width:800px;height:450px;display:flex;flex-direction:column;justify-content:center;align-items:center;
      background:linear-gradient(135deg,#F5F6FA 0%,#EEEBFF 100%);
      font-family:'Noto Sans KR','Malgun Gothic',sans-serif;padding:50px;text-align:center;}
    .badge{background:#5C3DE8;color:#fff;font-size:12px;padding:4px 12px;border-radius:999px;margin-bottom:14px;font-weight:600;}
    .checklist{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:14px;}
    .item{background:#fff;border:1px solid #E8EBF0;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;color:#1A1D26;}
    h2{color:#1A1D26;font-size:28px;font-weight:700;margin-bottom:10px;}
    .desc{color:#6B7280;font-size:14px;margin-bottom:14px;}
    .cta{background:#5C3DE8;color:#fff;font-size:13px;font-weight:600;padding:7px 20px;border-radius:8px;}
  </style></head><body>
    <div class="badge">외주 가이드</div>
    <h2>계약 전 이것만 확인하세요</h2>
    <div class="checklist">
      <span class="item">스타일 이해</span>
      <span class="item">수정 범위</span>
      <span class="item">납품 일정</span>
      <span class="item">저작권</span>
      <span class="item">포트폴리오</span>
    </div>
    <p class="desc">48시간 숏폼 영상 편집 · aicut.co.kr</p>
    <div class="cta">에이컷에 문의하기 →</div>
  </body></html>`, { waitUntil: 'networkidle' });
  await contentPage.waitForTimeout(2000);
  await contentPage.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_images\\aicut_blog_5questions_content.png', fullPage: true });
  console.log('Content image done');
  await contentPage.close();

  // 3. Update dashboard blogStore
  const ctx = browser.contexts()[0];
  const dashPage = ctx.pages().find(x => x.url().includes('aicut_marketing'));
  if (dashPage) {
    await dashPage.evaluate(() => {
      var posts = blogStore.load();
      posts.unshift({
        title: '영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지',
        status: '그림 완성',
        progress: 80,
        date: '6/24'
      });
      blogStore.save(posts);
      if (typeof renderBlogDashboard === 'function') renderBlogDashboard();
    });
    console.log('Dashboard updated');
  }

  // 4. Save draft
  const draftContent = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_5questions.md', 'utf8');
  fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\projects\\aicut\\drafts\\2026-06-24-5questions-blog.md',
    '# [신규] 영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지\n\n**작성일:** 2026.06.24\n**이미지:** 준비 완료 (700x700 + 800x450)\n\n' + draftContent);
  console.log('Draft saved');
  console.log('ALL DONE');
})();

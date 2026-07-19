const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);

  const posts = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    
    // Find 최근 게시글 섹션
    const postSection = [];
    let inSection = false;
    for (const line of lines) {
      if (line.includes('제헌') || line.includes('데이트') || line.includes('서울 가족')) {
        postSection.push(line.substring(0, 100));
        inSection = true;
      } else if (inSection && (line.includes('From.') || line.includes('전체보기'))) {
        postSection.push(line.substring(0, 100));
        break;
      }
    }
    return postSection;
  });

  if (posts.length > 0) {
    console.log('✅ 저장된 글 찾음:');
    posts.forEach(p => console.log(`   ${p}`));
  } else {
    console.log('❌ 저장된 글을 못 찾았습니다');
    // 전체 첫 50줄 출력
    const preview = await page.evaluate(() => {
      return document.body.innerText.split('\n').filter(l => l.trim().length > 5).slice(0, 50);
    });
    console.log('페이지 내용:');
    preview.forEach((l, i) => {
      if (l.includes('제헌') || l.includes('데이트') || l.includes('서울') || l.includes('영상')) {
        console.log(`   [${i}] ${l.substring(0, 80)}`);
      }
    });
  }

  await page.close();
})();

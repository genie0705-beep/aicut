// 변호사·세무사·보험설계사 포스팅 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222').catch(() => null);
  if (!b) { console.log('CDP 실패'); process.exit(1); }
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  // aicut 블로그 메인에서 최신 포스팅 확인
  await p.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(3000);

  const mf = p.frame({ name: 'mainFrame' });
  if (mf) {
    // 포스팅 링크 모두 찾기
    const posts = await mf.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .filter(a => a.href && a.href.includes('logNo') && a.innerText.trim())
        .map(a => ({ title: a.innerText.trim().substring(0, 50), href: a.href }));
    }).catch(() => []);
    
    console.log('=== 최근 포스팅 ===');
    posts.forEach((post, i) => console.log(`[${i}] ${post.title} -> ${post.href.substring(0, 80)}`));

    // 변호사·세무사 관련 포스팅 찾기
    const expertPost = posts.find(p => p.title.includes('변호사') || p.title.includes('세무사') || p.title.includes('보험'));
    if (expertPost) {
      console.log(`\n→ "${expertPost.title}" 포스팅 발견`);
      
      // 해당 포스팅 열기
      await p.goto(expertPost.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(3000);

      // mainFrame에서 본문 읽기
      const pf = p.frame({ name: 'mainFrame' }) || p.frame({ url: /PostView/ });
      if (pf) {
        const bodyText = await pf.evaluate(() => {
          // 본문 영역
          const content = document.querySelector('.se-main-container, .post-content, .se-component-content, [class*="se"]');
          if (content) return content.innerText.substring(0, 2000);
          
          // 이미지 목록
          const imgs = Array.from(document.querySelectorAll('img[class*="se-image"], img[src*="postfiles"]'));
          return '본문:\n' + (document.body.innerText || '').substring(0, 2000);
        }).catch(() => '');
        console.log('\n=== 본문 ===');
        console.log(bodyText);
      }
    } else {
      console.log('\n변호사/세무사/보험 포스팅을 찾을 수 없습니다');
      console.log('포스팅 목록에서 검색:');
      const allText = await mf.evaluate(() => document.body.innerText).catch(() => '');
      const idx = allText.indexOf('변호사');
      if (idx >= 0) console.log('변호사 언급 위치:', allText.substring(Math.max(0, idx - 50), idx + 100));
    }
  }

  try { await p.close().catch(() => {}); } catch(e) {}
  try { await b.close().catch(() => {}); } catch(e) {}
})();

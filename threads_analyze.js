const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // aicut.official 프로필
  try { await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 5000));

  const url = page.url();
  const profileText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('URL:', url);
  console.log('\n=== 에이컷 Threads 프로필 ===');
  console.log(profileText.substring(0, 1500));

  // 팔로워/팔로우 숫자 파싱
  const stats = await page.evaluate(() => {
    const text = document.body.innerText;
    const followerMatch = text.match(/팔로워\s*([\d,]+|[\d.]+[만k]?)/);
    const postMatch = text.match(/게시물\s*([\d,]+)/);
    return { followers: followerMatch?.[1], posts: postMatch?.[1] };
  });
  console.log('\n=== 통계 ===');
  console.log('팔로워:', stats.followers);
  console.log('게시물:', stats.posts);

  // 최근 게시물 미리보기
  const posts = await page.evaluate(() => {
    const postEls = Array.from(document.querySelectorAll('[data-pressable-container], article, [role="article"]'));
    return postEls.slice(0, 5).map(el => el.innerText?.trim().substring(0, 150));
  });
  console.log('\n=== 최근 게시물 ===');
  posts.forEach((p, i) => { if(p) console.log(`[${i+1}] ${p}`); });

  await b.close();
})().catch(e => console.error('ERR:', e.message));

const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 오늘 업로드한 5개 포스팅 링크 (최신순)
const POST_URLS = [
  'https://www.instagram.com/aicut.official/p/DYCioE6mfXx/', // 채용vs외주vs월정액
  'https://www.instagram.com/aicut.official/p/DYCOd-ZGRqU/', // VFX
  'https://www.instagram.com/aicut.official/p/DX6c0ISGZhT/', // 소스 5가지
  'https://www.instagram.com/aicut.official/p/DXqLakbGWoC/', // 외주 실패
  'https://www.instagram.com/aicut.official/p/DXoxjhoGaGb/', // 에이컷 시작
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];

  // 프로필에서 최신 게시물 링크 다시 확인
  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(4000);

  const postLinks = await page.evaluate(() => {
    return [...new Set(Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a => a.href))];
  });
  console.log('현재 게시물 목록:');
  postLinks.forEach((url, i) => console.log(`  [${i+1}] ${url}`));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

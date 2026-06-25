const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = ['금융마케팅', '부동산마케팅', '병원마케팅', '기업브랜딩', '스타트업마케팅', '기업홍보', '마케팅대행사', '에듀테크', '이러닝', '브랜드영상', '의원마케팅', '병원홍보'];
const OUT_FILE = 'C:/Users/paul/.openclaw/workspace/threads_targets.json';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  const collected = new Set();
  const targets = [];

  for (const tag of HASHTAGS) {
    console.log(`\n[TAG] #${tag}`);
    try {
      await page.goto(`https://www.threads.com/search?q=%23${encodeURIComponent(tag)}&serp_type=tags`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);

      // 해시태그 결과 클릭
      const tagClicked = await page.evaluate((t) => {
        const links = Array.from(document.querySelectorAll('a'));
        const link = links.find(a => a.href?.includes('tag') || a.innerText?.includes(t));
        if (link) { link.click(); return link.href; }
        return null;
      }, tag);
      
      if (!tagClicked) {
        // 직접 해시태그 URL 시도
        await page.goto(`https://www.threads.com/search?q=${encodeURIComponent('#' + tag)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await sleep(3000);
      }

      // 게시물 작성자 수집
      await sleep(2000);
      const authors = await page.evaluate(() => {
        const userLinks = Array.from(document.querySelectorAll('a[href*="/@"]'));
        return [...new Set(userLinks.map(a => {
          const m = a.href.match(/threads\.com\/@([^/?#]+)/);
          return m ? m[1] : null;
        }).filter(Boolean))];
      });

      console.log(`  계정 ${authors.length}개 발견:`, authors.slice(0, 5));

      for (const username of authors) {
        if (!collected.has(username) && username !== 'aicut.official') {
          collected.add(username);
          targets.push({ username, url: `https://www.threads.com/@${username}`, tag });
          console.log(`  ✓ @${username}`);
        }
      }

      await sleep(await rand(3000, 5000));
    } catch(e) {
      console.log(`  [ERROR] ${e.message.split('\n')[0].substring(0, 60)}`);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(targets, null, 2));
  console.log(`\n✅ Threads 타겟 ${targets.length}개 수집 완료`);
  await b.close();
})().catch(e => console.error('ERR:', e.message));

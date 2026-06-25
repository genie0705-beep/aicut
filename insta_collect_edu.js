const { chromium } = require('playwright');
const fs = require('fs');

const NEW_HASHTAGS = ['이러닝', '온라인교육마케팅', '교육콘텐츠', '에듀테크', '학원마케팅', '온라인강의'];
const EXISTING = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/insta_targets.json', 'utf8'));
const EXCLUDE = new Set(['reels', 'explore', 'p', 'reel', 'stories', 'accounts', 'direct', 'aicut.official', ...EXISTING.map(t => t.username)]);
const OUT_FILE = 'C:/Users/paul/.openclaw/workspace/insta_targets.json';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];
  const newTargets = [];

  for (const tag of NEW_HASHTAGS) {
    console.log(`\n[TAG] #${tag}`);
    try {
      await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(await rand(2000, 3000));
      const posts = await page.evaluate(() => Array.from(document.querySelectorAll('a[href*="/p/"]')).slice(0, 9).map(a => a.href));
      console.log(`  게시물 ${posts.length}개`);

      for (const postUrl of posts.slice(0, 6)) {
        try {
          await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
          await sleep(await rand(1500, 2500));
          const author = await page.evaluate((excludeSet) => {
            const links = Array.from(document.querySelectorAll('a[href^="/"]'));
            for (const a of links) {
              const m = a.href.match(/instagram\.com\/([^/?#]+)\/?$/);
              if (!m) continue;
              const u = m[1];
              if (excludeSet.includes(u) || u.length < 2 || u.length > 30) continue;
              if (a.innerText?.trim() === u) return u;
            }
            for (const a of links) {
              const m = a.href.match(/instagram\.com\/([^/?#]+)\/?$/);
              if (!m) continue;
              const u = m[1];
              if (excludeSet.includes(u) || u.length < 2 || u.length > 30) continue;
              return u;
            }
            return null;
          }, [...EXCLUDE]);
          if (author && !EXCLUDE.has(author)) {
            EXCLUDE.add(author);
            newTargets.push({ username: author, url: `https://www.instagram.com/${author}/`, tag });
            console.log(`  ✓ @${author}`);
          }
        } catch(e) { console.log(`  [skip]`); }
        await sleep(await rand(1000, 2000));
      }
      await sleep(await rand(3000, 5000));
    } catch(e) { console.log(`  [ERROR]`); }
  }

  const merged = [...EXISTING, ...newTargets];
  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
  console.log(`\n✅ 교육/이러닝 ${newTargets.length}개 추가 → 총 ${merged.length}개`);
  newTargets.forEach(t => console.log(`  @${t.username} (${t.tag})`));
  await browser.close();
})().catch(e => console.error('ERR:', e.message));

const { chromium } = require('playwright');
const fs = require('fs');

// 신규 해시태그 (기존과 다른 것들)
const NEW_HASHTAGS = [
  '콘텐츠마케팅', '유튜브마케팅', '쇼핑몰마케팅', '바이럴마케팅',
  '영상마케팅', '소셜미디어마케팅', '퍼포먼스마케팅', '디지털마케팅',
  '스타트업', '이커머스', '온라인마케팅', '광고대행사'
];

const OUT_FILE = 'C:/Users/paul/.openclaw/workspace/threads_targets_new.json';
const EXISTING_FILE = 'C:/Users/paul/.openclaw/workspace/threads_targets.json';

// 기존 타겟 로드
const existing = JSON.parse(fs.readFileSync(EXISTING_FILE, 'utf8'));
const existingSet = new Set(existing.map(t => t.username));
console.log(`기존 타겟: ${existing.length}개`);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const collected = new Set(existingSet);
  const newTargets = [];

  for (const tag of NEW_HASHTAGS) {
    console.log(`\n[TAG] #${tag}`);
    try {
      try {
        await page.goto(`https://www.threads.com/search?q=%23${encodeURIComponent(tag)}&serp_type=tags`, {
          waitUntil: 'domcontentloaded', timeout: 15000
        });
      } catch(e) {}
      await sleep(3000);

      // 스크롤로 포스트 로드
      await page.evaluate(() => window.scrollTo(0, 1000));
      await sleep(1500);
      await page.evaluate(() => window.scrollTo(0, 2000));
      await sleep(1500);

      // 게시물 작성자 수집
      const authors = await page.evaluate(() => {
        const userLinks = Array.from(document.querySelectorAll('a[href*="/@"]'));
        return [...new Set(userLinks.map(a => {
          const m = a.href.match(/threads\.com\/@([^/?#]+)/);
          return m ? m[1] : null;
        }).filter(Boolean))];
      });

      let added = 0;
      for (const username of authors) {
        if (!collected.has(username) && username !== 'aicut.official') {
          collected.add(username);
          newTargets.push({ username, url: `https://www.threads.com/@${username}`, tag });
          added++;
        }
      }
      console.log(`  ${authors.length}개 발견, 신규 ${added}개 추가`);

      await sleep(rand(2000, 4000));
    } catch(e) {
      console.log(`  [ERROR] ${e.message.split('\n')[0].substring(0, 60)}`);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(newTargets, null, 2));
  console.log(`\n신규 타겟 ${newTargets.length}개 저장 완료: ${OUT_FILE}`);

  // 기존 + 신규 병합
  const merged = [...existing, ...newTargets];
  fs.writeFileSync(EXISTING_FILE, JSON.stringify(merged, null, 2));
  console.log(`전체 타겟 ${merged.length}개로 업데이트 완료`);

  await b.close();
})().catch(async e => {
  console.error('Fatal:', e.message.split('\n')[0]);
  process.exit(1);
}).finally(() => {
  setTimeout(() => process.exit(0), 2000);
});

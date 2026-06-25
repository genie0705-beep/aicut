const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = [
  '병원마케팅', '성형외과마케팅', '치과마케팅', '한의원마케팅',
  '보험마케팅', '보험설계사', '공인중개사마케팅', '변호사마케팅',
  '부동산마케팅', '부동산유튜브',
  '이커머스마케팅', '쇼핑몰마케팅', '프랜차이즈마케팅',
  '숏폼마케팅', '영상편집', '콘텐츠마케팅',
  '유튜브마케팅', '온라인강의', '1인강사', '소상공인마케팅'
];

const COLLECT_BLACKLIST = [
  'toss', 'shinhan', 'kb_', 'kookmin', 'woori', 'hana', 'nh_', 'kakaobank',
  'samsung', 'lg_', 'hyundai', 'kakao_', 'naver_', 'coupang', 'baemin',
  'gmarket', '11st', 'lotte', 'cj_', 'sk_', 'kt_', 'nongshim',
  'facebook', 'google', 'instagram', 'adlike', 'adtarget',
  'heimglobal', 'covigroup', 'topclick', 'admirror', 'beaulead'
];

function isBlacklisted(username) {
  const u = (username || '').toLowerCase();
  return COLLECT_BLACKLIST.some(b => u.includes(b));
}

const OUT_FILE = './insta_targets.json';

let existing = [];
if (fs.existsSync(OUT_FILE)) {
  existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
}
const existingSet = new Set(existing.map(t => t.username));
console.log('기존 타겟:', existing.length);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('instagram.com'));
  if (!page) page = pages[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const newTargets = [];
  const MAX_NEW = 40; // 최대 40명까지만 추가

  for (const tag of HASHTAGS) {
    if (newTargets.length >= MAX_NEW) break;
    console.log(`[#${tag}] 탐색 중..`);

    try {
      await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, {
        waitUntil: 'domcontentloaded', timeout: 10000
      });
    } catch(e) {}
    await sleep(2000);

    const postLinks = await page.evaluate(() => {
      return [...new Set(
        Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a => a.href)
      )].slice(0, 6);
    });
    console.log(`  게시물 ${postLinks.length}개 발견`);

    for (const postUrl of postLinks) {
      if (newTargets.length >= MAX_NEW) break;

      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch(e) {}
      await sleep(1500);

      const username = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/"]');
        for (const a of links) {
          const h = a.getAttribute('href');
          if (h && h.startsWith('/') && h.length > 2 && !h.includes('/p/') && !h.includes('/explore/') && !h.includes('/tag/')) {
            return h.replace('/', '').split('/')[0].split('?')[0];
          }
        }
        return '';
      });

      if (username && username.length > 0 && !isBlacklisted(username) && !existingSet.has(username)) {
        const exists = newTargets.some(t => t.username === username);
        if (!exists) {
          newTargets.push({ username, tag, collectedAt: new Date().toISOString() });
          existingSet.add(username);
          console.log(`  ➕ @${username} (${tag})`);
        }
      }

      await sleep(rand(1000, 2000));
    }
  }

  // 저장
  const all = [...existing, ...newTargets];
  fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2));
  console.log(`\n✅ 수집 완료! 기존 ${existing.length}명 + 신규 ${newTargets.length}명 = 총 ${all.length}명`);

  await b.close();
})().catch(e => {
  console.error('ERR:', e.message.split('\n')[0]);
  process.exit(1);
}).finally(() => {
  setTimeout(() => process.exit(0), 2000);
});

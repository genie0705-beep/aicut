const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = [
  '병원마케팅', '의원마케팅', '성형외과마케팅', '한의원마케팅', '치과마케팅', '피부과마케팅',
  '보험마케팅', '보험설계사', '금융마케팅', '공인중개사마케팅', '변호사마케팅', '세무사마케팅',
  '부동산마케팅', '부동산유튜브', '공인중개사',
  '이커머스마케팅', '쇼핑몰마케팅', '프랜차이즈마케팅', '스타트업마케팅',
  '이러닝', '온라인강의', '1인강사', '코칭비즈니스',
  '소상공인마케팅', '창업마케팅', '지역마케팅', '맞춤마케팅'
];

const COLLECT_BLACKLIST = [
  'toss', 'shinhan', 'kb_', 'kookmin', 'woori', 'hana', 'nh_', 'kakaobank',
  'samsung', 'lg_', 'hyundai', 'kakao_', 'naver_', 'coupang', 'baemin',
  'gmarket', '11st', 'lotte', 'cj_', 'sk_', 'kt_', 'nongshim',
  'facebook', 'google', 'instagram', 'adlike', 'adtarget', 'seoul_surgery',
  'heimglobal', 'covigroup', 'topclick', 'admirror', 'beaulead',
  'consomme', 'merci_yoni', 'seo_conomy'
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
console.log(`기존 타겟 ${existing.length}명`);

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

  for (const tag of HASHTAGS) {
    console.log(`\n[#${tag}] 탐색 중..`);

    try {
      await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
    } catch(e) {}
    await sleep(3000);

    const postLinks = await page.evaluate(() => {
      return [...new Set(
        Array.from(document.querySelectorAll('a[href*="/p/"]'))
          .map(a => a.href)
      )].slice(0, 12);
    });

    console.log(`  게시물 ${postLinks.length}개 발견`);

    for (const postUrl of postLinks.slice(0, 9)) {
      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {}
      await sleep(2000);

      const author = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/"]'));
        for (const link of links) {
          const href = link.href;
          const m = href.match(/instagram\.com\/([^/?#]+)\/?$/);
          if (m && m[1] && !['p', 'explore', 'reel', 'stories', 'aicut.official'].includes(m[1])) {
            return m[1];
          }
        }
        return null;
      });

      if (author && !existingSet.has(author) && author !== 'aicut.official' && !isBlacklisted(author)) {
        existingSet.add(author);
        newTargets.push({ username: author, url: `https://www.instagram.com/${author}/`, tag });
        console.log(`  ✓ @${author}`);
      }

      await sleep(rand(1000, 2000));
    }

    await sleep(rand(2000, 4000));
  }

  const merged = [...existing, ...newTargets];
  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
  console.log(`\n✅ 신규 ${newTargets.length}명 수집 완료. 총 ${merged.length}명 저장`);

  await b.close();
})().catch(async e => {
  console.error('Fatal:', e.message.split('\n')[0]);
  process.exit(1);
}).finally(() => {
  setTimeout(() => process.exit(0), 2000);
});

const { chromium } = require('playwright');
const fs = require('fs');

const instaEmails = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/insta_emails.json', 'utf8'));
const threadsTargets = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/threads_targets.json', 'utf8'));
const OUT_FILE = 'C:/Users/paul/.openclaw/workspace/all_emails.json';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cleanEmails(arr) {
  return [...new Set(arr.filter(e =>
    e && !e.includes('@2x') && !e.includes('@3x') &&
    !e.includes('sentry') && !e.includes('example') &&
    !e.includes('meta.com') && !e.includes('facebook.com') &&
    e.includes('@') && e.includes('.')
  ))];
}

async function extractFromUrl(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await sleep(2000);
    const text = await page.evaluate(() => document.body.innerText.substring(0, 5000)).catch(() => '');
    const html = await page.evaluate(() => document.documentElement.innerHTML.substring(0, 10000)).catch(() => '');
    const combined = text + ' ' + html;
    const found = (combined.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []);
    return cleanEmails(found);
  } catch(e) { return []; }
}

async function getThreadsProfileEmail(page, username) {
  try {
    await page.goto(`https://www.threads.com/@${username}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) { await sleep(500); }
  try {
    await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 6000 });
  } catch(e) {}
  await sleep(1000);

  return await page.evaluate(() => {
    const text = document.body.innerText;
    const emails = (text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])
      .filter(e => !e.includes('@2x') && !e.includes('meta.com') && !e.includes('facebook'));
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(h => h && !h.includes('threads.com') && !h.includes('instagram.com') &&
        !h.includes('meta.com') && !h.includes('facebook') && h.startsWith('http'))
      .slice(0, 3);
    return { emails: [...new Set(emails)], links };
  }).catch(() => ({ emails: [], links: [] }));
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];

  const results = [];

  // 1. 인스타 계정 중 외부 링크 있는데 이메일 없는 것 → 링크 재방문
  console.log('=== 1단계: 인스타 외부 링크 재수집 ===');
  const noEmailWithLinks = instaEmails.filter(r =>
    r.emails.length === 0 && r.externalLinks &&
    r.externalLinks.some(l => !l.includes('threads') && !l.includes('meta') &&
      !l.includes('facebook') && !l.includes('developers') && l.startsWith('http'))
  );
  console.log(`대상: ${noEmailWithLinks.length}개`);

  for (const r of noEmailWithLinks) {
    const goodLinks = r.externalLinks.filter(l =>
      !l.includes('threads') && !l.includes('meta') &&
      !l.includes('facebook') && !l.includes('developers') &&
      l.startsWith('http')
    );
    for (const link of goodLinks.slice(0, 2)) {
      console.log(`  @${r.username} → ${link.substring(0, 50)}`);
      const emails = await extractFromUrl(page, link);
      if (emails.length > 0) {
        console.log(`  ✅ ${emails.join(', ')}`);
        results.push({ source: 'instagram', username: r.username, tag: r.tag, email: emails[0], allEmails: emails, link });
        break;
      }
    }
    await sleep(1500);
  }

  // 2. Threads 타겟 62개 프로필 이메일 수집
  console.log('\n=== 2단계: Threads 프로필 이메일 수집 ===');
  const existingUsernames = new Set(instaEmails.map(r => r.username));

  for (let i = 0; i < threadsTargets.length; i++) {
    const t = threadsTargets[i];
    process.stdout.write(`[${i+1}/${threadsTargets.length}] @${t.username} `);

    const profileData = await getThreadsProfileEmail(page, t.username);
    let foundEmails = cleanEmails(profileData.emails);

    // 외부 링크도 방문
    if (foundEmails.length === 0 && profileData.links.length > 0) {
      for (const link of profileData.links.slice(0, 2)) {
        const le = await extractFromUrl(page, link);
        if (le.length > 0) { foundEmails = le; break; }
        await sleep(1000);
      }
    }

    if (foundEmails.length > 0) {
      console.log(`✅ ${foundEmails[0]}`);
      results.push({ source: 'threads', username: t.username, tag: t.tag, email: foundEmails[0], allEmails: foundEmails });
    } else {
      console.log(`❌`);
    }
    await sleep(1500);
  }

  // 기존 8개 + 신규 합치기
  const existing8 = instaEmails
    .filter(r => r.emails.length > 0)
    .map(r => ({ source: 'instagram', username: r.username, tag: r.tag, email: r.emails[0], allEmails: r.emails }));

  const allResults = [...existing8, ...results];
  const deduped = allResults.filter((r, i, arr) => arr.findIndex(x => x.email.toLowerCase() === r.email.toLowerCase()) === i);

  fs.writeFileSync(OUT_FILE, JSON.stringify(deduped, null, 2));
  console.log(`\n✅ 총 이메일: ${deduped.length}개 (기존 8 + 신규 ${deduped.length - 8})`);
  deduped.forEach(r => console.log(`  @${r.username} (${r.tag}): ${r.email}`));

  await browser.close();
})().catch(e => console.error('ERR:', e.message));

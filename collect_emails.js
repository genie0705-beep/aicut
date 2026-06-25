const { chromium } = require('playwright');
const fs = require('fs');

const TARGETS = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/insta_targets.json', 'utf8'));
const OUT_FILE = 'C:/Users/paul/.openclaw/workspace/insta_emails.json';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

async function getEmailFromProfile(page, username) {
  try {
    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) { await sleep(500); }
  try { await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 8000 }); } catch(e) {}
  await sleep(1000);

  return await page.evaluate(() => {
    const text = document.body.innerText;
    const emails = (text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])
      .filter(e => !e.includes('@2x') && !e.includes('@3x') && !e.includes('sentry') && !e.includes('example'));
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(h => h && !h.includes('instagram.com') && !h.includes('threads.com') && !h.includes('about.meta') && !h.includes('developers.facebook') && !h.includes('javascript') && h.startsWith('http'))
      .slice(0, 3);
    return { emails: [...new Set(emails)], links };
  }).catch(() => ({ emails: [], links: [] }));
}

async function getEmailFromLink(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await sleep(2000);
    const text = await page.evaluate(() => document.body.innerText.substring(0, 3000)).catch(() => '');
    const emails = (text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])
      .filter(e => !e.includes('@2x') && !e.includes('sentry') && !e.includes('example'));
    return [...new Set(emails)];
  } catch(e) { return []; }
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];

  // 기존 결과 로드
  let results = [];
  if (fs.existsSync(OUT_FILE)) results = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const done = new Set(results.map(r => r.username));
  const remaining = TARGETS.filter(t => !done.has(t.username));
  console.log(`남은 계정: ${remaining.length}개\n`);

  for (let i = 0; i < remaining.length; i++) {
    const t = remaining[i];
    console.log(`[${i+1}/${remaining.length}] @${t.username} (${t.tag})`);
    try {
      const profileData = await getEmailFromProfile(page, t.username);
      let foundEmails = [...profileData.emails];
      console.log(`  바이오: ${foundEmails.join(', ') || '없음'} | 링크: ${profileData.links.slice(0,2).join(', ') || '없음'}`);

      if (foundEmails.length === 0 && profileData.links.length > 0) {
        for (const link of profileData.links.slice(0, 2)) {
          const le = await getEmailFromLink(page, link);
          if (le.length > 0) { console.log(`  링크이메일: ${le.join(', ')}`); foundEmails = le; break; }
        }
      }
      foundEmails = [...new Set(foundEmails)];
      if (foundEmails.length > 0) console.log(`  ✅ ${foundEmails.join(', ')}`);
      results.push({ username: t.username, url: t.url, tag: t.tag, emails: foundEmails, links: profileData.links });
      fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
    } catch(e) {
      console.log(`  [ERR] ${e.message.split('\n')[0].substring(0,60)}`);
      results.push({ username: t.username, url: t.url, tag: t.tag, emails: [], links: [] });
    }
    await sleep(await rand(2000, 3500));
  }

  const withEmail = results.filter(r => r.emails.length > 0);
  console.log(`\n✅ 완료! 이메일 수집: ${withEmail.length}/${TARGETS.length}개`);
  withEmail.forEach(r => console.log(`  @${r.username}: ${r.emails.join(', ')}`));
  await browser.close();
})().catch(e => console.error('ERR:', e.message));

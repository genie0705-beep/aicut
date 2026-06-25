const { chromium } = require('playwright');
const fs = require('fs');

const TARGETS_FILE = './insta_targets.json';
const DONE_FILE = './insta_followed.json';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  if (!fs.existsSync(TARGETS_FILE)) {
    console.log('타겟 파일 없음. insta_collect.js 먼저 실행하세요.');
    return;
  }

  const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
  let done = { followed: [], failed: [] };
  if (fs.existsSync(DONE_FILE)) done = JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'));
  const doneSet = new Set(done.followed.map(d => d.username));

  const MAX_FOLLOW = 20; // 1회 실행 최대 팔로우 수
  const remaining = targets.filter(t => !doneSet.has(t.username));
  const toFollow = remaining.slice(0, MAX_FOLLOW);
  console.log(`팔로우 대기 ${remaining.length}명 → 이번 실행: ${toFollow.length}명 (완료: ${done.followed.length}명)`);

  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  // pages[4] 하드코딩 제거 → 인스타그램 탭 동적 탐색
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('instagram.com'));
  if (!page) page = pages[0];

  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  let successCount = 0;

  for (let i = 0; i < toFollow.length; i++) {
    const t = toFollow[i];
    process.stdout.write(`[${i+1}/${remaining.length}] @${t.username} (${t.tag}) ... `);

    try {
      try {
        await page.goto(`https://www.instagram.com/${t.username}/`, {
          waitUntil: 'domcontentloaded', timeout: 15000
        });
      } catch(e) {}
      await sleep(2000);

      // 팔로우 버튼 찾기
      const result = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const followBtn = btns.find(b => b.innerText?.trim() === '팔로우');
        if (!followBtn) {
          const followingBtn = btns.find(b =>
            b.innerText?.trim() === '팔로잉' || b.innerText?.trim() === '요청됨'
          );
          if (followingBtn) return 'already';
          return 'no_btn';
        }
        const rect = followBtn.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      });

      if (result === 'already') {
        console.log('이미 팔로우');
        done.followed.push({ username: t.username, tag: t.tag, status: 'already', time: new Date().toISOString() });
        doneSet.add(t.username);
        successCount++;
      } else if (result === 'no_btn') {
        console.log('버튼 없음');
        done.failed.push({ username: t.username, reason: 'no_btn' });
      } else {
        await page.mouse.click(result.x, result.y);
        await sleep(1500);

        // 확인
        const confirmed = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.some(b =>
            b.innerText?.trim() === '팔로잉' || b.innerText?.trim() === '요청됨'
          );
        });

        console.log(confirmed ? '✓ 팔로우 완료' : '? 미확인');
        done.followed.push({
          username: t.username, tag: t.tag,
          status: confirmed ? 'followed' : 'unconfirmed',
          time: new Date().toISOString()
        });
        doneSet.add(t.username);
        successCount++;
      }

    } catch(e) {
      console.log(`✗ ${e.message.split('\n')[0].substring(0, 50)}`);
      done.failed.push({ username: t.username, reason: e.message.substring(0, 80) });
    }

    fs.writeFileSync(DONE_FILE, JSON.stringify(done, null, 2));
    await sleep(rand(4000, 7000)); // 인스타그램 제한 방지용 랜덤 간격 유지
  }

  console.log(`\n✅ 완료! 팔로우 ${successCount}명, 실패 ${done.failed.length}명`);
  await b.close();
})().catch(async e => {
  console.error('Fatal:', e.message.split('\n')[0]);
  process.exit(1);
}).finally(() => {
  // 프로세스 강제 종료 - 좀비 방지
  setTimeout(() => process.exit(0), 2000);
});

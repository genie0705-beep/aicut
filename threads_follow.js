const { chromium } = require('playwright');
const fs = require('fs');

const TARGETS = JSON.parse(fs.readFileSync('./threads_targets.json', 'utf8'));
const DONE_FILE = './threads_followed.json';
const MAX_FOLLOW = 20; // 1회 실행 최대 팔로우 수

let done = { followed: [], failed: [] };
if (fs.existsSync(DONE_FILE)) {
  done = JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'));
}
const doneSet = new Set(done.followed.map(d => d.username));

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const remaining = TARGETS.filter(t => !doneSet.has(t.username));
  console.log(`팔로우 대상: ${remaining.length}개 (완료: ${done.followed.length}개)`);

  let successCount = 0;
  let failCount = 0;

  const toFollow = remaining.slice(0, MAX_FOLLOW);
  console.log(`이번 실행: ${toFollow.length}개 팔로우 예정`);

  for (let i = 0; i < toFollow.length; i++) {
    const t = toFollow[i];
    process.stdout.write(`[${i+1}/${toFollow.length}] @${t.username} (${t.tag}) ... `);

    try {
      try {
        await page.goto(`https://www.threads.com/@${t.username}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {
        if (!e.message.includes('ERR_ABORTED')) throw e;
      }
      await sleep(2000);

      // 팔로우 버튼 찾기
      const followResult = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const followBtn = btns.find(b => b.innerText && b.innerText.trim() === '팔로우');
        if (!followBtn) {
          const followingBtn = btns.find(b => b.innerText && b.innerText.trim() === '팔로잉');
          if (followingBtn) return 'already';
          return 'no_btn';
        }
        const rect = followBtn.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      });

      if (followResult === 'already') {
        console.log('이미 팔로우');
        done.followed.push({ username: t.username, tag: t.tag, status: 'already', time: new Date().toISOString() });
        doneSet.add(t.username);
        successCount++;
      } else if (followResult === 'no_btn') {
        console.log('버튼 없음');
        done.failed.push({ username: t.username, reason: 'no_btn' });
        failCount++;
      } else {
        // 좌표 클릭으로 팔로우
        await page.mouse.click(followResult.x, followResult.y);
        await sleep(1500);

        // 팔로우 확인
        const confirmed = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
          return btns.some(b => b.innerText && b.innerText.trim() === '팔로잉');
        });

        if (confirmed) {
          console.log('✓ 팔로우 완료');
          done.followed.push({ username: t.username, tag: t.tag, status: 'followed', time: new Date().toISOString() });
          doneSet.add(t.username);
          successCount++;
        } else {
          console.log('미확인 (팔로우 시도)');
          done.followed.push({ username: t.username, tag: t.tag, status: 'unconfirmed', time: new Date().toISOString() });
          doneSet.add(t.username);
          successCount++;
        }
      }

    } catch(e) {
      console.log(`에러: ${e.message.split('\n')[0].substring(0, 50)}`);
      done.failed.push({ username: t.username, reason: e.message.substring(0, 80) });
      failCount++;
    }

    fs.writeFileSync(DONE_FILE, JSON.stringify(done, null, 2));

    // 팔로우 간격 (3~6초 랜덤)
    const wait = rand(3000, 6000);
    await sleep(wait);
  }

  console.log(`\n완료! 팔로우 ${successCount}개, 실패 ${failCount}개`);
  await b.close();
})().catch(async e => {
  console.error('Fatal:', e.message.split('\n')[0]);
  process.exit(1);
}).finally(() => {
  setTimeout(() => process.exit(0), 2000);
});

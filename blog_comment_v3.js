/**
 * blog_comment_v3.js — 댓글 작성 (개선: noWaitAfter 사용)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'blog_comment_log.json');
const MAX_COMMENTS = 10;

const COMMENTS = [
  '잘 보고 갑니다~ 앞으로 자주 방문할게요!',
  '유용한 정보 감사합니다. 이웃 추가했어요 👍',
  '포스팅 잘 읽었습니다. 다음 글도 기대할게요!',
  '좋은 내용이네요. 도움이 많이 됐어요 :)',
  '글 잘 봤어요! 앞으로도 좋은 글 부탁드려요~',
  '알차고 유익한 정보네요. 감사합니다!',
  '덕분에 새로운 걸 알게 됐어요. 감사합니다 🙌',
  '정리도 잘 되어 있고 읽기 좋았어요!',
  '내용이 정말 좋네요. 즐겨찾기 하고 갑니다~',
  '이웃 추가하고 갑니다. 잘 부탁드려요! 😊',
];

const KEYWORDS = ['영상편집', '유튜브마케팅', '콘텐츠마케팅'];

function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return { commented: [] };
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch { return { commented: [] }; }
}

function saveLog(data) { fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2)); }

async function run() {
  const log = loadLog();
  const today = new Date().toISOString().slice(0, 10);
  const commentedToday = new Set(log.commented.filter(c => c.date === today).map(c => c.blogId));
  const results = { commented: 0, skipped: 0, failed: 0 };

  const browser = await chromium.connectOverCDP('http://localhost:9222').catch(() => null);
  if (!browser) { console.error('Chrome CDP 연결 실패.'); process.exit(1); }
  
  const page = await browser.contexts()[0].newPage();
  // Handle all dialogs automatically
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  try {
    for (const keyword of KEYWORDS) {
      if (results.commented >= MAX_COMMENTS) break;
      console.log(`\n[검색] ${keyword} (최신순)`);

      await page.goto(`https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=date&keyword=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      const posts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.list_search_post .item')).map(item => {
          const linkEl = item.querySelector('a.desc_inner');
          const authorEl = item.querySelector('.author');
          if (linkEl && linkEl.href) {
            const m = linkEl.href.match(/blog\.naver\.com\/([^/]+)/);
            return { url: linkEl.href, blogId: m ? m[1] : '' };
          }
          return null;
        }).filter(p => p && p.blogId && !['aicut', 'BlogHome', 'MyBlog'].includes(p.blogId));
      });

      for (const post of posts) {
        if (results.commented >= MAX_COMMENTS) break;
        if (commentedToday.has(post.blogId)) { results.skipped++; continue; }

        console.log(`\n[${results.commented+1}/${MAX_COMMENTS}] ${post.blogId}`);
        
        try {
          await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 15000, noWaitAfter: true }).catch(() => {});
        } catch(e) {}
        await page.waitForTimeout(4000);

        const commentText = COMMENTS[results.commented % COMMENTS.length];
        let written = false;
        
        const postFrame = page.frames().find(f => f.url().includes('PostView'));
        if (!postFrame) { console.log('  ❌ PostView frame 없음'); results.failed++; continue; }

        try {
          // 1) Click floating comment button with noWaitAfter
          const commentBtn = await postFrame.$('#btn_comment_2');
          if (commentBtn) {
            await commentBtn.click({ noWaitAfter: true }).catch(() => {});
            console.log('  댓글 버튼 클릭');
            await page.waitForTimeout(3000);
          }

          // 2) Scroll to bottom where comment section is
          await postFrame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(2000);

          // 3) Now check all frames again for a textarea or contenteditable
          for (const f of page.frames()) {
            if (written) break;
            try {
              const ta = await f.$('textarea');
              if (ta) {
                const visible = await ta.isVisible().catch(() => false);
                if (visible) {
                  await ta.click({ noWaitAfter: true }).catch(() => {});
                  await page.waitForTimeout(500);
                  await ta.fill(commentText);
                  await page.waitForTimeout(500);
                  
                  const submit = await f.$('button:has-text("등록"), .btn_register, input[value="등록"]');
                  if (submit) {
                    await submit.click({ noWaitAfter: true }).catch(() => {});
                    await page.waitForTimeout(2000);
                    log.commented.push({ blogId: post.blogId, postUrl: post.url, comment: commentText, date: today, time: new Date().toISOString() });
                    saveLog(log);
                    results.commented++;
                    written = true;
                    console.log('  ✅ 댓글 등록!');
                  }
                }
              }
            } catch(e) {}
          }

          // 4) If still not written, try direct approach in PostView
          if (!written) {
            const elInfo = await postFrame.evaluate(() => {
              const tas = document.querySelectorAll('textarea');
              const ces = document.querySelectorAll('[contenteditable]');
              return {
                textareas: Array.from(tas).map(t => ({ id: t.id, visible: t.offsetParent !== null, y: t.getBoundingClientRect().y })),
                contentEditables: Array.from(ces).map(c => ({ id: c.id, visible: c.offsetParent !== null, y: c.getBoundingClientRect().y }))
              };
            });
            
            for (const el of [...elInfo.textareas, ...elInfo.contentEditables]) {
              if (written || !el.visible || el.y <= 0) continue;
              try {
                let target;
                if (el.id) {
                  target = await postFrame.$(`#${el.id}`);
                }
                if (!target) target = await postFrame.$('textarea');
                if (!target) target = await postFrame.$('[contenteditable]');
                
                if (target) {
                  await target.click({ noWaitAfter: true }).catch(() => {});
                  await page.waitForTimeout(500);
                  await target.fill(commentText);
                  await page.waitForTimeout(500);
                  
                  const submit = await postFrame.$('button:has-text("등록"), .btn_register, input[value="등록"]');
                  if (submit) {
                    await submit.click({ noWaitAfter: true }).catch(() => {});
                    await page.waitForTimeout(2000);
                    log.commented.push({ blogId: post.blogId, postUrl: post.url, comment: commentText, date: today, time: new Date().toISOString() });
                    saveLog(log);
                    results.commented++;
                    written = true;
                    console.log('  ✅ 댓글 등록 (direct)');
                  }
                }
              } catch(e) {}
            }
          }
        } catch(e) { console.log(`  Error: ${e.message.substring(0,60)}`); }

        if (!written) {
          console.log('  ❌ 댓글 입력 실패');
          results.failed++;
        }
        await page.waitForTimeout(2000);
      }
    }
  } finally {
    await page.close().catch(() => null);
    await browser.close().catch(() => null);
  }

  console.log(`\n✅ 완료: 댓글 ${results.commented}개 / 스킵 ${results.skipped}개 / 실패 ${results.failed}개`);
}

run().catch(e => { console.error('오류:', e.message); process.exit(1); }).finally(() => process.exit(0));

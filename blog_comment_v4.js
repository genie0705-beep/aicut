/**
 * blog_comment_v4.js — 댓글 작성 (contenteditable 방식)
 * evaluate()로 클릭, contenteditable div에 입력
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
        await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(4000);

        const commentText = COMMENTS[results.commented % COMMENTS.length];
        let written = false;
        const postFrame = page.frames().find(f => f.url().includes('PostView'));
        
        if (postFrame) {
          try {
            // Step 1: Click comment button via evaluate (avoids Playwright hang)
            await postFrame.evaluate(() => {
              const btn = document.querySelector('#btn_comment_2');
              if (btn) btn.click();
            });
            console.log('  댓글 버튼 클릭');
            await page.waitForTimeout(3000);

            // Step 2: Scroll to bottom
            await postFrame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);

            // Step 3: Find contenteditable div and fill it
            const ceInfo = await postFrame.evaluate(() => {
              const results = [];
              document.querySelectorAll('[contenteditable]').forEach(el => {
                if (el.offsetParent !== null) {
                  results.push({
                    id: el.id || '',
                    className: (el.className || '').substring(0, 60),
                    y: el.getBoundingClientRect().y,
                    text: el.textContent?.trim()?.substring(0, 30) || ''
                  });
                }
              });
              return results;
            });

            console.log('  ContentEditable elements:', JSON.stringify(ceInfo));

            // Step 4: Find submit button near the contenteditable
            for (const ce of ceInfo) {
              if (written || ce.y <= 0) continue;
              
              let targetEl;
              if (ce.id) {
                targetEl = await postFrame.$(`#${ce.id}`);
              }
              if (!targetEl) {
                targetEl = await postFrame.$('[contenteditable]');
              }
              
              if (targetEl) {
                // Clear and fill
                await targetEl.click();
                await page.waitForTimeout(500);
                await targetEl.fill(commentText);
                await page.waitForTimeout(500);
                console.log(`  댓글 입력: "${commentText.substring(0, 20)}..."`);
                
                // Find submit button - most likely '등록' button
                const submit = await postFrame.$('button:has-text("등록")');
                if (submit) {
                  await submit.click();
                  await page.waitForTimeout(2000);
                  
                  log.commented.push({ blogId: post.blogId, postUrl: post.url, comment: commentText, date: today, time: new Date().toISOString() });
                  saveLog(log);
                  results.commented++;
                  written = true;
                  console.log('  ✅ 댓글 등록 성공!');
                } else {
                  console.log('  등록 버튼 없음');
                }
              }
            }
          } catch(e) {
            console.log(`  Error: ${e.message.substring(0, 80)}`);
          }
        }

        if (!written) {
          console.log('  ❌ 댓글 작성 실패');
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

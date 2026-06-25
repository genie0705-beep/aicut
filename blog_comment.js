/**
 * blog_comment.js — 블로그 이웃 최신 포스팅에 댓글 작성 (v2)
 * 블로그 검색 → 포스팅 → 댓글 작성
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

const KEYWORDS = [
  '영상편집',
  '유튜브마케팅',
  '콘텐츠마케팅',
];

function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return { commented: [] };
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return { commented: [] };
  }
}

function saveLog(data) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
}

async function run() {
  const log = loadLog();
  const today = new Date().toISOString().slice(0, 10);
  const commentedToday = new Set(log.commented.filter(c => c.date === today).map(c => c.blogId));
  const results = { commented: 0, skipped: 0, failed: 0 };

  const browser = await chromium.connectOverCDP('http://localhost:9222').catch(() => null);
  if (!browser) {
    console.error('Chrome CDP 연결 실패.');
    process.exit(1);
  }

  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));

  try {
    for (const keyword of KEYWORDS) {
      if (results.commented >= MAX_COMMENTS) break;

      console.log(`\n[검색] ${keyword}`);
      await page.goto(`https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=sim&keyword=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      // 검색 결과에서 포스팅 링크 수집
      const posts = await page.evaluate(() => {
        const items = document.querySelectorAll('.list_search_post .item');
        return Array.from(items).map(item => {
          const linkEl = item.querySelector('a.desc_inner');
          const authorEl = item.querySelector('.author');
          if (linkEl && linkEl.href) {
            const match = linkEl.href.match(/blog\.naver\.com\/([^/]+)/);
            return { url: linkEl.href, blogId: match ? match[1] : '' };
          }
          return null;
        }).filter(p => p && p.blogId && !['aicut', 'BlogHome', 'MyBlog'].includes(p.blogId));
      });

      for (const post of posts) {
        if (results.commented >= MAX_COMMENTS) break;
        if (commentedToday.has(post.blogId)) {
          results.skipped++;
          continue;
        }

        console.log(`\n[${results.commented+1}/${MAX_COMMENTS}] ${post.blogId}`);
        console.log(`  URL: ${post.url.substring(0, 80)}`);

        // 포스팅 페이지로 이동
        await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(5000);

        const commentText = COMMENTS[results.commented % COMMENTS.length];
        let written = false;

        // 댓글창 찾기 - frame 확인
        const frames = page.frames();
        for (const frame of frames) {
          if (written) break;
          const fUrl = frame.url();

          try {
            // PostView frame에서 comment button 찾기
            if (fUrl.includes('PostView')) {
              // "첫 댓글을 남겨보세요" 버튼 클릭
              const commentBtn = await frame.$('#btn_comment_2, a.btn_comment, a._floating_bottom_btn_comment');
              if (commentBtn) {
                await commentBtn.click().catch(() => {});
                console.log('  댓글 버튼 클릭');
                await page.waitForTimeout(2000);
              }

              // 댓글 textarea 찾기
              const ta = await frame.$('textarea');
              if (ta) {
                await ta.click();
                await ta.fill(commentText);
                console.log('  댓글 입력 완료');
                await page.waitForTimeout(500);

                // 등록 버튼
                const submit = await frame.$('button:has-text("등록"), .btn_register, input[value="등록"]');
                if (submit) {
                  await submit.click().catch(() => {});
                  await page.waitForTimeout(2000);
                  log.commented.push({ blogId: post.blogId, postUrl: post.url, comment: commentText, date: today, time: new Date().toISOString() });
                  saveLog(log);
                  results.commented++;
                  written = true;
                  console.log('  ✅ 댓글 등록 완료');
                }
              }
            }

            // 다른 frame 확인
            if (!written && (fUrl.includes('Comment') || fUrl.includes('comment'))) {
              const ta = await frame.$('textarea');
              if (ta) {
                await ta.click();
                await ta.fill(commentText);
                await page.waitForTimeout(500);

                const submit = await frame.$('button:has-text("등록"), .btn_register, input[value="등록"]');
                if (submit) {
                  await submit.click().catch(() => {});
                  await page.waitForTimeout(2000);
                  log.commented.push({ blogId: post.blogId, postUrl: post.url, comment: commentText, date: today, time: new Date().toISOString() });
                  saveLog(log);
                  results.commented++;
                  written = true;
                  console.log('  ✅ 댓글 등록 완료 (iframe)');
                }
              }
            }
          } catch(e) {}
        }

        if (!written) {
          // 메인 페이지에서 직접 시도
          try {
            const ta = await page.$('textarea');
            if (ta) {
              await ta.click();
              await ta.fill(commentText);
              await page.waitForTimeout(500);
              const submit = await page.$('button:has-text("등록"), .btn_register, input[value="등록"]');
              if (submit) {
                await submit.click().catch(() => {});
                await page.waitForTimeout(2000);
                log.commented.push({ blogId: post.blogId, postUrl: post.url, comment: commentText, date: today, time: new Date().toISOString() });
                saveLog(log);
                results.commented++;
                written = true;
                console.log('  ✅ 댓글 등록 완료 (main)');
              }
            }
          } catch(e) {}
        }

        if (!written) {
          console.log('  ❌ 댓글 입력창 찾기 실패');
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
  return results;
}

run().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
}).finally(() => process.exit(0));

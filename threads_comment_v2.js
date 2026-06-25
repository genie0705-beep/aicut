const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = ['영상편집', '콘텐츠마케팅', '숏폼마케팅', '브랜드영상', '병원마케팅'];

const COMMENTS = [
  '좋은 인사이트네요 👍 저장해뒀어요!',
  '공감 100%! 특히 꾸준함이 핵심인 것 같아요 😊',
  '이런 관점 신선해요 ✨',
  '맞아요, 처음 시작이 제일 어렵죠 ㅎㅎ',
  '도움 많이 됐어요! 감사합니다 🙏',
  '정말 공감되는 내용이에요!',
  '좋은 글 감사해요, 많이 배웠습니다 👏',
];

const LOG_FILE = './threads_comments_log.json';
let log = { commented: [] };
if (fs.existsSync(LOG_FILE)) log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
const doneUrls = new Set(log.commented.map(c => c.url));

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }
function getComment() { return COMMENTS[rand(0, COMMENTS.length)]; }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  let totalCommented = 0;
  const MAX_COMMENTS = 10;

  for (const tag of HASHTAGS) {
    if (totalCommented >= MAX_COMMENTS) break;
    console.log(`\n=== #${tag} ===`);

    try {
      await page.goto(`https://www.threads.com/search?q=%23${encodeURIComponent(tag)}&serp_type=tags`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
    } catch(e) {}
    await sleep(3000);

    const postLinks = await page.evaluate(() => {
      return [...new Set(Array.from(document.querySelectorAll('a[href*="/post/"]')).map(a => a.href))].slice(0, 6);
    });
    console.log(`포스팅 ${postLinks.length}개`);

    for (const postUrl of postLinks) {
      if (totalCommented >= MAX_COMMENTS) break;
      if (doneUrls.has(postUrl)) { console.log(`  스킵(기완료): ${postUrl.substring(0,50)}`); continue; }

      console.log(`\n  → ${postUrl.substring(0, 60)}`);
      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {}
      await sleep(3000);

      // 내 계정 포스팅 스킵
      const isOwn = await page.evaluate(() => document.body.innerText.includes('aicut.official'));
      if (isOwn) { console.log('  내 포스팅 - 스킵'); continue; }

      // 댓글 입력창 확인 (ariaPlaceholder로 식별)
      const editorInfo = await page.evaluate(() => {
        const editors = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        for (const el of editors) {
          const ph = el.getAttribute('aria-placeholder') || '';
          if (ph.includes('답글') || ph.includes('댓글')) {
            const rect = el.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, visible: rect.width > 0 };
          }
        }
        // 없으면 첫번째 editor
        const first = editors[0];
        if (first) {
          const rect = first.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, visible: rect.width > 0, fallback: true };
        }
        return null;
      });

      if (!editorInfo || !editorInfo.visible) { console.log('  입력창 없음 - 스킵'); continue; }

      // 입력창 클릭
      await page.mouse.click(editorInfo.x, editorInfo.y);
      await sleep(800);

      // 댓글 입력
      const comment = getComment();
      await page.keyboard.type(comment, { delay: 30 });
      await sleep(1500);

      // 입력 확인
      const len = await page.evaluate(() => {
        const editors = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        for (const el of editors) {
          if (el.innerText?.trim().length > 0) return el.innerText.trim().length;
        }
        return 0;
      });
      console.log(`  입력: ${len}자 "${comment.substring(0, 20)}..."`);
      if (len < 3) { console.log('  입력 실패 - 스킵'); continue; }

      // 게시 버튼 찾기 (입력 후 활성화됨)
      await sleep(500);
      const postCoord = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        // 게시 텍스트이고 활성화된 버튼
        const candidates = btns
          .filter(b => b.innerText?.trim() === '게시' && !b.disabled && b.getAttribute('aria-disabled') !== 'true')
          .map(b => {
            const rect = b.getBoundingClientRect();
            return { x: rect.x + rect.width/2, y: rect.y + rect.height/2, y_raw: rect.y, visible: rect.width > 0 };
          })
          .filter(b => b.visible && b.y_raw > 200);
        return candidates[candidates.length - 1] || null;
      });

      if (!postCoord) {
        console.log('  게시버튼 없음 - 스킵');
        // Esc로 취소
        await page.keyboard.press('Escape');
        continue;
      }

      // 게시 클릭
      await page.mouse.click(postCoord.x, postCoord.y);
      console.log(`  ✅ 댓글 완료!`);
      totalCommented++;

      log.commented.push({ url: postUrl, comment, tag, time: new Date().toISOString() });
      doneUrls.add(postUrl);
      fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

      await sleep(rand(8000, 13000));

    }
  }

  console.log(`\n✅ 총 ${totalCommented}개 댓글 완료`);
  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

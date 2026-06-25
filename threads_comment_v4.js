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

async function safeGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {
    // ERR_ABORTED 등 무시
  }
  await sleep(3000);
}

async function safeEval(page, fn) {
  try {
    return await page.evaluate(fn);
  } catch(e) {
    return null;
  }
}

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

    await safeGoto(page, `https://www.threads.com/search?q=%23${encodeURIComponent(tag)}&serp_type=tags`);

    const postLinks = await safeEval(page, () => {
      return [...new Set(Array.from(document.querySelectorAll('a[href*="/post/"]')).map(a => a.href))].slice(0, 6);
    }) || [];
    console.log(`포스팅 ${postLinks.length}개`);

    for (const postUrl of postLinks) {
      if (totalCommented >= MAX_COMMENTS) break;
      if (doneUrls.has(postUrl)) { console.log(`  스킵: ${postUrl.substring(0, 50)}`); continue; }

      console.log(`\n  → ${postUrl.substring(0, 60)}`);
      await safeGoto(page, postUrl);

      const isOwn = await safeEval(page, () => document.body.innerText.includes('aicut.official'));
      if (isOwn) { console.log('  내 포스팅 - 스킵'); continue; }

      // 댓글 입력창 좌표
      const editorCoord = await safeEval(page, () => {
        for (const el of document.querySelectorAll('[contenteditable="true"]')) {
          const ph = el.getAttribute('aria-placeholder') || '';
          if (ph.includes('답글') || ph.includes('댓글')) {
            const r = el.getBoundingClientRect();
            if (r.width > 0) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }
        }
        return null;
      });

      if (!editorCoord) { console.log('  입력창 없음 - 스킵'); continue; }

      await page.mouse.click(editorCoord.x, editorCoord.y);
      await sleep(800);

      const comment = getComment();
      await page.keyboard.type(comment, { delay: 30 });
      await sleep(1200);

      const len = await safeEval(page, () => {
        for (const el of document.querySelectorAll('[contenteditable="true"]')) {
          const t = el.innerText?.trim();
          if (t && t.length > 0) return t.length;
        }
        return 0;
      }) || 0;
      console.log(`  입력: ${len}자`);
      if (len < 3) { await page.keyboard.press('Escape'); continue; }

      // 제출 버튼: "답글" title SVG, y=800~1100 범위
      const btnCoord = await safeEval(page, () => {
        for (const svg of document.querySelectorAll('button svg, [role="button"] svg')) {
          const title = svg.querySelector('title');
          if (!title || title.textContent !== '답글') continue;
          const parent = svg.closest('button') || svg.closest('[role="button"]');
          if (!parent) continue;
          const r = parent.getBoundingClientRect();
          if (r.y > 800 && r.y < 1100 && r.width > 0) {
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }
        }
        return null;
      });

      if (!btnCoord) { console.log('  제출버튼 없음'); await page.keyboard.press('Escape'); continue; }

      await page.mouse.click(btnCoord.x, btnCoord.y);
      await sleep(3000);

      // 댓글이 달렸는지 확인 (입력창이 비워졌는지)
      const cleared = await safeEval(page, () => {
        for (const el of document.querySelectorAll('[contenteditable="true"]')) {
          const ph = el.getAttribute('aria-placeholder') || '';
          if (ph.includes('답글')) return el.innerText.trim().length === 0;
        }
        return true;
      });

      console.log(`  ${cleared ? '✅ 댓글 완료!' : '❓ 미확인'}: "${comment}"`);
      totalCommented++;
      log.commented.push({ url: postUrl, comment, tag, time: new Date().toISOString() });
      doneUrls.add(postUrl);
      fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

      await sleep(rand(8000, 12000));
    }
  }

  console.log(`\n✅ 총 ${totalCommented}개 댓글 완료`);
  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

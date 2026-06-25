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

async function submitReply(page) {
  // 댓글 입력 영역 근처의 "답글" title SVG 버튼 클릭 (제출 버튼)
  const result = await page.evaluate(() => {
    const svgBtns = Array.from(document.querySelectorAll('button svg, [role="button"] svg'));
    for (const svg of svgBtns) {
      const title = svg.querySelector('title');
      if (!title || title.textContent !== '답글') continue;
      const parent = svg.closest('button') || svg.closest('[role="button"]');
      if (!parent) continue;
      const rect = parent.getBoundingClientRect();
      // 입력창 근처 (y 800~1100)에 있는 것
      if (rect.y > 800 && rect.y < 1100 && rect.width > 0) {
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, y_raw: rect.y };
      }
    }
    return null;
  });

  if (!result) return false;
  await page.mouse.click(result.x, result.y);
  return true;
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
      if (doneUrls.has(postUrl)) { console.log(`  스킵(기완료): ${postUrl.substring(0, 50)}`); continue; }

      console.log(`\n  → ${postUrl.substring(0, 60)}`);
      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {}
      await sleep(3000);

      // 내 계정 포스팅 스킵
      const isOwn = await page.evaluate(() => document.body.innerText.includes('aicut.official'));
      if (isOwn) { console.log('  내 포스팅 - 스킵'); continue; }

      // 댓글 입력창 클릭 (aria-placeholder로 찾기)
      const editorCoord = await page.evaluate(() => {
        const editors = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        for (const el of editors) {
          const ph = el.getAttribute('aria-placeholder') || '';
          if (ph.includes('답글') || ph.includes('댓글')) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0) return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
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

      const len = await page.evaluate(() => {
        const editors = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        for (const el of editors) {
          if (el.innerText?.trim().length > 0) return el.innerText.trim().length;
        }
        return 0;
      });
      console.log(`  입력: ${len}자`);
      if (len < 3) { console.log('  입력 실패'); await page.keyboard.press('Escape'); continue; }

      // "답글" SVG 버튼으로 제출
      const submitted = await submitReply(page);
      if (!submitted) {
        console.log('  제출버튼 없음 - 스킵');
        await page.keyboard.press('Escape');
        continue;
      }

      console.log(`  ✅ 댓글 완료: "${comment}"`);
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

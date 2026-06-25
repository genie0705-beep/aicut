const { chromium } = require('playwright');

// 에이컷 관련 해시태그 인기 포스팅에 자연스러운 댓글
const HASHTAGS = ['영상편집', '콘텐츠마케팅', '숏폼마케팅', '브랜드영상', '병원마케팅'];

// 상황에 맞는 자연스러운 댓글 (광고성 X)
const COMMENTS = [
  '좋은 인사이트네요 👍 저장해뒀어요!',
  '공감 100% ㅎㅎ 특히 꾸준함이 핵심인 것 같아요',
  '이런 관점 신선해요 😊',
  '맞아요, 처음 시작이 제일 어렵죠 ㅎㅎ',
  '도움 많이 됐어요! 감사합니다 🙏',
  '정말 공감되는 내용이에요 ✨',
  '좋은 글 감사해요, 많이 배웠습니다!',
  '이 부분이 특히 인상적이에요 👏',
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }
function getComment() { return COMMENTS[rand(0, COMMENTS.length)]; }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  let totalCommented = 0;
  const MAX_COMMENTS = 10; // 1회 세션당 최대 댓글 수 (과도한 활동 방지)

  for (const tag of HASHTAGS) {
    if (totalCommented >= MAX_COMMENTS) break;

    console.log(`\n=== #${tag} 탐색 ===`);

    try {
      await page.goto(`https://www.threads.com/search?q=%23${encodeURIComponent(tag)}&serp_type=tags`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
    } catch(e) {}
    await sleep(3000);

    // 포스팅 링크 수집
    const postLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/post/"]'));
      return [...new Set(links.map(a => a.href))].slice(0, 5);
    });
    console.log(`포스팅 ${postLinks.length}개 발견`);

    for (const postUrl of postLinks) {
      if (totalCommented >= MAX_COMMENTS) break;

      console.log(`\n  포스팅: ${postUrl.substring(0, 60)}`);

      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {}
      await sleep(2500);

      // 내 계정 포스팅이면 스킵
      const isOwnPost = await page.evaluate(() => {
        return document.body.innerText.includes('aicut.official');
      });
      if (isOwnPost) { console.log('  내 계정 포스팅 - 스킵'); continue; }

      // 댓글 입력창 찾기
      const replyInput = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('[contenteditable="true"], [placeholder*="답글"], [placeholder*="댓글"]'));
        if (inputs.length === 0) return null;
        const el = inputs[0];
        const rect = el.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, visible: rect.width > 0 };
      });

      if (!replyInput || !replyInput.visible) {
        // 답글 버튼 클릭으로 열기 시도
        const opened = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
          const btn = btns.find(b => b.innerText && (b.innerText.includes('답글') || b.getAttribute('aria-label')?.includes('답글')));
          if (btn) { btn.click(); return true; }
          return false;
        });
        if (!opened) { console.log('  댓글창 없음 - 스킵'); continue; }
        await sleep(1500);
      } else {
        await page.mouse.click(replyInput.x, replyInput.y);
        await sleep(500);
      }

      // 댓글 입력
      const comment = getComment();
      await page.keyboard.type(comment, { delay: 30 });
      await sleep(1000);

      const inputLen = await page.evaluate(() => {
        const el = document.querySelector('[contenteditable="true"]');
        return el ? el.innerText.trim().length : 0;
      });

      if (inputLen < 3) { console.log('  입력 실패 - 스킵'); continue; }

      // 게시 버튼 좌표 찾기 (모달 내부)
      const postCoord = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const postBtns = btns
          .filter(b => b.innerText && b.innerText.trim() === '게시' && !b.disabled)
          .map(b => {
            const rect = b.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, y_raw: rect.y, visible: rect.width > 0 };
          })
          .filter(b => b.visible);
        // y가 200 이상인 버튼 (페이지 내 댓글 게시 버튼)
        return postBtns.find(b => b.y_raw > 200) || postBtns[0] || null;
      });

      if (!postCoord) { console.log('  게시버튼 없음'); continue; }

      await page.mouse.click(postCoord.x, postCoord.y);
      console.log(`  ✅ 댓글 게시: "${comment}"`);
      totalCommented++;
      await sleep(rand(8000, 12000)); // 댓글 간 간격

    }
  }

  console.log(`\n✅ 총 ${totalCommented}개 댓글 완료`);
  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

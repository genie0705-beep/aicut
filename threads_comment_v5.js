const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

const HASHTAGS = ['영상편집', '콘텐츠마케팅', '숏폼마케팅', '브랜드영상', '병원마케팅'];

const LOG_FILE = './threads_comments_log.json';
let log = { commented: [] };
if (fs.existsSync(LOG_FILE)) log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
const doneUrls = new Set(log.commented.map(c => c.url));

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

// 포스팅 본문에 맞는 자연스러운 댓글 생성 (v6 - 다양한 문맥 대응)
function generateComment(postText) {
  const t = (postText || '').toLowerCase();

  if (t.includes('납기') || t.includes('마감') || t.includes('일정') || t.includes('밀려')) {
    const opts = [
      '납기 맞추는 게 진짜 제일 힘들죠 ㅠㅠ 공감해요',
      '일정 관리 부분 잘 정리해주셨네요 👍',
      '이 부분 때문에 고민 많이 했는데 도움됩니다 🙏',
      '납품 일정 문제 저도 항상 겪는 거예요 😅',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('영상편집') || t.includes('편집') || t.includes('에디터')) {
    const opts = [
      '편집 외주 맡기다 보면 이런 부분이 항상 문제더라고요 😅',
      '영상 편집 퀄리티 진짜 중요하죠. 잘 보고 갑니다 👏',
      '에디터 찾는 게 제일 힘든데 좋은 정보 감사해요 🙏',
      '편집 관련해서 항상 고민이었는데 이런 관점 처음이에요 😊',
      '이 내용 저장해두고 참고할게요 💾',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('숏폼') || t.includes('릴스') || t.includes('쇼츠')) {
    const opts = [
      '숏폼 요즘 진짜 필수죠! 잘 보고 갑니다 🔥',
      '릴스 알고리즘 이해가 핵심인 것 같아요 📊',
      '숏폼 편집이 은근 시간이 많이 걸리더라고요 ㅎㅎ',
      '이런 팁 너무 유익해요! 저장해뒀어요 ✨',
      '숏폼 꾸준히 하는 분들 진짜 대단해요 👏',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('마케팅') || t.includes('광고') || t.includes('홍보')) {
    const opts = [
      '마케팅 인사이트 항상 감사해요! 많이 배웁니다 📚',
      '실무에서 바로 써먹을 수 있는 내용이네요 💡',
      '이 관점은 생각 못 했는데 신선해요 ✨',
      '마케터라면 꼭 알아야 할 내용이죠 👍',
      '공유해주셔서 감사해요, 팀에도 공유할게요 😊',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('비용') || t.includes('가격') || t.includes('예산') || t.includes('요금') || t.includes('월정액')) {
    const opts = [
      '비용 부분이 항상 고민인데 좋은 정보네요 💰',
      '예산 대비 효율이 중요하죠. 잘 정리해주셨어요 👍',
      '이런 비교 정보 너무 유용해요! 감사합니다 🙏',
      '건당이랑 비교하면 차이가 크네요 😮',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('병원') || t.includes('의원') || t.includes('의료') || t.includes('클리닉')) {
    const opts = [
      '병원 홍보 영상 진짜 신뢰도에 중요하더라고요 🏥',
      '의료 콘텐츠 만들기 쉽지 않은데 인사이트 감사해요 💊',
      '이런 접근 방식 참고해야겠어요 👍',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('유튜브') || t.includes('채널') || t.includes('구독')) {
    const opts = [
      '유튜브 꾸준히 운영하는 게 제일 어렵죠 😤',
      '채널 성장 파이팅이에요! 🔥',
      '유튜브 관련 이런 팁 너무 도움돼요 ✨',
      '채널 콘텐츠 퀄리티가 진짜 핵심인 것 같아요 📹',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('부동산') || t.includes('스타트업') || t.includes('창업')) {
    const opts = [
      '이 분야 인사이트 항상 도움돼요 🚀',
      '초기 단계에서 진짜 필요한 내용이네요 💡',
      '이런 경험 공유해주셔서 감사합니다 😊',
    ];
    return opts[rand(0, opts.length)];
  }
  if (t.includes('ai') || t.includes('인공지능') || t.includes('자동화')) {
    const opts = [
      'AI 활용 방법 진짜 중요해졌죠 🤖',
      'AI + 사람의 조합이 최고인 것 같아요 ✨',
      '자동화 인사이트 감사해요! 참고할게요 💡',
    ];
    return opts[rand(0, opts.length)];
  }

  const generic = [
    '좋은 정보 감사해요 😊',
    '많이 배웠습니다 👍',
    '공감 100%예요 ✨',
    '인사이트 공유 감사합니다 🙏',
    '저장해두고 참고할게요 💾',
    '이런 관점 처음이에요, 감사해요 😊',
  ];
  return generic[rand(0, generic.length)];
}

async function safeGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await sleep(3000);
}

async function safeEval(page, fn) {
  try { return await page.evaluate(fn); } catch(e) { return null; }
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

      // 포스팅 본문 읽기 (정확한 선택자 사용)
      const postText = await safeEval(page, () => {
        // 포스팅 본문: [data-pressable-container] span
        const spans = Array.from(document.querySelectorAll('[data-pressable-container] span'));
        for (const el of spans) {
          const t = el.innerText?.trim();
          if (t && t.length > 20 && !t.includes('답글 남기기')) return t;
        }
        // 폴백: dir=auto span 중 네비게이션 아닌 것
        const dirSpans = Array.from(document.querySelectorAll('[dir="auto"] span'));
        for (const el of dirSpans) {
          const t = el.innerText?.trim();
          if (t && t.length > 20 && !t.includes('새로운 스레드') && !t.includes('추천') && !t.includes('답글 남기기')) return t;
        }
        return '';
      }) || '';
      console.log(`  본문: "${postText.substring(0, 60)}..."`);

      // 본문 기반 댓글 생성
      const comment = generateComment(postText);
      console.log(`  댓글: "${comment}"`);

      // 입력창 클릭
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
      await page.keyboard.type(comment, { delay: 30 });
      await sleep(1200);

      const len = await safeEval(page, () => {
        for (const el of document.querySelectorAll('[contenteditable="true"]')) {
          const t = el.innerText?.trim();
          if (t && t.length > 0) return t.length;
        }
        return 0;
      }) || 0;

      if (len < 3) { await page.keyboard.press('Escape'); continue; }

      // 제출 버튼 (답글 SVG)
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

      console.log(`  ✅ 완료!`);
      totalCommented++;
      log.commented.push({ url: postUrl, comment, tag, postText: postText.substring(0, 80), time: new Date().toISOString() });
      doneUrls.add(postUrl);
      fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

      await sleep(rand(8000, 12000));
    }
  }

  console.log(`\n✅ 총 ${totalCommented}개 댓글 완료`);
  await b.close();
})().catch(async e => {
  console.error('Fatal:', e.message.split('\n')[0]);
  process.exit(1);
}).finally(() => {
  // 프로세스 강제 종료 — 좀비 방지
  setTimeout(() => process.exit(0), 2000);
});

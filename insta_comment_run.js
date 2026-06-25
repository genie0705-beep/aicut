const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = [
  '콘텐츠마케팅', '유튜브마케팅', '쇼핑몰마케팅', '영상편집',
  '마케팅인사이트', '숏폼마케팅', '인스타마케팅', '비즈니스마케팅',
  '스타트업마케팅', '릴스마케팅'
];

function generateComment(postText) {
  const t = (postText || '').toLowerCase();
  if (t.includes('영상편집') || t.includes('편집')) {
    return ['편집 퀄리티가 진짜 중요한 시대죠 👍',
      '영상 편집 관련 인사이트 감사해요 ✨',
      '편집 외주 고민 중이었는데 좋은 정보네요 😊'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('숏폼') || t.includes('릴스') || t.includes('쇼츠')) {
    return ['숏폼 트렌드 잘 보고 갑니다 🔥',
      '릴스 콘텐츠 요즘 진짜 핫하죠 📱',
      '숏폼 전략 인사이트 공유 감사해요 💡'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('마케팅') || t.includes('광고')) {
    return ['마케팅 인사이트 잘 배웠습니다 👍',
      '요즘 마케팅 트렌드 진짜 빠르게 변하네요 📊',
      '실무에 바로 써먹을 수 있는 내용이네요 💪'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('ai') || t.includes('AI')) {
    return ['AI 활용법 진짜 중요해졌어요 🤖',
      'AI 관련 콘텐츠 잘 보고 갑니다 ✨'][Math.floor(Math.random() * 2)];
  }
  const generic = [
    '좋은 정보 공유 감사해요 😊',
    '많이 배웠습니다 👍',
    '인사이트 감사합니다 🙏',
    '와 이거 진짜 공감되네요 ✨',
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

const LOG_FILE = './insta_comments_log.json';
let log = { commented: [] };
if (fs.existsSync(LOG_FILE)) log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
const doneUrls = new Set(log.commented.map(c => c.url));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // Find Instagram page
  const pages = ctx.pages();
  let page = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(3000);
  }
  await page.bringToFront();
  await sleep(1000);

  let totalCommented = 0;
  const MAX_COMMENTS = 8;

  for (const tag of HASHTAGS) {
    if (totalCommented >= MAX_COMMENTS) break;
    console.log(`\n=== #${tag} ===`);

    try {
      await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
    } catch(e) {}
    await sleep(4000);

    const postLinks = await page.evaluate(() => {
      return [...new Set(
        Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a => a.href)
      )].slice(0, 8);
    });
    if (postLinks.length === 0) {
      console.log('  포스팅 없음');
      continue;
    }
    console.log(`포스팅 ${postLinks.length}개`);

    for (const postUrl of postLinks) {
      if (totalCommented >= MAX_COMMENTS) break;
      if (doneUrls.has(postUrl)) { console.log(`  스킵 (이미 댓글): ${postUrl.substring(0, 50)}`); continue; }

      console.log(`\n  → ${postUrl.substring(0, 60)}`);
      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {}
      await sleep(4000);

      // 본문 확인
      const postText = await page.evaluate(() => {
        const h1Span = document.querySelector('h1 span');
        if (h1Span && h1Span.innerText?.trim().length > 10) return h1Span.innerText.trim().substring(0, 200);
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) return metaDesc.getAttribute('content')?.substring(0, 200) || '';
        const spans = Array.from(document.querySelectorAll('article span, [role="article"] span'));
        for (const el of spans) {
          const t = el.innerText?.trim();
          if (t && t.length > 30 && !t.includes('팔로우') && !t.includes('Meta') && !t.includes('Instagram'))
            return t.substring(0, 200);
        }
        return '';
      });

      if (postText) {
        console.log(`  본문: "${postText.substring(0, 60)}..."`);
      }

      const comment = generateComment(postText);
      console.log(`  댓글: "${comment}"`);

      // 입력창 찾기
      const inputCoord = await page.evaluate(() => {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        for (const el of textareas) {
          const ph = el.placeholder || '';
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (ph.includes('댓글') || ph.includes('comment') || ph.includes('Add')) {
              return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
          }
        }
        const first = document.querySelector('textarea');
        if (first) {
          const rect = first.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0)
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
        return null;
      });

      if (!inputCoord) { console.log('  입력창 없음 - 스킵'); continue; }

      // 클릭 및 입력
      await page.mouse.click(inputCoord.x, inputCoord.y);
      await sleep(1000);
      
      // Type with random delay
      for (const char of comment) {
        await page.keyboard.type(char, { delay: rand(30, 80) });
        await sleep(rand(10, 30));
      }
      await sleep(1000);

      // 게시 버튼
      const posted = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = btns.find(b => {
          const t = b.innerText?.trim();
          return t === '게시' || t === 'Post' || t === '게시하기';
        });
        if (btn && !btn.disabled) { btn.click(); return true; }
        return false;
      });

      if (!posted) {
        // 엔터로 게시 시도
        await page.keyboard.press('Enter');
      }
      await sleep(4000);

      // 확인
      const cleared = await page.evaluate(() => {
        const ta = document.querySelector('textarea');
        return ta ? ta.value.trim().length === 0 : true;
      });

      console.log(cleared ? '  ✅ 댓글 완료!' : '  ❓ 확인 필요');
      totalCommented++;
      log.commented.push({ url: postUrl, comment, tag, time: new Date().toISOString() });
      doneUrls.add(postUrl);
      fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

      // 랜덤 딜레이 - 어뷰징 방지 (8~15초)
      const delay = rand(8000, 15000);
      console.log(`  ⏳ ${Math.round(delay/1000)}초 대기...`);
      await sleep(delay);
    }
  }

  console.log(`\n✅ 총 ${totalCommented}개 댓글 완료`);
  // 업데이트: 더 많은 타겟 수집도 로깅
  console.log('📊 누적 댓글:', log.commented.length);
  
  await b.close();
})().catch(async e => {
  console.error('ERR:', e.message.split('\n')[0]);
}).finally(() => {
  setTimeout(() => process.exit(0), 2000);
});

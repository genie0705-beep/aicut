const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = [
  // 병원/의원
  '병원마케팅', '의원마케팅', '성형외과마케팅', '한의원마케팅', '치과마케팅', '피부과마케팅',
  // 전문직
  '보험마케팅', '보험설계사', '금융마케팅', '공인중개사마케팅', '변호사마케팅', '세무사마케팅',
  // 부동산
  '부동산마케팅', '부동산유튜브', '공인중개사',
  // 대량 영상/기업
  '이커머스마케팅', '쇼핑몰마케팅', '프랜차이즈마케팅', '스타트업마케팅',
  // 이러닝/강사
  '이러닝', '온라인강의', '1인강사', '코칭비즈니스',
  // 유튜버/크리에이터
  '유튜브마케팅', '유튜버', '크리에이터마케팅', '콘텐츠마케팅'
];

// 본문 키워드 분석 후 맥락 댓글 생성
function generateComment(postText) {
  const t = (postText || '').toLowerCase();

  // 납기/일정 관련
  if (t.includes('납기') || t.includes('마감') || t.includes('일정') || t.includes('업로드')) {
    const opts = [
      '납기 일정 맞추는 게 진짜 제일 힘들죠 ㅠㅠ 공감해요',
      '업로드 일정 관리가 핵심인데 잘 정리해주셨네요 👍',
      '일정 관리 부분이 특히 인상적이에요 ✨',
      '이 부분 때문에 고민 많이 했는데 도움됩니다 🙏',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 영상편집 관련
  if (t.includes('영상편집') || t.includes('편집') || t.includes('에디터')) {
    const opts = [
      '편집 외주 맡기다 보면 이런 부분이 항상 문제더라고요 😅',
      '영상 편집 퀄리티 진짜 중요하죠. 잘 보고 갑니다 👏',
      '에디터 찾는 게 제일 힘든데 좋은 정보 감사해요 🙏',
      '편집 관련해서 항상 고민이었는데 이런 관점 처음이에요 😊',
      '이 내용 저장해두고 참고할게요 💾',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 숏폼/릴스/쇼츠
  if (t.includes('숏폼') || t.includes('릴스') || t.includes('쇼츠') || t.includes('reels')) {
    const opts = [
      '숏폼 요즘 진짜 필수죠! 잘 보고 갑니다 🔥',
      '릴스 알고리즘 이해하는 게 핵심인 것 같아요 📊',
      '숏폼 편집이 은근 시간이 많이 걸리더라고요 ㅎㅎ',
      '이런 팁 너무 유익해요! 저장해뒀어요 ✨',
      '숏폼 꾸준히 하는 분들 진짜 대단해요 👏',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 마케팅 관련
  if (t.includes('마케팅') || t.includes('광고') || t.includes('홍보')) {
    const opts = [
      '마케팅 인사이트 항상 감사해요! 많이 배웁니다 📚',
      '실무에서 바로 써먹을 수 있는 내용이네요 💡',
      '이 관점은 생각 못 했는데 신선해요 ✨',
      '마케터라면 꼭 알아야 할 내용이죠 👍',
      '공유해주셔서 감사해요, 팀에도 공유할게요 😊',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 비용/가격
  if (t.includes('비용') || t.includes('가격') || t.includes('예산') || t.includes('요금')) {
    const opts = [
      '비용 부분이 항상 고민인데 좋은 정보네요 💰',
      '예산 대비 효율이 중요하죠. 잘 정리해주셨어요 👍',
      '이런 비교 정보 너무 유용해요! 감사합니다 🙏',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 병원/의료
  if (t.includes('병원') || t.includes('의원') || t.includes('의료') || t.includes('클리닉')) {
    const opts = [
      '병원 홍보 영상 진짜 신뢰도에 중요하더라고요 🏥',
      '의료 콘텐츠 만들기 쉽지 않은데 인사이트 감사해요 💊',
      '이런 접근 방식 참고해야겠어요 👍',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 유튜브/채널
  if (t.includes('유튜브') || t.includes('채널') || t.includes('구독')) {
    const opts = [
      '유튜브 꾸준히 운영하는 게 제일 어렵죠 😤',
      '채널 성장 파이팅이에요! 잘 보고 있을게요 🔥',
      '유튜브 관련 이런 팁 너무 도움돼요 ✨',
      '채널 콘텐츠 퀄리티가 진짜 핵심인 것 같아요 📹',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 부동산
  if (t.includes('부동산') || t.includes('분양') || t.includes('임대')) {
    const opts = [
      '부동산 콘텐츠 요즘 트렌드네요 🏠',
      '부동산 마케팅도 영상이 대세가 됐죠 📹',
      '좋은 정보 공유해주셔서 감사해요 🙏',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 스타트업/창업
  if (t.includes('스타트업') || t.includes('창업') || t.includes('대표')) {
    const opts = [
      '스타트업 마케팅 인사이트 항상 도움돼요 🚀',
      '초기 스타트업에 진짜 필요한 내용이네요 💡',
      '이런 경험 공유해주셔서 감사합니다 😊',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 보험/금융
  if (t.includes('보험') || t.includes('설계사') || t.includes('금융') || t.includes('재테크') || t.includes('투자')) {
    const opts = [
      '보험/금융 콘텐츠도 영상이 신뢰도를 올려주더라고요 📊',
      '금융 정보는 영상으로 보면 훨씬 이해하기 쉬운 것 같아요 👍',
      '설계사분들 유튜브 요즘 진짜 많이 보게 되더라고요 📹',
      '이런 콘텐츠 꾸준히 올리시는 게 대단해요 🙌',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // AI 관련
  if (t.includes('ai') || t.includes('인공지능') || t.includes('자동화')) {
    const opts = [
      'AI 활용 방법 진짜 중요해졌죠 🤖',
      'AI + 사람의 조합이 최고인 것 같아요 ✨',
      '자동화 인사이트 감사해요! 참고할게요 💡',
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // 기본 (짧고 자연스러운)
  const generic = [
    '좋은 정보 감사해요 😊',
    '많이 배웠습니다 👍',
    '공감 100%예요 ✨',
    '인사이트 공유 감사합니다 🙏',
    '저장해두고 참고할게요 💾',
    '이런 관점 처음이에요. 감사해요 😊',
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

const LOG_FILE = './insta_comments_log.json';
let log = { commented: [] };
if (fs.existsSync(LOG_FILE)) log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
const doneUrls = new Set(log.commented.map(c => c.url));

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];

  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  let totalCommented = 0;
  const MAX_COMMENTS = 10;

  for (const tag of HASHTAGS) {
    if (totalCommented >= MAX_COMMENTS) break;
    console.log(`\n=== #${tag} ===`);

    try {
      await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
    } catch(e) {}
    await sleep(3000);

    const postLinks = await page.evaluate(() => {
      return [...new Set(
        Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a => a.href)
      )].slice(0, 9);
    });
    console.log(`포스팅 ${postLinks.length}개`);

    for (const postUrl of postLinks) {
      if (totalCommented >= MAX_COMMENTS) break;
      if (doneUrls.has(postUrl)) { console.log(`  스킵: ${postUrl.substring(0, 50)}`); continue; }

      console.log(`\n  → ${postUrl.substring(0, 60)}`);
      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {}
      await sleep(3000);

      const isOwn = await page.evaluate(() => document.body.innerText.includes('aicut.official'));
      if (isOwn) { console.log('  내 포스팅 - 스킵'); continue; }

      // 본문 읽기 (인스타 정확한 선택자)
      const postText = await page.evaluate(() => {
        // h1 안의 span (게시물 캡션)
        const h1Span = document.querySelector('h1 span');
        if (h1Span && h1Span.innerText?.trim().length > 10) return h1Span.innerText.trim().substring(0, 200);

        // meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) return metaDesc.getAttribute('content')?.substring(0, 200) || '';

        // article 내 span들 중 긴 것
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
      } else {
        console.log(`  본문: (읽기 실패 - 기본 댓글 사용)`);
      }

      const comment = generateComment(postText);
      console.log(`  댓글: "${comment}"`);

      // 댓글 입력창
      const inputCoord = await page.evaluate(() => {
        // textarea (인스타 댓글창)
        const textareas = Array.from(document.querySelectorAll('textarea'));
        for (const el of textareas) {
          const ph = el.placeholder || '';
          if (ph.includes('댓글') || ph.includes('comment') || ph.includes('Add')) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0) return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
        }
        // placeholder 없어도 textarea면 클릭
        const first = document.querySelector('textarea');
        if (first) {
          const rect = first.getBoundingClientRect();
          if (rect.width > 0) return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
        return null;
      });

      if (!inputCoord) { console.log('  입력창 없음 - 스킵'); continue; }

      await page.mouse.click(inputCoord.x, inputCoord.y);
      await sleep(800);
      await page.keyboard.type(comment, { delay: 30 });
      await sleep(1000);

      // 게시 버튼
      const posted = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = btns.find(b => {
          const t = b.innerText?.trim();
          return t === '게시' || t === 'Post';
        });
        if (btn && !btn.disabled) { btn.click(); return true; }
        return false;
      });

      if (!posted) await page.keyboard.press('Enter');
      await sleep(3000);

      // 입력창 비워졌는지 확인
      const cleared = await page.evaluate(() => {
        const ta = document.querySelector('textarea');
        return ta ? ta.value.trim().length === 0 : true;
      });

      console.log(cleared ? '  ✅ 댓글 완료!' : '  ❓ 미확인');
      totalCommented++;
      log.commented.push({ url: postUrl, comment, tag, postText: postText.substring(0, 80), time: new Date().toISOString() });
      doneUrls.add(postUrl);
      fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

      await sleep(rand(8000, 13000));
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

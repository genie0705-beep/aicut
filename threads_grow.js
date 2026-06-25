const { chromium } = require('playwright');
const fs = require('fs');

// 에이컷 Threads 성장을 위한 콘텐츠 게시 + 타겟 팔로우
const POSTS = [
  {
    text: `영상 편집 의뢰하면 가장 많이 듣는 말 👂

"이번 달에 올리려고 했는데 편집이 밀려서..."

에이컷은 이 문제를 월정액으로 해결했어요.
전담 에디터가 매달 정해진 날짜에 납품 → 업로드 일정 절대 안 밀림 🗓️

#영상편집 #콘텐츠제작 #마케팅 #숏폼`
  },
  {
    text: `AI로 영상 만든다고요? 🤖

저희도 씁니다. 근데 AI가 다 하진 않아요.
자막 교정, 컷 감각, 브랜드 톤 맞추기 — 이건 여전히 사람이 해요.

AI + 전담 에디터 = 빠르고 퀄리티 있게
그게 에이컷 방식이에요.

#AI영상 #영상제작 #에디터 #브랜드영상`
  },
  {
    text: `"영상 하나 만드는 데 얼마예요?"

이 질문을 받을 때마다 드리는 답변:

건당보다 월정액이 훨씬 쌉니다.
월 4편, 전담팀, 정기납품 — 나눠보면 건당의 절반 이하.

약정도 없어요. 한 달만 써보고 결정하세요 🙌

#영상제작비용 #월정액 #콘텐츠마케팅 #SNS마케팅`
  },
  {
    text: `병원 마케팅에서 영상이 중요한 이유 🏥

텍스트 설명보다 영상으로 보여주면
신뢰도 3배, 문의율 2배라는 거 아시나요?

진료과 소개, 의료진 인터뷰, 시술 과정 —
이런 영상을 매달 꾸준히 올려야 효과가 나요.

에이컷은 병원·의원 영상 전문으로도 제작합니다 💊

#병원마케팅 #의원홍보 #의료영상 #브랜드영상`
  },
  {
    text: `부동산 유튜브 하려는 분들께 🏠

처음엔 다들 "주 2회 업로드!" 다짐하죠.
3개월 후엔 대부분 멈춰 있어요.

편집이 막히기 때문이에요.

에이컷 쓰시면 전담팀이 매달 고정 납품 —
업로드 일정 걱정 없이 콘텐츠에만 집중할 수 있어요.

👉 aicut.co.kr

#부동산유튜브 #부동산마케팅 #영상편집 #콘텐츠`
  }
];

const THREADS_TARGETS = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/threads_targets.json', 'utf8'));

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

async function postThread(page, text) {
  await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // 홈 피드 상단 입력창 클릭
  const inputBox = await page.$('div[aria-placeholder="새로운 소식이 있나요?"], div[contenteditable="true"]');
  if (!inputBox) return { success: false, reason: 'no_input' };

  await inputBox.click();
  await sleep(500);

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    await page.keyboard.type(lines[i], { delay: 15 });
    if (i < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
  }
  await sleep(500);

  // 게시 버튼
  const posted = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, [role="button"]'))
      .find(b => b.innerText?.trim() === '게시');
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!posted) return { success: false, reason: 'no_post_button' };
  await sleep(3000);
  return { success: true };
}

async function followOnThreads(page, username) {
  try {
    await page.goto(`https://www.threads.com/@${username}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) { await sleep(500); }
  try {
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button, [role="button"]')).some(b => b.innerText?.trim().length > 0),
      { timeout: 8000 }
    );
  } catch(e) {}
  await sleep(500);

  const state = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const followBtn = btns.find(b => b.innerText?.trim() === '팔로우');
    if (followBtn) { followBtn.click(); return 'followed'; }
    if (btns.some(b => ['팔로잉', '맞팔로우', '요청됨'].includes(b.innerText?.trim()))) return 'already';
    return 'unknown';
  });
  return state;
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  page.on('dialog', async dialog => { await dialog.dismiss().catch(() => {}); });

  // 1. 콘텐츠 5개 게시
  console.log('=== 콘텐츠 게시 시작 ===');
  let postCount = 0;
  for (const post of POSTS) {
    console.log(`\n[게시 ${postCount+1}/${POSTS.length}]`);
    console.log(post.text.substring(0, 50) + '...');
    const r = await postThread(page, post.text);
    if (r.success) {
      postCount++;
      console.log('✅ 게시 완료');
    } else {
      console.log(`❌ ${r.reason}`);
    }
    await sleep(await rand(5000, 8000)); // 게시 간 간격
  }

  // 2. 타겟 62개 팔로우
  console.log('\n=== 타겟 팔로우 시작 ===');
  let followCount = 0;
  let alreadyCount = 0;
  for (let i = 0; i < THREADS_TARGETS.length; i++) {
    const t = THREADS_TARGETS[i];
    process.stdout.write(`[${i+1}/${THREADS_TARGETS.length}] @${t.username} `);
    const state = await followOnThreads(page, t.username);
    if (state === 'followed') {
      followCount++;
      console.log('✅ 팔로우');
    } else if (state === 'already') {
      alreadyCount++;
      console.log('(이미 팔로우)');
    } else {
      console.log(`- ${state}`);
    }
    await sleep(await rand(2000, 3500)); // 팔로우 간 간격
    if (followCount > 0 && followCount % 20 === 0) {
      console.log('\n⏸️  20개 팔로우 → 1분 휴식');
      await sleep(60000);
    }
  }

  console.log(`\n✅ 완료!`);
  console.log(`  게시: ${postCount}개`);
  console.log(`  신규 팔로우: ${followCount}개 / 기존: ${alreadyCount}개`);
  await b.close();
})().catch(e => console.error('ERR:', e.message));

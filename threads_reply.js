const { chromium } = require('playwright');
const fs = require('fs');

const THREADS_TARGETS = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/threads_targets.json', 'utf8'));
const SENT_FILE = 'C:/Users/paul/.openclaw/workspace/threads_sent.json';

// Threads는 DM 없음 → 프로필 방문 후 최신 게시물에 자연스러운 답글
function getReply(tag) {
  const msgs = {
    '금융마케팅':    '영상 콘텐츠로 브랜드 차별화 정말 중요하죠 😊 저희 에이컷(AICUT)은 금융 브랜드 영상을 월정액으로 전담팀이 정기 납품하는 서비스예요. 관심 있으시면 aicut.co.kr 한번 들러봐 주세요!',
    '부동산마케팅':  '부동산 홍보 영상 정말 필요한 시대죠 👍 저희 에이컷(AICUT)은 월정액 구독으로 전담팀이 매달 고정 납품하는 영상 제작 서비스예요. aicut.co.kr에서 확인해보세요!',
    '병원마케팅':    '병원 마케팅에서 영상 콘텐츠 진짜 핵심이죠 😊 저희 에이컷(AICUT)은 병원·의원 홍보 영상을 월정액으로 전담팀이 정기 납품해드려요. aicut.co.kr 참고해보세요!',
    '기업브랜딩':    '브랜드 영상 꾸준히 올리는 게 진짜 중요하죠 👍 저희 에이컷(AICUT)은 월정액 구독으로 전담팀이 매달 고정 납품하는 기업 영상 제작 서비스예요. aicut.co.kr 한번 보세요!',
    '스타트업마케팅': '스타트업 브랜딩에서 영상 콘텐츠 빠질 수 없죠 😊 저희 에이컷(AICUT)은 월정액으로 전담팀이 고정 납품하는 영상 서비스예요. 약정 없이 월 4편부터 시작 가능해요! aicut.co.kr',
    '기업홍보':      '기업 홍보 영상 꾸준히 제작하는 게 핵심이죠 👍 저희 에이컷(AICUT)은 월정액 구독 → 전담팀 정기 납품 방식이에요. aicut.co.kr에서 확인해보세요!',
    '마케팅대행사':  '영상 제작 파트너 찾고 계시다면 저희 에이컷(AICUT)도 검토해보세요 😊 월정액으로 전담팀이 정기 납품하는 방식이라 대행사 협업에도 잘 맞아요! aicut.co.kr',
    '에듀테크':      '교육 콘텐츠 영상 정말 중요해졌죠 😊 저희 에이컷(AICUT)은 이러닝·교육 브랜드 영상을 월정액으로 전담팀이 고정 납품해드려요. aicut.co.kr 한번 봐주세요!',
    '이러닝':        '온라인 강의·교육 영상 제작 고민이시라면 😊 저희 에이컷(AICUT)은 월정액 구독으로 전담팀이 매달 고정 납품하는 영상 서비스예요. aicut.co.kr 참고해보세요!',
    '브랜드영상':    '브랜드 영상 퀄리티 정말 인상적이에요 👍 저희 에이컷(AICUT)은 월정액으로 전담팀이 정기 납품하는 영상 제작 서비스예요. 협업 관심 있으시면 aicut.co.kr 들러봐 주세요!',
    '의원마케팅':    '의원 마케팅 영상 정말 효과적이죠 😊 저희 에이컷(AICUT)은 병원·의원 홍보 영상을 월정액으로 전담팀이 매달 고정 납품해드려요. aicut.co.kr 한번 봐주세요!',
    '병원홍보':      '병원 홍보 영상 꾸준히 올리는 게 진짜 중요하죠 👍 저희 에이컷(AICUT)은 월정액 구독으로 전담팀이 정기 납품하는 영상 서비스예요. aicut.co.kr에서 확인해보세요!',
  };
  return msgs[tag] || '영상 콘텐츠 정말 중요하죠 😊 저희 에이컷(AICUT)은 월정액으로 전담팀이 매달 고정 납품하는 영상 제작 서비스예요. aicut.co.kr 한번 봐주세요!';
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

async function replyToLatestPost(page, username, replyText) {
  try {
    await page.goto(`https://www.threads.com/@${username}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) { await sleep(500); }
  await sleep(3000);

  // 최신 게시물 텍스트 확인
  const latestPost = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article, [role="article"], [data-pressable-container]'));
    return articles[0]?.innerText?.trim().substring(0, 100) || null;
  });
  if (!latestPost) return { success: false, reason: 'no_posts' };
  console.log(`  최신글: ${latestPost.substring(0, 60)}...`);

  // 답글 버튼 클릭
  const replyClicked = await page.evaluate(() => {
    // "답글" 버튼 또는 말풍선 아이콘
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b =>
      b.getAttribute('aria-label')?.includes('답글') ||
      b.getAttribute('aria-label')?.includes('Reply') ||
      b.querySelector('svg[aria-label*="답글"]') ||
      b.querySelector('svg[aria-label*="Reply"]')
    );
    if (btn) { btn.click(); return true; }

    // 첫 게시물의 댓글 아이콘 클릭 시도
    const articles = document.querySelectorAll('article, [data-pressable-container]');
    if (articles[0]) {
      const replyBtn = articles[0].querySelector('button, [role="button"]');
      if (replyBtn) { replyBtn.click(); return true; }
    }
    return false;
  });

  if (!replyClicked) return { success: false, reason: 'no_reply_btn' };
  await sleep(2000);

  // 입력창 찾기
  let inputBox = null;
  try {
    inputBox = await page.waitForSelector(
      'div[role="textbox"][contenteditable="true"], textarea[placeholder*="답글"], div[aria-placeholder*="답글"]',
      { timeout: 6000 }
    );
  } catch(e) {}
  if (!inputBox) return { success: false, reason: 'no_input' };

  await inputBox.click();
  await sleep(300);
  await page.keyboard.type(replyText, { delay: 20 });
  await sleep(500);

  // 게시 버튼
  const posted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => ['게시', 'Post', '답글'].includes(b.innerText.trim()));
    if (btn) { btn.click(); return btn.innerText.trim(); }
    return false;
  });
  if (!posted) {
    await page.keyboard.press('Enter');
  }
  await sleep(2000);
  return { success: true };
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  let sentData = { replied: [], failed: [] };
  if (fs.existsSync(SENT_FILE)) sentData = JSON.parse(fs.readFileSync(SENT_FILE, 'utf8'));
  const doneUsernames = new Set(sentData.replied.map(s => s.username));
  const remaining = THREADS_TARGETS.filter(t => !doneUsernames.has(t.username));
  console.log(`Threads 타겟 ${THREADS_TARGETS.length}개 중 ${remaining.length}개 답글 예정\n`);

  let count = 0;
  for (let i = 0; i < remaining.length; i++) {
    const t = remaining[i];
    console.log(`\n[${i+1}/${remaining.length}] @${t.username} (${t.tag})`);
    try {
      const r = await replyToLatestPost(page, t.username, getReply(t.tag));
      if (r.success) {
        count++;
        console.log(`  ✅ 답글 완료 (누적 ${count}건)`);
        sentData.replied.push({ ...t, repliedAt: new Date().toISOString() });
      } else {
        console.log(`  ⏭️  ${r.reason}`);
        sentData.failed.push({ ...t, reason: r.reason });
      }
    } catch(e) {
      const err = e.message.split('\n')[0].substring(0, 70);
      console.log(`  [ERR] ${err}`);
      sentData.failed.push({ ...t, reason: err });
      await sleep(5000);
    }
    fs.writeFileSync(SENT_FILE, JSON.stringify(sentData, null, 2));

    const lastOk = sentData.replied.slice(-1)[0]?.username === t.username;
    const delay = lastOk ? await rand(25000, 40000) : await rand(3000, 5000);
    console.log(`  ⏱️  ${Math.round(delay/1000)}초 대기`);
    await sleep(delay);

    if (count > 0 && count % 15 === 0) {
      const br = await rand(120000, 180000);
      console.log(`\n⏸️  ${count}건 완료 → ${Math.round(br/60000)}분 휴식`);
      await sleep(br);
    }
  }

  console.log(`\n✅ Threads 아웃리치 완료! 답글: ${sentData.replied.length}건, 실패: ${sentData.failed.length}건`);
  await b.close();
})().catch(e => console.error('ERR:', e.message));

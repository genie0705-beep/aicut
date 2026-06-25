const { chromium } = require('playwright');
const fs = require('fs');

const TARGETS = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/insta_targets.json', 'utf8'));
const SENT_FILE = 'C:/Users/paul/.openclaw/workspace/insta_sent.json';

function getMessage(tag) {
  const intro = {
    '금융마케팅':       '금융·핀테크 브랜드 영상이 필요하실 때',
    '부동산광고':       '부동산·건설 홍보 영상이 필요하실 때',
    '병원마케팅':       '병원·클리닉 홍보 영상이 필요하실 때',
    '기업브랜딩':       '기업 브랜드 영상이 필요하실 때',
    '브랜드영상':       '브랜드 영상 프로젝트를 진행하실 때',
    '스타트업마케팅':   '스타트업 홍보·투자 영상이 필요하실 때',
    '기업홍보':         '기업 홍보 영상이 필요하실 때',
    '마케팅대행사':     '클라이언트 영상 제작 파트너가 필요하실 때',
    '병원홍보':         '병원·의원 홍보 영상이 필요하실 때',
    '의원마케팅':       '의원·치과·한의원 마케팅 영상이 필요하실 때',
    '온라인교육마케팅': '이러닝·온라인 교육 콘텐츠 영상이 필요하실 때',
    '에듀테크':         '에듀테크·교육 브랜드 영상이 필요하실 때',
  };
  const line = intro[tag] || '브랜드 영상 콘텐츠가 필요하실 때';
  return `안녕하세요 😊 피드 보다가 연락드려요!\n\n${line} 저희 에이컷(AICUT)을 떠올려 주세요 🙏\n\n에이컷은 월정액 영상 제작 서비스로,\n전담팀이 매달 정해진 날짜에 고정 납품해 드립니다.\n\n✅ 월정액 구독 → 전담팀이 직접 정기 납품\n✅ AI 기반 제작으로 빠르고 합리적인 비용\n✅ 자막·컷편집 꼼꼼하게, NDA 기본 체결\n✅ 월 4편부터 약정 없이 시작 가능\n\n👉 https://aicut.co.kr`;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

async function sendDM(page, username, message) {
  // 프로필 방문 - 완전 로딩 대기
  try {
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle', timeout: 20000
    });
  } catch(e) {
    // networkidle 타임아웃은 무시하고 계속
    await sleep(2000);
  }

  // 버튼 목록 확인
  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
  );
  console.log(`  버튼: [${btns.join(' | ')}]`);

  const hasMsgBtn = btns.some(b => b.includes('메시지'));

  // 메시지 버튼 없고 팔로우 버튼 있으면 팔로우
  if (!hasMsgBtn && btns.includes('팔로우')) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '팔로우');
      if (btn) btn.click();
    });
    console.log(`  팔로우 후 재로딩...`);
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 });
    } catch(e) { await sleep(3000); }

    const btns2 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
    );
    console.log(`  팔로우 후 버튼: [${btns2.join(' | ')}]`);
    if (!btns2.some(b => b.includes('메시지'))) {
      return { success: false, reason: `no_msg_btn after follow [${btns2.join('|')}]` };
    }
  } else if (!hasMsgBtn) {
    return { success: false, reason: `no_msg_btn [${btns.join('|')}]` };
  }

  // 메시지 보내기 버튼 클릭
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.innerText.includes('메시지'));
    if (btn) btn.click();
  });
  console.log(`  메시지 버튼 클릭 ✓`);

  // DM 창 로딩 대기
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch(e) { await sleep(3000); }

  // 입력창 찾기 (여러 셀렉터 순차 시도)
  let msgBox = null;
  const selectors = [
    'div[role="textbox"][contenteditable="true"]',
    'p[aria-placeholder="메시지 입력..."]',
    'div[aria-placeholder="메시지 입력..."]',
    'textarea',
    'div[contenteditable="true"]',
  ];
  for (const sel of selectors) {
    try {
      msgBox = await page.waitForSelector(sel, { timeout: 4000, state: 'visible' });
      if (msgBox) { console.log(`  입력창: ${sel}`); break; }
    } catch(e) {}
  }

  if (!msgBox) {
    return { success: false, reason: 'no_msgbox @ ' + page.url().substring(25, 65) };
  }

  // 클립보드에 메시지 붙여넣기 방식으로 입력
  await msgBox.click();
  await sleep(300);

  // 줄바꿈 포함 메시지를 Shift+Enter로 입력
  const lines = message.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
      await page.keyboard.type(lines[i], { delay: 15 });
    }
    if (i < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
  }
  await sleep(500);

  // 전송
  await page.keyboard.press('Enter');
  await sleep(2000);

  // 전송 확인 (URL이 DM 스레드로 바뀌었는지)
  const finalUrl = page.url();
  console.log(`  전송 후 URL: ${finalUrl.substring(0, 60)}`);

  return { success: true };
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];

  // PC 뷰포트 복원
  await page.setViewportSize({ width: 1400, height: 900 });

  let sentData = { sent: [], failed: [] };
  if (fs.existsSync(SENT_FILE)) sentData = JSON.parse(fs.readFileSync(SENT_FILE, 'utf8'));
  const sentUsernames = new Set(sentData.sent.map(s => s.username));
  const remaining = TARGETS.filter(t => !sentUsernames.has(t.username));
  console.log(`총 ${TARGETS.length}개 중 ${remaining.length}개 대상\n`);

  let sentCount = 0;
  let skipCount = 0;

  for (let i = 0; i < remaining.length; i++) {
    const t = remaining[i];
    console.log(`\n[${i+1}/${remaining.length}] @${t.username} (${t.tag})`);
    try {
      const r = await sendDM(page, t.username, getMessage(t.tag));
      if (r.success) {
        sentCount++;
        console.log(`  ✅ DM 전송 완료 (누적 ${sentCount}건)`);
        sentData.sent.push({ ...t, sentAt: new Date().toISOString() });
      } else {
        skipCount++;
        console.log(`  ⏭️  스킵: ${r.reason}`);
        sentData.failed.push({ ...t, reason: r.reason, at: new Date().toISOString() });
      }
    } catch (e) {
      const err = e.message.split('\n')[0].substring(0, 80);
      console.log(`  [ERR] ${err}`);
      sentData.failed.push({ ...t, reason: err, at: new Date().toISOString() });
      await sleep(5000);
    }
    fs.writeFileSync(SENT_FILE, JSON.stringify(sentData, null, 2));

    // DM 성공 시 35~55초, 실패/스킵 시 3~5초
    const lastSent = sentData.sent.slice(-1)[0]?.username === t.username;
    const delay = lastSent ? await rand(35000, 55000) : await rand(3000, 5000);
    console.log(`  ⏱️  ${Math.round(delay/1000)}초 대기`);
    await sleep(delay);

    // 10건마다 3~5분 휴식
    if (sentCount > 0 && sentCount % 10 === 0 && lastSent) {
      const br = await rand(180000, 300000);
      console.log(`\n⏸️  DM ${sentCount}건 완료 → ${Math.round(br/60000)}분 휴식 (어뷰징 방지)`);
      await sleep(br);
    }
  }

  console.log(`\n✅ 완료! DM 전송: ${sentData.sent.length}건 / 스킵: ${sentData.failed.length}건`);
  await browser.close();
})().catch(e => console.error('ERR:', e.message));

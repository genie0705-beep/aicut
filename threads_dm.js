const { chromium } = require('playwright');
const fs = require('fs');

const THREADS_TARGETS = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/threads_targets.json', 'utf8'));
const SENT_FILE = 'C:/Users/paul/.openclaw/workspace/threads_sent.json';

function getMessage(tag) {
  const intro = {
    '금융마케팅':    '금융·핀테크 브랜드 영상이 필요하실 때',
    '부동산마케팅':  '부동산·건설 홍보 영상이 필요하실 때',
    '병원마케팅':    '병원·클리닉 홍보 영상이 필요하실 때',
    '기업브랜딩':    '기업 브랜드 영상이 필요하실 때',
    '스타트업마케팅': '스타트업 홍보·투자 영상이 필요하실 때',
    '기업홍보':      '기업 홍보 영상이 필요하실 때',
    '마케팅대행사':  '클라이언트 영상 제작 파트너가 필요하실 때',
    '에듀테크':      '에듀테크·교육 브랜드 영상이 필요하실 때',
    '이러닝':        '이러닝·온라인 교육 콘텐츠 영상이 필요하실 때',
    '브랜드영상':    '브랜드 영상 프로젝트를 진행하실 때',
    '의원마케팅':    '의원·치과·한의원 마케팅 영상이 필요하실 때',
    '병원홍보':      '병원·의원 홍보 영상이 필요하실 때',
  };
  const line = intro[tag] || '브랜드 영상 콘텐츠가 필요하실 때';
  return `안녕하세요 😊 스레드 보다가 연락드려요!\n\n${line} 저희 에이컷(AICUT)을 떠올려 주세요 🙏\n\n에이컷은 월정액 영상 제작 서비스로,\n전담팀이 매달 정해진 날짜에 고정 납품해 드립니다.\n\n✅ 월정액 구독 → 전담팀이 직접 정기 납품\n✅ AI 기반 제작으로 빠르고 합리적인 비용\n✅ 자막·컷편집 꼼꼼하게, NDA 기본 체결\n✅ 월 4편부터 약정 없이 시작 가능\n\n👉 https://aicut.co.kr`;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

async function sendThreadsDM(page, username, message) {
  try {
    await page.goto(`https://www.threads.com/@${username}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) { await sleep(500); }

  // 버튼 로딩 대기
  try {
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button, [role="button"]')).some(b => b.innerText.trim().length > 0),
      { timeout: 8000 }
    );
  } catch(e) {}
  await sleep(500);

  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button, [role="button"]')).map(b => b.innerText.trim()).filter(Boolean)
  );
  console.log(`  버튼: [${btns.join(' | ')}]`);

  let hasMsgBtn = btns.includes('메시지 보내기');

  // 메시지 버튼 없고 팔로우 버튼 있으면 팔로우 후 재확인
  if (!hasMsgBtn && btns.includes('팔로우')) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText.trim() === '팔로우');
      if (btn) btn.click();
    });
    console.log(`  팔로우 완료, 메시지 버튼 대기...`);
    try {
      await page.waitForFunction(
        () => Array.from(document.querySelectorAll('button, [role="button"]')).some(b => b.innerText.trim() === '메시지 보내기'),
        { timeout: 5000 }
      );
      hasMsgBtn = true;
    } catch(e) {}
    await sleep(500);
  }

  if (!hasMsgBtn) return { success: false, reason: `no_msg_btn [${btns.slice(0,5).join('|')}]` };

  // 메시지 보내기 클릭
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText.trim() === '메시지 보내기');
    if (btn) btn.click();
  });
  console.log(`  메시지 버튼 클릭`);
  await sleep(await rand(2500, 3500));

  console.log(`  URL after click: ${page.url().substring(0, 60)}`);

  // 입력창 대기
  let msgBox = null;
  try {
    msgBox = await page.waitForSelector(
      'div[role="textbox"][contenteditable="true"], p[aria-placeholder], div[aria-placeholder], textarea',
      { timeout: 8000 }
    );
  } catch(e) {}
  if (!msgBox) msgBox = await page.$('div[contenteditable="true"]').catch(() => null);
  if (!msgBox) return { success: false, reason: 'no_msgbox @ ' + page.url().substring(25, 60) };

  console.log(`  입력창 확인`);
  // 입력창 클릭 - 타임아웃 포함
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.click();
    }, 'div[role="textbox"][contenteditable="true"], p[aria-placeholder], div[aria-placeholder], textarea, div[contenteditable="true"]');
  } catch(e) {}
  await sleep(300);

  const lines = message.split('\n');
  for (let i = 0; i < lines.length; i++) {
    await page.keyboard.type(lines[i], { delay: 20 });
    if (i < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
  }
  await sleep(500);
  await page.keyboard.press('Enter');
  await sleep(2000);
  return { success: true };
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // 다이얼로그 자동 처리
  page.on('dialog', async dialog => { await dialog.dismiss().catch(() => {}); });

  let sentData = { sent: [], failed: [] };
  if (fs.existsSync(SENT_FILE)) sentData = JSON.parse(fs.readFileSync(SENT_FILE, 'utf8'));
  // 기존 replied 키도 처리
  if (sentData.replied) {
    sentData.sent = [...(sentData.sent || []), ...(sentData.replied || [])];
    delete sentData.replied;
  }
  const doneUsernames = new Set(sentData.sent.map(s => s.username));
  const remaining = THREADS_TARGETS.filter(t => !doneUsernames.has(t.username));
  console.log(`Threads 타겟 ${THREADS_TARGETS.length}개 중 ${remaining.length}개 DM 예정\n`);

  let count = 0;
  for (let i = 0; i < remaining.length; i++) {
    const t = remaining[i];
    console.log(`\n[${i+1}/${remaining.length}] @${t.username} (${t.tag})`);
    try {
      const r = await sendThreadsDM(page, t.username, getMessage(t.tag));
      if (r.success) {
        count++;
        console.log(`  ✅ DM 완료 (누적 ${count}건)`);
        sentData.sent.push({ ...t, sentAt: new Date().toISOString() });
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

    const lastOk = sentData.sent.slice(-1)[0]?.username === t.username;
    const delay = lastOk ? await rand(30000, 50000) : await rand(3000, 5000);
    console.log(`  ⏱️  ${Math.round(delay/1000)}초 대기`);
    await sleep(delay);

    if (count > 0 && count % 10 === 0) {
      const br = await rand(150000, 240000);
      console.log(`\n⏸️  ${count}건 완료 → ${Math.round(br/60000)}분 휴식`);
      await sleep(br);
    }
  }

  console.log(`\n✅ Threads DM 완료! 전송: ${sentData.sent.length}건, 실패: ${sentData.failed.length}건`);
  await b.close();
})().catch(e => console.error('ERR:', e.message));

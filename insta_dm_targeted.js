/**
 * insta_dm_targeted.js — 업종별 타겟 DM 자동화
 * 보험/금융/부동산/병원 계정에 맞춤 메시지 발송
 * 
 * 타겟 선정: 팔로우한 계정 중 업종 키워드 포함 계정
 * DM 내용: 자연스러운 비즈니스 제안
 */

const { chromium } = require('playwright');
const fs = require('fs');

const DONE_FILE = './insta_sent.json';
const TARGETS_FILE = './insta_targets.json';
const MAX_DM = 5; // 하루 최대 DM 수 (인스타 계정 보호)
const MAX_TRY = 30; // 성공할 때까지 시도할 최대 타겟 수

// DM 차단된 대기업/공식 계정 블랙리스트
const CORPORATE_BLACKLIST = [
  'toss', 'toss.im', 'shinhan', 'shinhanbank', 'kb', 'kookmin', 'woori', 'hana',
  'nhbank', 'kakaobank', 'samsung', 'lg', 'hyundai', 'kakao', 'naver', 'coupang',
  'baemin', 'gmarket', 'auction', '11st', 'lotte', 'cj', 'sk', 'kt', 'nongshim',
  '한국은행', '금융감독원', '보험개발원', 'facebook', 'google', 'instagram',
  'adlike_official', 'adtarget', 'seoul_surgery', 'heimglobal', 'covigroup'
];

function isBlacklisted(username) {
  const u = (username || '').toLowerCase();
  return CORPORATE_BLACKLIST.some(b => u.includes(b));
}

let sent = { sent: [] };
if (fs.existsSync(DONE_FILE)) {
  try { sent = JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')); } catch(e) {}
}
const sentSet = new Set(sent.sent.map(s => s.username));

// 업종별 DM 메시지
function getDMMessage(username, tag) {
  const t = (tag || '').toLowerCase();

  // === 업종별 DM 메시지 (v2 - 직접 제안형) ===

  if (t.includes('보험') || t.includes('설계사') || t.includes('금융')) {
    return `안녕하세요! 저희는 보험/금융 전문 영상 편집 파트너입니다.

신뢰도가 중요한 업종이라 영상 퀄리티가 곧 브랜드 가치죠.
저희는 월 정기 20편 이상 대량 납품 + D+1 납기가 기본입니다.

무료 견적 3분이면 받아보실 수 있어요.
→ aicut.co.kr`;
  }

  if (t.includes('부동산') || t.includes('중개') || t.includes('분양')) {
    return `안녕하세요! 저희는 부동산 매물 숏폼 전문 편집 업체입니다.

매물 영상 20~30편/월 정기 납품, 편당 D+1 납기 완료.
실제 고객사 매물 클릭률 41% 상승 사례 있습니다.

무료 견적 3분이면 확인하세요.
→ aicut.co.kr`;
  }

  if (t.includes('병원') || t.includes('의원') || t.includes('클리닉') || t.includes('성형') || t.includes('치과') || t.includes('한의')) {
    return `안녕하세요! 저희는 병원/의료 영상 편집 전문 파트너입니다.

원장님 릴스, 시술 숏폼, 의료법 준수 편집까지 가능합니다.
월 정기 20편부터 전담 에디터 배정, D+1 납기.

무료 견적 3분이면 받아보세요.
→ aicut.co.kr`;
  }

  // 일반 마케팅/영상
  return `안녕하세요! 저희는 영상 편집 아웃소싱 전문 업체입니다.

숏폼/릴스/유튜브 월 정기 대량 편집, D+1 납기.
전담 에디터 고정 배정, 따로 설명할 필요 없습니다.

무료 견적 3분이면 확인 가능합니다.
→ aicut.co.kr`;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  // 타겟 로드 (업종 관련 계정 우선)
  if (!fs.existsSync(TARGETS_FILE)) {
    console.log('타겟 파일 없음. insta_collect.js 먼저 실행하세요.');
    process.exit(0);
  }

  const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
  
  // 업종 타겟 필터링 (보험/금융/부동산/병원 키워드)
  const PRIORITY_TAGS = ['보험마케팅', '보험설계사', '금융마케팅', '재테크유튜브',
    '부동산마케팅', '공인중개사', '부동산유튜브',
    '병원마케팅', '의원마케팅', '성형외과마케팅', '한의원마케팅', '치과마케팅'];
  
  const priorityTargets = targets.filter(t => PRIORITY_TAGS.includes(t.tag) && !sentSet.has(t.username));
  const generalTargets = targets.filter(t => !PRIORITY_TAGS.includes(t.tag) && !sentSet.has(t.username));
  
  // 블랙리스트 제외 + 이미 보낸 제외
  const filterTargets = arr => arr.filter(t => !sentSet.has(t.username) && !isBlacklisted(t.username));
  
  const filteredPriority = filterTargets(priorityTargets);
  const filteredGeneral = filterTargets(generalTargets);
  
  // 충분한 타겟 확보 (MAX_TRY개까지 시도해서 MAX_DM개 성공 목표)
  const toSend = [...filteredPriority, ...filteredGeneral].slice(0, MAX_TRY);
  console.log(`DM 대상: ${toSend.length}명 (블랙리스트 제외 후, 최대 ${MAX_DM}개 전송 목표)`);
  
  if (toSend.length === 0) {
    console.log('보낼 DM 대상 없음');
    process.exit(0);
  }

  if (toSend.length === 0) {
    console.log('보낼 DM 대상 없음');
    process.exit(0);
  }

  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('instagram.com'));
  if (!page) page = pages[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  let successCount = 0;
  let tryCount = 0;

  for (const target of toSend) {
    if (successCount >= MAX_DM) break; // 목표 달성 시 중단
    tryCount++;
    
    const { username, tag } = target;
    const message = getDMMessage(username, tag);

    console.log(`\n[${tryCount}/${toSend.length}] @${username} (${tag})`);

    try {
      // 프로필 이동
      try {
        await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch(e) {}
      await sleep(2000);

      // 메시지 버튼 찾기
      const msgBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText?.trim() === '메시지');
        if (btn) { btn.click(); return true; }
        return false;
      });

      if (!msgBtn) {
        console.log('  메시지 버튼 없음');
        continue;
      }

      await sleep(2500);

      // DM 입력창 찾기
      const inputEl = await page.$('[contenteditable="true"], textarea[placeholder*="메시지"]');
      if (!inputEl) {
        console.log('  DM 입력창 없음');
        continue;
      }

      await inputEl.click();
      await sleep(300);
      await inputEl.type(message, { delay: 15 });
      await sleep(500);

      // 전송 버튼
      const sendBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = btns.find(b => b.innerText?.trim() === '보내기' || b.getAttribute('aria-label')?.includes('보내기'));
        if (btn) { btn.click(); return true; }
        return false;
      });

      if (sendBtn) {
        console.log('  ✅ DM 전송 완료');
        sent.sent.push({ username, tag, time: new Date().toISOString() });
        sentSet.add(username);
        successCount++;
        fs.writeFileSync(DONE_FILE, JSON.stringify(sent, null, 2));
      } else {
        // Enter 키로 전송
        await page.keyboard.press('Enter');
        await sleep(1000);
        console.log('  ✅ DM 전송 (Enter)');
        sent.sent.push({ username, tag, time: new Date().toISOString() });
        sentSet.add(username);
        successCount++;
        fs.writeFileSync(DONE_FILE, JSON.stringify(sent, null, 2));
      }

    } catch(e) {
      console.log(`  ✗ 오류: ${e.message.substring(0, 50)}`);
    }

    await sleep(rand(8000, 15000)); // DM 간격 8~15초 (제한 방지)
  }

  console.log(`\n✅ 완료: DM ${successCount}/${toSend.length}개 전송`);
  await b.close();
})().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
}).finally(() => setTimeout(() => process.exit(0), 2000));

const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CAPTIONS = [
  `피부과 실장님, 직원분들 모두 OK 🙌

😅 "촬영도 어색하고 편집도 모르겠고..."
→ 촬영 가이드 한 장이면 5분 OK

✂️ "편집은 누가 하죠?"
→ 찍기만 하세요. 자막·BGM·색보정 다 해드려요

💡 실제 사례: 하루 5분 촬영으로 월 20편!

👉 프로필 링크에서 블로그 글 확인

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #촬영가이드 #서울`,

  `✂️ 편집 걱정은 그만!

"편집은 누가 하죠?"
걱정 마세요. 찍기만 하면 됩니다.

찍은 영상 원본만 보내주시면
전문가가 자막부터 BGM, 색보정까지 다 해드립니다.

릴스, 쇼츠, 틱톡까지 채널별 최적화 납품!

👉 프로필 링크에서 자세히 보기

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #영상편집 #서울`,

  `💡 실제 사례: 하루 5분으로 월 20편!

서울 강남某 피부과의 실제 이야기입니다.

도입 전: "릴스 해야 하는데 누가 찍지?"
도입 후: 직원들이 5분 촬영, 에이컷이 편집

👉 프로필 링크에서 블로그 글 확인

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #사례 #서울`
];

async function editPost(ig, postIndex, caption) {
  // 프로필로 이동
  await ig.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);

  // n번째 게시물 클릭
  const clicked = await ig.evaluate((idx) => {
    const links = document.querySelectorAll('a[href*="/p/"]');
    if (links[idx]) { links[idx].click(); return true; }
    return false;
  }, postIndex);
  if (!clicked) { console.log('  게시물 못찾음'); return false; }
  await sleep(3000);

  // ⋮ 더보기
  await ig.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const aria = svg.getAttribute('aria-label') || '';
      if (aria.includes('더 보기') || aria.includes('more')) {
        svg.closest('[role="button"], button')?.click();
        return;
      }
    }
  });
  await sleep(2000);

  // 수정
  await ig.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, [role="button"], span, div')).find(e => e.innerText?.trim() === '수정' || e.innerText?.trim() === 'Edit');
    if (el) el.click();
  });
  await sleep(3000);

  // 캡션 입력
  const cap = await ig.$('textarea');
  if (cap) {
    await cap.click({ force: true });
    await sleep(300);
    await ig.keyboard.press('Control+a');
    await sleep(300);
    await ig.keyboard.press('Backspace');
    await sleep(500);
    await ig.keyboard.type(caption, { delay: 8 });
    console.log('  캡션 입력 OK');
  } else {
    console.log('  textarea 없음');
  }
  await sleep(1500);

  // 완료
  await ig.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, [role="button"]')).find(e => e.innerText?.trim() === '완료' || e.innerText?.trim() === 'Done');
    if (el) { el.click(); return; }
    // 체크 아이콘 찾기
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const aria = svg.getAttribute('aria-label') || '';
      if (aria.includes('확인') || aria.includes('check') || aria.includes('done')) {
        svg.closest('[role="button"], button')?.click();
        return;
      }
    }
  });
  await sleep(3000);
  return true;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ig = b.contexts()[0].pages().find(p => p.url().includes('instagram.com') && !p.url().includes('accounts'));
  if (!ig) { console.log('인스타 없음'); await b.close(); return; }

  // 3개 게시물 수정 (0=첫번째, 1=두번째, 2=세번째)
  for (let i = 0; i < CAPTIONS.length; i++) {
    console.log(`\n[${i+1}/3] 게시물 ${i+1}번 수정 중...`);
    const ok = await editPost(ig, i, CAPTIONS[i]);
    console.log(`  결과: ${ok ? '✅' : '❌'}`);
  }

  await b.close();
  console.log('\n✅ 3개 게시물 캡션 수정 완료!');
}
main().catch(e => console.error('❌ 에러:', e.message));

const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function uploadSingle(page, imagePath, caption) {
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);

  // + 버튼
  const created = await page.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        const btn = svg.closest('a') || svg.closest('button') || svg.closest('[role="button"]');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  if (!created) { console.log('  + 버튼 없음'); return false; }
  await sleep(2000);

  // 게시물 선택
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, [role="button"], a, span')).find(e => e.innerText?.trim() === '게시물' || e.innerText?.trim() === 'Post');
    if (el) el.click();
  });
  await sleep(2000);

  // 파일 업로드
  const fi = await page.$('input[type="file"]');
  if (!fi) { console.log('  파일입력 없음'); return false; }
  await fi.setInputFiles(imagePath);
  console.log('  파일 업로드 OK');
  await sleep(3000);

  // 다음 버튼들
  for (let s = 0; s < 3; s++) {
    const n = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '다음' || b.innerText?.trim() === 'Next');
      if (b) { b.click(); return true; }
      return false;
    });
    if (n) { console.log('  다음 ' + (s+1) + '/3'); await sleep(2500); }
    else break;
  }

  // 캡션
  const cap = await page.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea');
  if (cap) {
    await cap.click({ force: true });
    await sleep(500);
    await page.keyboard.type(caption, { delay: 10 });
    console.log('  캡션 입력 OK');
  } else {
    console.log('  캡션창 없음 — 계속 진행');
  }
  await sleep(1500);

  // 공유
  const shared = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '공유' || b.innerText?.trim() === 'Share');
    if (b) { b.click(); return true; }
    return false;
  });
  console.log('  공유:', shared);
  await sleep(5000);
  return true;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ig = b.contexts()[0].pages().find(p => p.url().includes('instagram.com') && !p.url().includes('accounts'));
  if (!ig) { console.log('인스타 없음'); await b.close(); return; }

  const cards = [
    { file: 'insta_card1.png', caption: `피부과 실장님, 직원분들 모두 OK 🙌

😅 "촬영도 어색하고 편집도 모르겠고..."
→ 촬영 가이드 한 장이면 5분 OK

✂️ "편집은 누가 하죠?"
→ 찍기만 하세요. 자막·BGM·색보정 다 해드려요

💡 실제 사례: 하루 5분 촬영으로 월 20편!
→ 직원들이 돌아가며 촬영, 편집은 에이컷

👉 프로필 링크에서 블로그 글 확인

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #촬영가이드 #서울` },
    { file: 'insta_card2.png', caption: `✂️ 편집 걱정은 그만!

"촬영은 어떻게 해결했는데... 편집은 누가 하죠?"

걱정 마세요. 편집은 하지 마세요. 그냥 맡기세요.

찍은 영상 원본만 보내주시면
전문가가 자막부터 BGM, 색보정까지 다 해드립니다.

릴스, 쇼츠, 틱톡까지 채널별로 최적화해서 납품!

👉 프로필 링크에서 자세히 보기

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #영상편집 #서울` },
    { file: 'insta_card3.png', caption: `💡 실제 사례: 하루 5분으로 월 20편!

서울 강남某 피부과의 실제 이야기입니다.

도입 전: "릴스 해야 하는데 누가 찍지? 누가 편집하지?"
도입 후: 직원들이 번갈아 5분 촬영, 에이컷이 편집

결과: 월 20편 정기 납품!
원장님도 직원들도 부담 없습니다 😊

👉 프로필 링크에서 블로그 글 확인

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #사례 #서울` }
  ];

  for (let i = 0; i < cards.length; i++) {
    console.log(`\n📤 [${i+1}/3] ${cards[i].file}`);
    const ok = await uploadSingle(ig, path.join(WS, cards[i].file), cards[i].caption);
    console.log(`  결과: ${ok ? '✅' : '❌'}`);
    if (i < cards.length - 1) await sleep(3000);
  }

  await b.close();
  console.log('\n✅ 3장 모두 업로드 완료! 피드에서 확인해보세요.');
}
main().catch(e => console.error('❌ 에러:', e.message));

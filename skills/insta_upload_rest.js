const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 두 번째 카드 업로드
async function uploadCard(page, imagePath, caption) {
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);

  const createClicked = await page.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        const btn = svg.closest('a') || svg.closest('button') || svg.closest('[role="button"]');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  if (!createClicked) return false;
  await sleep(2000);

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('button, [role="button"], a, span'));
    const item = items.find(el => el.innerText?.trim() === '게시물' || el.innerText?.trim() === 'Post');
    if (item) item.click();
  });
  await sleep(2000);

  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) return false;
  await fileInput.setInputFiles(imagePath);
  await sleep(3000);

  for (let s = 0; s < 3; s++) {
    const next = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '다음' || b.innerText?.trim() === 'Next');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (next) await sleep(2500);
    else break;
  }

  const cap = await page.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea[placeholder*="문구"]');
  if (cap) {
    await cap.click({ force: true });
    await sleep(500);
    await page.keyboard.type(caption, { delay: 15 });
  }
  await sleep(2000);

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '공유' || b.innerText?.trim() === 'Share');
    if (btn) btn.click();
  });
  await sleep(5000);
  return true;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const ig = pages.find(p => p.url().includes('instagram.com') && !p.url().includes('accounts'));
  if (!ig) { console.log('인스타 페이지 없음'); await b.close(); return; }

  // 2번 카드
  console.log('📤 2/3 업로드 중...');
  const caption2 = `✂️ 편집 걱정은 그만! 🎬

"촬영은 어떻게 해결했는데... 편집은 누가 하죠?"

걱정 마세요. 편집은 하지 마세요. 그냥 맡기세요.

찍은 영상 원본만 보내주시면
전문가가 자막부터 BGM, 색보정까지
다 해드립니다.

릴스, 쇼츠, 틱톡까지 채널별로 최적화해서 납품!

👉 프로필 링크에서 자세히 보기

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주
#에이컷 #의료마케팅 #병원숏폼 #영상편집 #서울`;

  const r2 = await uploadCard(ig, path.join(WS, 'insta_card2.png'), caption2);
  console.log('2/3:', r2 ? '✅' : '⚠️');
  await sleep(5000);

  // 3번 카드
  console.log('📤 3/3 업로드 중...');
  const caption3 = `💡 실제 사례: 하루 5분으로 월 20편! 🎯

서울 강남某 피부과의 실제 이야기입니다.

도입 전: "릴스 해야 하는데 누가 찍지? 누가 편집하지?"
도입 후: 직원들이 번갈아 5분 촬영, 에이컷이 편집

결과: 월 20편 정기 납품!
원장님도 직원들도 부담 없습니다 😊

👉 프로필 링크에서 블로그 글 확인

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주
#에이컷 #의료마케팅 #병원숏폼 #사례 #서울`;

  const r3 = await uploadCard(ig, path.join(WS, 'insta_card3.png'), caption3);
  console.log('3/3:', r3 ? '✅' : '⚠️');

  await b.close();
  console.log('\n✅ 나머지 2장 업로드 완료!');
}
main().catch(e => console.error('❌ 에러:', e.message));

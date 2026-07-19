const { chromium } = require('playwright');
const path = require('path');

const IMAGE = 'C:/Users/paul/.openclaw/workspace/aicut_blog_fp_card1.png';
const CAPTION = `피부과 실장님, 직원분들,
숏폼 촬영 너무 어렵죠? 😅

"원장님 촬영하는 것도 어색한데
직원들한테 시키기도 미안하고
편집은 누가 하죠?"

맞아요. 촬영도 어렵고 편집은 더 어렵습니다.

하지만 걱정 마세요.
촬영은 5분이면 충분합니다.
편집은 저희가 다 해드립니다.

찍은 영상만 보내주세요.
자막, BGM, 색보정까지 다 해드려요.

👉 프로필 링크에서 자세히 보기

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주
#에이컷 #AICUT #의료마케팅 #병원숏폼 #촬영가이드`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('instagram.com/aicut'));

  if (!page) { console.log('인스타 페이지 없음'); await b.close(); return; }
  console.log('✅ 인스타 페이지 발견');

  // 홈으로 이동
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);

  // + 버튼 클릭
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
  console.log('만들기 클릭:', createClicked);
  await sleep(2000);

  // 게시물 옵션 선택
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('button, [role="button"], a, span'));
    const item = items.find(el => {
      const t = el.innerText?.trim();
      return t === '게시물' || t === 'Post';
    });
    if (item) item.click();
  });
  await sleep(2000);

  // 파일 업로드
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) { console.log('파일 입력 없음'); await b.close(); return; }
  await fileInput.setInputFiles(IMAGE);
  console.log('이미지 업로드 완료');
  await sleep(3000);

  // 다음 버튼 (3단계)
  for (let step = 0; step < 3; step++) {
    const nextClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => {
        const t = b.innerText?.trim();
        return t === '다음' || t === 'Next';
      });
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (nextClicked) {
      console.log(`다음 클릭 (${step+1}/3)`);
      await sleep(2500);
    } else break;
  }

  // 캡션 입력
  const captionInput = await page.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea[placeholder*="문구"]');
  if (captionInput) {
    await captionInput.click({ force: true });
    await sleep(500);
    await page.keyboard.type(CAPTION, { delay: 20 });
    console.log('캡션 입력 완료');
  } else {
    console.log('캡션 입력창 없음');
  }

  await sleep(2000);

  // 공유 버튼
  const shared = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => {
      const t = b.innerText?.trim();
      return t === '공유' || t === 'Share';
    });
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('공유:', shared);
  await sleep(5000);

  console.log('\n✅ 피드 업로드 완료!');
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

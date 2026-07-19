const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CAPTION = `피부과 실장님, 직원분들 모두 OK 🙌

😅 "촬영도 어색하고 편집도 모르겠고..."
→ 촬영 가이드 한 장이면 5분 OK

✂️ "편집은 누가 하죠?"
→ 찍기만 하세요. 자막·BGM·색보정 다 해드려요

💡 실제 사례: 하루 5분 촬영으로 월 20편!
→ 직원들이 돌아가며 촬영, 편집은 에이컷

병원 숏폼, 더 이상 고민하지 마세요.
촬영만 하세요. 나머진 저희가 합니다 💪

👉 프로필 링크에서 블로그 글 확인

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주
#에이컷 #의료마케팅 #병원숏폼 #촬영가이드 #서울`;

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const ig = pages.find(p => p.url().includes('instagram.com') && !p.url().includes('accounts'));
  if (!ig) { console.log('인스타 페이지 없음'); await b.close(); return; }

  // 프로필로 이동
  await ig.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);

  // 첫 번째 게시물 클릭
  const postClicked = await ig.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/p/"]');
    if (links.length > 0) { links[0].click(); return true; }
    return false;
  });
  console.log('게시물 열기:', postClicked);
  await sleep(3000);

  // ⋮ (더보기) 버튼 클릭
  const moreClicked = await ig.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    // ⋮ 버튼 찾기 (보통 오른쪽 상단, aria-label이나 특정 위치)
    const moreBtn = btns.find(b => {
      const aria = b.getAttribute('aria-label') || '';
      return aria.includes('더 보기') || aria.includes('more') || aria.includes('options');
    });
    if (moreBtn) { moreBtn.click(); return true; }
    // svg 기반 ⋮ 찾기
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const aria = svg.getAttribute('aria-label') || '';
      if (aria.includes('더 보기') || aria.includes('more')) {
        svg.closest('[role="button"], button')?.click();
        return true;
      }
    }
    return false;
  });
  console.log('더보기 버튼:', moreClicked);
  await sleep(2000);

  // "수정" 버튼 클릭
  const editClicked = await ig.evaluate(() => {
    const items = Array.from(document.querySelectorAll('button, [role="button"], span, div'));
    const editItem = items.find(el => {
      const t = el.innerText?.trim();
      return t === '수정' || t === 'Edit';
    });
    if (editItem) { editItem.click(); return true; }
    return false;
  });
  console.log('수정 버튼:', editClicked);
  await sleep(3000);

  // 캡션 입력창 찾아서 수정
  const captionInput = await ig.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea');
  if (captionInput) {
    await captionInput.click({ force: true });
    await sleep(500);
    // 기존 내용 지우기
    await ig.keyboard.press('Control+a');
    await sleep(300);
    await ig.keyboard.press('Backspace');
    await sleep(500);
    // 새 캡션 입력
    await ig.keyboard.type(CAPTION, { delay: 10 });
    console.log('✅ 캡션 입력 완료');
  } else {
    console.log('캡션 입력창 없음');
  }

  await sleep(2000);

  // 완료/저장 버튼
  const doneClicked = await ig.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const doneBtn = btns.find(b => {
      const t = b.innerText?.trim();
      return t === '완료' || t === 'Done' || t === '저장' || t === 'Save';
    });
    if (doneBtn) { doneBtn.click(); return true; }
    return false;
  });
  console.log('완료 버튼:', doneClicked);
  await sleep(3000);

  console.log('\n✅ 캡션 수정 완료!');
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

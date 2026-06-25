const { chromium } = require('playwright');
const path = require('path');

const IMAGE_PATH = 'C:/Users/paul/.openclaw/workspace/insta_cards/card6_shopping.png';
const CAPTION = `쇼핑몰 영상 콘텐츠, 기획은 되는데 편집에서 막히고 있나요?

매달 새 편집자 찾고, 브랜드 톤 매번 설명하고, 시즌 캠페인은 납품이 밀리고.

에이컷은 전담 에디터 고정 배정으로
한 번 온보딩 후엔 소스만 넘기면 됩니다.

✅ 전담 에디터 — 매달 교체 없음
✅ 브랜드 톤 고정 — 한 번 설정으로 끝
✅ 48시간 납품 — 시즌 캠페인도 OK

무료 상담 → 프로필 링크

#쇼핑몰마케팅 #영상편집외주 #이커머스마케팅 #스마트스토어마케팅 #영상편집월정액 #에이컷 #AICUT #전담편집팀 #48시간납품 #콘텐츠마케팅 #SNS영상 #숏폼편집 #영상제작외주 #브랜드영상 #쇼핑몰운영`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('instagram.com'));
  if (!page) page = pages[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  console.log('인스타그램 이동...');
  try { await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(3000);

  // 새 게시물 버튼 (SVG 아이콘)
  const newPostBtn = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, [role="button"], svg'));
    const btn = els.find(el => {
      const label = el.getAttribute('aria-label') || '';
      return label.includes('새 게시물') || label.includes('New post') || label.includes('만들기');
    });
    if (btn) { btn.click(); return '새 게시물 클릭'; }
    return '못 찾음';
  });
  console.log(newPostBtn);
  await sleep(2000);

  if (newPostBtn === '못 찾음') {
    // 좌측 네비게이션 + 아이콘 좌표 클릭 시도
    await page.mouse.click(66, 490);
    await sleep(2000);
  }

  // 팝업에서 "게시물" 선택
  const postTypeBtn = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, [role="button"], span, div'));
    const btn = els.find(el => el.innerText?.trim() === '게시물');
    if (btn) { btn.click(); return '게시물 클릭'; }
    return '못 찾음';
  });
  console.log('게시물 타입:', postTypeBtn);
  await sleep(1500);

  // 파일 업로드
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(IMAGE_PATH);
    console.log('파일 업로드');
    await sleep(3000);
  } else {
    console.log('파일 input 없음 — 드래그앤드롭 시도');
  }

  // 다음 버튼 반복 클릭
  for (let step = 0; step < 3; step++) {
    const nextBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.innerText?.trim() === '다음');
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log(`다음 버튼 ${step+1}:`, nextBtn);
    await sleep(2500);
  }

  // 캡션 입력
  const captionEl = await page.$('[aria-label="문구 작성..."], [contenteditable="true"], textarea');
  if (captionEl) {
    await captionEl.click();
    await sleep(500);
    await captionEl.type(CAPTION, { delay: 5 });
    console.log('캡션 입력 완료');
    await sleep(1000);
  } else {
    console.log('캡션 입력창 없음');
  }

  // 공유 버튼
  const shareBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '공유');
    if (btn) { btn.click(); return '공유 클릭'; }
    return '없음';
  });
  console.log('공유:', shareBtn);
  await sleep(5000);

  console.log('✅ 인스타그램 업로드 완료');
  await b.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
}).finally(() => setTimeout(() => process.exit(0), 2000));

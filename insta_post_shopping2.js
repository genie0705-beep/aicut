const { chromium } = require('playwright');

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
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // 새로운 게시물 SVG 버튼 클릭
  const r1 = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    const target = svgs.find(s => s.getAttribute('aria-label') === '새로운 게시물');
    if (target) {
      const btn = target.closest('button') || target.closest('[role="button"]') || target.parentElement;
      btn.click(); return '새로운 게시물 클릭';
    }
    return '없음';
  });
  console.log(r1);
  await sleep(2500);

  // "게시물" 메뉴 선택
  const r2 = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const btn = els.find(el => el.innerText?.trim() === '게시물' && el.tagName !== 'SPAN');
    if (btn) { btn.click(); return '게시물 선택'; }
    // span도 시도
    const span = els.find(el => el.innerText?.trim() === '게시물');
    if (span) { span.click(); return '게시물(span) 선택'; }
    return '없음: ' + els.filter(el=>el.innerText?.trim().length < 20 && el.innerText?.trim().length > 0).map(el=>el.innerText?.trim()).slice(0,10).join(' | ');
  });
  console.log(r2);
  await sleep(2000);

  // 파일 input 찾기
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(IMAGE_PATH);
    console.log('파일 업로드 완료');
    await sleep(4000);
  } else {
    console.log('파일 input 없음');
    // 컴퓨터에서 선택 버튼 클릭
    const compBtn = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button,[role="button"]'));
      const btn = els.find(el => el.innerText?.trim().includes('컴퓨터에서 선택') || el.innerText?.trim().includes('기기에서 선택'));
      if (btn) { btn.click(); return '컴퓨터에서 선택 클릭'; }
      return '없음';
    });
    console.log(compBtn);
    await sleep(1000);
    const fi2 = await page.$('input[type="file"]');
    if (fi2) { await fi2.setInputFiles(IMAGE_PATH); console.log('파일 업로드 완료(2)'); await sleep(4000); }
  }

  // "다음" 버튼 3번
  for (let i = 0; i < 3; i++) {
    const next = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button,[role="button"]'));
      const btn = btns.find(b => {
        const t = b.innerText?.trim();
        return t === '다음' || t === 'Next';
      });
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log(`다음 ${i+1}:`, next);
    await sleep(2500);
    if (!next) break;
  }

  // 캡션 입력
  const captionEl = await page.$('[aria-label="문구 작성..."], [contenteditable="true"], textarea[placeholder]');
  if (captionEl) {
    await captionEl.click(); await sleep(300);
    await captionEl.type(CAPTION, { delay: 8 });
    console.log('캡션 입력 완료');
    await sleep(1000);
  }

  // 공유 버튼
  const share = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button,[role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '공유' || b.innerText?.trim() === 'Share');
    if (btn) { btn.click(); return '공유 클릭'; }
    return '없음: ' + btns.map(b=>b.innerText?.trim()).filter(t=>t).join(' | ');
  });
  console.log('공유:', share);
  await sleep(6000);

  console.log('✅ 인스타그램 업로드 완료');
  await b.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
}).finally(() => setTimeout(() => process.exit(0), 2000));

const { chromium } = require('playwright');

const IMAGE_PATH = 'C:/Users/paul/.openclaw/workspace/insta_cards/card6_shopping.png';
const POST_TEXT = `쇼핑몰 영상 월 20편, 어떻게 올리냐고요?

비밀은 간단합니다.
편집을 직접 안 하는 것.

전담 에디터한테 소스만 넘기면
48시간 안에 납품됩니다.

브랜드 톤은 온보딩 1회로 저장.
매달 처음부터 설명할 필요 없어요.

aicut.co.kr`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('threads.com'));
  if (!page) page = pages[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  console.log('Threads 이동...');
  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(3000);

  // 작성 버튼 클릭 (상단 펜 아이콘, 860, 96)
  await page.mouse.click(860, 96);
  console.log('작성 버튼 클릭');
  await sleep(2500);

  // 모달 확인
  const modal = await page.evaluate(() => {
    const m = document.querySelector('[role="dialog"]');
    return m ? '모달 열림' : '모달 없음';
  });
  console.log(modal);

  // 텍스트 입력
  const textArea = await page.$('[role="dialog"] [contenteditable="true"], [role="dialog"] div[contenteditable]');
  if (textArea) {
    await textArea.click(); await sleep(300);
    await textArea.type(POST_TEXT, { delay: 8 });
    console.log('텍스트 입력 완료');
    await sleep(500);
  }

  // 이미지 첨부 — 미디어 버튼 찾기
  const mediaBtn = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return '모달 없음';
    const btns = Array.from(modal.querySelectorAll('button,[role="button"],svg'));
    const btn = btns.find(el => {
      const label = el.getAttribute('aria-label') || '';
      return label.includes('미디어') || label.includes('사진') || label.includes('이미지') || label.includes('media');
    });
    if (btn) {
      const target = btn.closest('button') || btn.closest('[role="button"]') || btn;
      target.click(); return '미디어 버튼 클릭';
    }
    return '없음: ' + btns.map(b=>b.getAttribute('aria-label')).filter(t=>t).join(' | ');
  });
  console.log('미디어:', mediaBtn);
  await sleep(1500);

  // 파일 input
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(IMAGE_PATH);
    console.log('이미지 업로드');
    await sleep(4000);
  }

  // 게시 버튼
  const postBtn = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return '모달 없음';
    const btns = Array.from(modal.querySelectorAll('button,[role="button"]'));
    const btn = btns.find(b => {
      const t = b.innerText?.trim();
      return t === '게시' || t === 'Post';
    });
    if (btn) { btn.click(); return '게시 클릭'; }
    // 하단 게시 버튼 좌표 클릭 시도
    return '없음: ' + btns.map(b=>b.innerText?.trim()).filter(t=>t).join(' | ');
  });
  console.log('게시:', postBtn);

  if (postBtn === '없음' || postBtn.startsWith('없음')) {
    // 좌표로 게시 버튼 클릭 (모달 하단 우측)
    await page.mouse.click(866, 866);
    console.log('게시 버튼 좌표 클릭 (866, 866)');
  }

  await sleep(5000);
  console.log('✅ Threads 업로드 완료');
  await b.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
}).finally(() => setTimeout(() => process.exit(0), 2000));

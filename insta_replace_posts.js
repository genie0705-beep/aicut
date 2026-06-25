const { chromium } = require('playwright');
const path = require('path');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

// 오늘 올린 5개 (최신순) + 새 이미지 매핑
const POSTS = [
  { url: 'https://www.instagram.com/aicut.official/p/DY9GxIhGfc8/', image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card1_납기편집.png', caption: `영상 편집 의뢰하면 가장 많이 듣는 말 👂\n\n"이번 달에 올리려고 했는데 편집이 밀려서..."\n\n에이컷은 이 문제를 월정액으로 해결했어요.\n전담 에디터가 매달 정해진 날짜에 납품 → 업로드 일정 절대 안 밀림 🗓️\n\n👉 프로필 링크에서 무료 상담 신청하세요\n\n#영상편집 #영상편집외주 #영상편집대행 #콘텐츠제작\n#유튜브편집 #숏폼편집 #에이컷 #AICUT\n#영상편집월정액 #콘텐츠마케팅 #마케팅 #영상제작` },
  { url: 'https://www.instagram.com/aicut.official/p/DY9GrXYmfbT/', image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card2_AI에디터.png', caption: `AI로 영상 만든다고요? 🤖\n\n저희도 씁니다. 근데 AI가 다 하진 않아요.\n자막 교정, 컷 감각, 브랜드 톤 맞추기 — 이건 여전히 사람이 해요.\n\nAI + 전담 에디터 = 빠르고 합리적인 비용\n그게 에이컷 방식이에요.\n\n👉 샘플 1편 무료로 받아보세요\n\n#AI영상 #영상제작 #에디터 #브랜드영상\n#에이컷 #AICUT #영상편집외주 #콘텐츠마케팅\n#숏폼마케팅 #유튜브마케팅` },
  { url: 'https://www.instagram.com/aicut.official/p/DY9GkuAmXCc/', image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card3_비용비교.png', caption: `"영상 하나 만드는 데 얼마예요?" 💰\n\n건당보다 월정액이 훨씬 쌉니다.\n월 4편, 전담팀, 정기납품 — 나눠보면 건당의 절반 이하.\n\n약정도 없어요. 한 달만 써보고 결정하세요 🙌\n\n👉 요금제 확인: aicut.co.kr\n\n#영상제작비용 #월정액 #콘텐츠마케팅 #영상편집비용\n#에이컷 #AICUT #영상편집외주 #영상편집대행\n#스타트업마케팅 #중소기업마케팅` },
  { url: 'https://www.instagram.com/aicut.official/p/DY9GeGnmb8q/', image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card4_병원마케팅.png', caption: `병원 마케팅에서 영상이 중요한 이유 🏥\n\n텍스트 설명보다 영상으로 보여주면 신뢰도가 달라요.\n\n진료과 소개, 의료진 인터뷰, 시술 과정 —\n이런 영상을 매달 꾸준히 올려야 효과가 나요.\n\n에이컷은 병원·의원 영상 전문으로도 제작합니다 💊\n\n#병원마케팅 #의원홍보 #브랜드영상 #의료영상\n#에이컷 #AICUT #영상편집외주 #병원홍보\n#의원마케팅 #헬스케어마케팅` },
  { url: 'https://www.instagram.com/aicut.official/p/DY9GXNdGTZx/', image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card5_부동산유튜브.png', caption: `부동산 유튜브 하려는 분들께 🏠\n\n처음엔 다들 "주 2회 업로드!" 다짐하죠.\n3개월 후엔 대부분 멈춰 있어요.\n\n편집이 막히기 때문이에요.\n\n에이컷 쓰시면 전담팀이 매달 고정 납품 —\n업로드 일정 걱정 없이 콘텐츠에만 집중할 수 있어요.\n\n👉 aicut.co.kr\n\n#부동산유튜브 #부동산마케팅 #영상편집 #콘텐츠\n#에이컷 #AICUT #유튜브편집 #영상편집외주\n#부동산콘텐츠 #유튜브마케팅` },
];

async function deletePost(page, postUrl) {
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2500);

  // 옵션 버튼 (•••) 클릭
  const optClicked = await page.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '옵션 더 보기' || title.textContent === 'More options')) {
        const btn = svg.closest('button') || svg.closest('[role="button"]');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  if (!optClicked) { console.log('  옵션 버튼 없음'); return false; }
  await sleep(1500);

  // 삭제 버튼 클릭
  const delClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '삭제' || b.innerText?.trim() === 'Delete');
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!delClicked) { console.log('  삭제 버튼 없음'); return false; }
  await sleep(1500);

  // 삭제 확인 버튼
  const confirmClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '삭제' || b.innerText?.trim() === 'Delete');
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(3000);
  return confirmClicked;
}

async function uploadPost(page, imagePath, caption) {
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  // 새 게시물 버튼
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
  if (!createClicked) { console.log('  만들기 버튼 없음'); return false; }
  await sleep(2000);

  // 게시물 선택
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('button, span'));
    const item = items.find(el => el.innerText?.trim() === '게시물' || el.innerText?.trim() === 'Post');
    if (item) item.click();
  });
  await sleep(2000);

  // 파일 업로드
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) { console.log('  파일 입력창 없음'); return false; }
  await fileInput.setInputFiles(imagePath);
  await sleep(3000);

  // 다음 2번
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.innerText?.trim() === '다음' || b.innerText?.trim() === 'Next');
      if (btn) btn.click();
    });
    await sleep(2500);
  }

  // 캡션 입력
  const editor = await page.$('[contenteditable="true"][role="textbox"], textarea');
  if (editor) {
    await editor.click({ force: true });
    await sleep(300);
    await page.keyboard.type(caption, { delay: 15 });
  }
  await sleep(1500);

  // 공유하기
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '공유하기' || b.innerText?.trim() === 'Share');
    if (btn && !btn.disabled) btn.click();
  });
  await sleep(6000);
  return true;
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  let success = 0;

  for (let i = 0; i < POSTS.length; i++) {
    const p = POSTS[i];
    console.log(`\n[${i+1}/5] ${path.basename(p.image)}`);

    try {
      // 1. 삭제
      console.log('  삭제 중...');
      const deleted = await deletePost(page, p.url);
      console.log(`  삭제: ${deleted ? '✅' : '❌'}`);
      await sleep(2000);

      // 2. 재업로드
      console.log('  업로드 중...');
      const uploaded = await uploadPost(page, p.image, p.caption);
      console.log(`  업로드: ${uploaded ? '✅' : '❌'}`);
      if (uploaded) success++;

    } catch(e) {
      console.log(`  ❌ ${e.message.split('\n')[0].substring(0, 80)}`);
    }

    await sleep(rand(10000, 15000));
  }

  console.log(`\n✅ 완료: ${success}/5개`);
  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

const { chromium } = require('playwright');
const path = require('path');

const CARDS = [
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/yt_card1.png',
    caption: `구독자 5만 유튜버가 편집 외주로 바꾼 후,
업로드 주기가 3배 빨라진 이유 🎬

"하루 8시간 편집하는데도 업로드가 밀려요"

혼자 편집 → AI 툴 → 에이컷
드디어 해결됐습니다.

✅ 편집 시간: 56시간 → 10시간
✅ 업로드 주기: 주 1회 → 주 3회
✅ 퀄리티: 그대로 유지

👉 프로필 링크에서 무료 상담 받아보세요

#유튜브편집 #영상편집외주 #크리에이터 #유튜버 #영상편집
#숏폼마케팅 #릴스 #에이컷 #AICUT #편집에디터
#유튜브마케팅 #크리에이터마케팅 #1인크리에이터`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/yt_card2.png',
    caption: `혼자 편집 8시간, AI 툴도 한계 💭

프리미어 프로, 파이널컷 템플릿, AI 편집...
크리에이터라면 다 써보셨죠?

문제는 이겁니다:
템플릿은 내 채널 색깔을 살리지 못하고
AI는 자막만 자동 생성해줄 뿐

결국 사람이 직접 편집해야
내 채널만의 퀄리티가 나옵니다.

👉 에이컷의 전담 에디터에게 맡겨보세요

#영상편집 #크리에이터 #유튜브편집 #AI편집 #콘텐츠제작
#유튜버 #에이컷 #AICUT #영상편집외주 #숏폼마케팅`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/yt_card3.png',
    caption: `편집 외주 하나로 업로드 주기 3배 증가 💡

에이컷 도입 후 A 크리에이터의 변화:

📌 편집 시간: 56시간 → 10시간 (-82%)
📌 업로드 주기: 주 1회 → 주 3회 (+200%)
📌 편집 퀄리티: 유지 (전담 에디터)
📌 수정 요청: 무제한 (마음에 들 때까지)

무엇보다 편집에 쏟던 시간을
콘텐츠 기획과 촬영에 집중할 수 있었습니다.

👉 지금 바로 무료 상담 신청하세요

#유튜브편집 #영상편집외주 #업로드주기 #크리에이터
#에이컷 #AICUT #영상편집 #유튜버 #콘텐츠마케팅
#숏폼마케팅 #릴스마케팅`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/yt_card4.png',
    caption: `유튜버·크리에이터라면
영상 편집, 에이컷에 맡기세요 🚀

✅ 편당 10만 원대부터 (월 정기)
✅ 2~3일 이내 1차 납품
✅ 전담 에디터 배정
✅ 무제한 수정 가능
✅ 채널 톤앤매너 완벽 반영

혼자 모든 걸 하려다 지친 크리에이터라면
편집은 전문가에게 맡기고
당신의 콘텐츠에 집중하세요.

👉 프로필 링크에서 무료 상담 신청

#에이컷 #AICUT #영상편집외주 #유튜브편집 #크리에이터
#유튜버 #영상편집 #콘텐츠마케팅 #유튜브마케팅 #숏폼
#릴스 #쇼츠 #틱톡마케팅 #1인크리에이터 #마케팅영상`
  }
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const cdpPort = process.env.CDP_PORT || 9224;
  const b = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  // 인스타그램 탭 찾기
  let page = pages.find(p => p.url().includes('instagram.com'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  }
  await page.bringToFront();
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  await sleep(3000);

  let success = 0;

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    console.log(`\n[${i+1}/${CARDS.length}] 카드 ${i+1}`);

    try {
      // 인스타 홈
      await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      await sleep(3000);

      // 새 게시물 버튼 (SVG title "새로운 게시물")
      const createClicked = await page.evaluate(() => {
        for (const svg of document.querySelectorAll('svg')) {
          const title = svg.querySelector('title');
          if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
            const btn = svg.closest('a, button, [role="button"]');
            if (btn) { btn.click(); return true; }
          }
        }
        return false;
      });
      console.log('  새 게시물:', createClicked);
      await sleep(2000);

      if (!createClicked) { console.log('  ❌ 버튼 없음'); continue; }

      // 게시물 옵션
      const postOpt = await page.evaluate(() => {
        const item = Array.from(document.querySelectorAll('button, [role="button"], a, span'))
          .find(el => el.innerText?.trim() === '게시물' || el.innerText?.trim() === 'Post');
        if (item) { item.click(); return true; }
        return false;
      });
      console.log('  게시물 옵션:', postOpt);
      await sleep(2000);

      // file input
      const fileInput = await page.$('input[type="file"]');
      if (!fileInput) { console.log('  ❌ 파일입력 없음'); continue; }
      await fileInput.setInputFiles(card.image);
      console.log('  이미지 업로드 ✅');
      await sleep(3000);

      // 다음 버튼 (크롭→필터→설정)
      for (let step = 0; step < 3; step++) {
        const nextClicked = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button, [role="button"]'))
            .find(b => b.innerText?.trim() === '다음' || b.innerText?.trim() === 'Next');
          if (btn) { btn.click(); return true; }
          return false;
        });
        if (nextClicked) { console.log(`  다음 (${step+1}단계)`); await sleep(2500); }
        else { break; }
      }

      // 캡션
      await sleep(1500);
      const captionArea = await page.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea');
      if (captionArea) {
        await captionArea.click({ force: true });
        await sleep(500);
        await captionArea.fill(card.caption);
        console.log('  캡션 입력 ✅');
      } else {
        const editor = await page.$('[contenteditable="true"][role="textbox"]');
        if (editor) { await editor.click({ force: true }); await sleep(500); await page.keyboard.type(card.caption, { delay: 20 }); console.log('  캡션 입력 ✅'); }
      }
      await sleep(1000);

      // 공유하기
      const shared = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => (b.innerText?.trim() === '공유하기' || b.innerText?.trim() === 'Share') && !b.disabled);
        if (btn) { btn.click(); return true; }
        return false;
      });
      console.log('  공유:', shared);
      await sleep(6000);
      
      console.log(`  ✅ 포스팅 완료!`);
      success++;
    } catch(e) {
      console.log(`  ❌ 오류: ${e.message.substring(0, 60)}`);
    }

    if (i < CARDS.length - 1) {
      const w = rand(15000, 25000);
      console.log(`  ${w/1000}초 대기...`);
      await sleep(w);
    }
  }

  console.log(`\n✅ ${success}/${CARDS.length}개 포스팅 완료`);
  process.exit(0);
})().catch(e => { console.error('Fatal:', e.message.substring(0, 60)); process.exit(1); });

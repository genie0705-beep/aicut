const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CARDS = [
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card1_납기편집.png',
    caption: `영상 편집 의뢰하면 가장 많이 듣는 말 👂

"이번 달에 올리려고 했는데 편집이 밀려서..."

에이컷은 이 문제를 월정액으로 해결했어요.
전담 에디터가 매달 정해진 날짜에 납품 → 업로드 일정 절대 안 밀림 🗓️

👉 프로필 링크에서 무료 상담 신청하세요

#영상편집 #영상편집외주 #영상편집대행 #콘텐츠제작
#유튜브편집 #숏폼편집 #에이컷 #AICUT
#영상편집월정액 #콘텐츠마케팅 #마케팅 #영상제작`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card2_AI에디터.png',
    caption: `AI로 영상 만든다고요? 🤖

저희도 씁니다. 근데 AI가 다 하진 않아요.
자막 교정, 컷 감각, 브랜드 톤 맞추기 — 이건 여전히 사람이 해요.

AI + 전담 에디터 = 빠르고 합리적인 비용
그게 에이컷 방식이에요.

👉 샘플 1편 무료로 받아보세요

#AI영상 #영상제작 #에디터 #브랜드영상
#에이컷 #AICUT #영상편집외주 #콘텐츠마케팅
#숏폼마케팅 #유튜브마케팅`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card3_비용비교.png',
    caption: `"영상 하나 만드는 데 얼마예요?" 💰

건당보다 월정액이 훨씬 쌉니다.
월 4편, 전담팀, 정기납품 — 나눠보면 건당의 절반 이하.

약정도 없어요. 한 달만 써보고 결정하세요 🙌

👉 요금제 확인: aicut.co.kr

#영상제작비용 #월정액 #콘텐츠마케팅 #영상편집비용
#에이컷 #AICUT #영상편집외주 #영상편집대행
#스타트업마케팅 #중소기업마케팅`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card4_병원마케팅.png',
    caption: `병원 마케팅에서 영상이 중요한 이유 🏥

텍스트 설명보다 영상으로 보여주면 신뢰도가 달라요.

진료과 소개, 의료진 인터뷰, 시술 과정 —
이런 영상을 매달 꾸준히 올려야 효과가 나요.

에이컷은 병원·의원 영상 전문으로도 제작합니다 💊

#병원마케팅 #의원홍보 #브랜드영상 #의료영상
#에이컷 #AICUT #영상편집외주 #병원홍보
#의원마케팅 #헬스케어마케팅`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card5_부동산유튜브.png',
    caption: `부동산 유튜브 하려는 분들께 🏠

처음엔 다들 "주 2회 업로드!" 다짐하죠.
3개월 후엔 대부분 멈춰 있어요.

편집이 막히기 때문이에요.

에이컷 쓰시면 전담팀이 매달 고정 납품 —
업로드 일정 걱정 없이 콘텐츠에만 집중할 수 있어요.

👉 aicut.co.kr

#부동산유튜브 #부동산마케팅 #영상편집 #콘텐츠
#에이컷 #AICUT #유튜브편집 #영상편집외주
#부동산콘텐츠 #유튜브마케팅`
  }
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];

  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  let success = 0;

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    console.log(`\n[${i+1}/${CARDS.length}] ${path.basename(card.image)}`);

    try {
      // 인스타 홈으로 이동
      try {
        await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch(e) {}
      await sleep(3000);

      // 새 게시물 만들기 버튼 클릭 - SVG title "새로운 게시물" 방식
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

      if (!createClicked) {
        console.log('  ❌ 만들기 버튼 없음 - 스킵');
        continue;
      }

      // "게시물" 옵션 선택
      const postOptClicked = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('button, [role="button"], a, span'));
        const item = items.find(el => {
          const t = el.innerText?.trim();
          return t === '게시물' || t === 'Post';
        });
        if (item) { item.click(); return true; }
        return false;
      });
      console.log('게시물 옵션:', postOptClicked);
      await sleep(2000);

      // 파일 input 찾기
      const fileInput = await page.$('input[type="file"]');
      if (!fileInput) {
        console.log('  파일 입력창 없음 - 스킵');
        continue;
      }

      // 이미지 업로드
      await fileInput.setInputFiles(card.image);
      console.log('  이미지 업로드 완료');
      await sleep(3000);

      // "다음" 버튼 클릭 (여러번)
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
          console.log(`  다음 클릭 (${step+1}단계)`);
          await sleep(2500);
        } else {
          break;
        }
      }

      // 캡션 입력
      const captionInput = await page.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea[placeholder*="문구"]');
      if (captionInput) {
        await captionInput.click({ force: true });
        await sleep(500);
        await page.keyboard.type(card.caption, { delay: 20 });
        console.log('  캡션 입력 완료');
      } else {
        // contenteditable 입력창
        const editor = await page.$('[contenteditable="true"][role="textbox"]');
        if (editor) {
          await editor.click({ force: true });
          await sleep(500);
          await page.keyboard.type(card.caption, { delay: 20 });
          console.log('  캡션 입력 완료 (editor)');
        }
      }
      await sleep(1500);

      // "공유하기" 버튼 클릭
      const shareClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = btns.find(b => {
          const t = b.innerText?.trim();
          return t === '공유하기' || t === 'Share';
        });
        if (btn && !btn.disabled) { btn.click(); return true; }
        return false;
      });
      console.log('  공유하기:', shareClicked);
      await sleep(6000);

      console.log(`  ✅ 포스팅 완료!`);
      success++;

    } catch(e) {
      console.log(`  ❌ 오류: ${e.message.split('\n')[0].substring(0, 80)}`);
    }

    if (i < CARDS.length - 1) {
      const wait = rand(15000, 25000);
      console.log(`  다음 포스팅까지 ${wait/1000}초 대기...`);
      await sleep(wait);
    }
  }

  console.log(`\n✅ 총 ${success}/${CARDS.length}개 포스팅 완료`);
  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

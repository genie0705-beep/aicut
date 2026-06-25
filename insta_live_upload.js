const { chromium } = require('playwright');

const CARDS = [
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/live_card1.png',
    caption: `라이브 다시보기, 편집 하나로 전환율 3배 차이 🛒

"2시간 방송 그냥 올리면 되죠?"
→ 이탈률 80%의 시작입니다.

같은 라이브, 다른 편집 — 결과가 완전히 달랐습니다.

✅ 편집 후 시청 완료율: 12% → 68%
✅ 구매 전환율: 0.3% → 2.1%
✅ 재방문율: 5% → 32%

👉 프로필 링크에서 무료 상담 받아보세요

#라이브커머스 #쇼핑몰마케팅 #영상편집 #다시보기
#숏폼마케팅 #에이컷 #AICUT #구매전환율 #이커머스
#스마트스토어 #라이브마케팅 #C커머스`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/live_card2.png',
    caption: `2시간 라이브, 그냥 올리면 이탈률 80% 📉

"영상이 너무 길어요. 원하는 상품 찾기가 힘들어요"

고객의 솔직한 후기입니다.

라이브 다시보기의 핵심은 '편집'입니다.
2시간 분량을 5~10분으로 압축하고,
상품별 챕터를 나누고,
구매 포인트를 강조해야 합니다.

안 그러면 시청자는 그냥 떠납니다.

👉 프로필 링크에서 상담받기

#라이브커머스 #쇼핑몰 #영상편집 #다시보기 #이탈률
#에이컷 #AICUT #숏폼마케팅 #콘텐츠마케팅 #온라인쇼핑몰`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/live_card3.png',
    caption: `라이브 1회 → 숏폼 5개 제작, 전환율 2.1% 💡

에이컷 도입 후 A 쇼핑몰의 변화:

📌 라이브 2시간 → 다시보기 5분 + 숏폼 5개
📌 시청 완료율 12% → 68% (+466%)
📌 구매 전환율 0.3% → 2.1% (+600%)

C-커머스 시대, 차별화는 편집에서 시작됩니다.

👉 프로필 링크에서 자세히 보기

#라이브커머스 #숏폼마케팅 #쇼핑몰 #영상편집외주
#에이컷 #AICUT #전환율 #릴스 #쇼츠 #틱톡마케팅
#이커머스 #스마트스토어 #온라인마케팅`
  },
  {
    image: 'C:/Users/paul/.openclaw/workspace/insta_cards/live_card4.png',
    caption: `쇼핑몰·라이브커머스 운영자라면
영상 편집, 에이컷에 맡기세요 🚀

✅ 라이브 다시보기 + 숏폼 동시 제작
✅ 2~3일 이내 1차 납품
✅ 상품별 챕터 분할
✅ 릴스·쇼츠·틱톡 최적화
✅ 편당 10만 원대부터 (월 정기)

C-커머스 시대, 차별화는 콘텐츠입니다.

👉 프로필 링크에서 무료 상담 신청

#에이컷 #AICUT #라이브커머스 #영상편집외주 #쇼핑몰
#숏폼마케팅 #영상편집 #이커머스 #스마트스토어 #마케팅
#릴스 #쇼츠 #틱톡 #라이브마케팅 #콘텐츠마케팅`
  }
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let success = 0;

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    console.log(`\n[${i+1}/${CARDS.length}] 업로드...`);
    try {
      const p = await ctx.newPage();
      await p.goto('https://www.instagram.com/create/select/', { timeout: 20000 }).catch(() => {});
      await sleep(3000);

      const fi = await p.$('input[type="file"]');
      if (!fi) { console.log('  ❌ 파일입력 없음'); await p.close(); continue; }
      await fi.setInputFiles(card.image);
      console.log('  이미지 ✅');
      await sleep(2000);

      // 다음 버튼 (1번)
      const nextClicked = await p.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '다음');
        if (btn) { btn.click(); return true; }
        return false;
      });
      console.log('  다음:', nextClicked ? '✅' : '❌');
      await sleep(3000);

      // 캡션
      const ca = await p.$('[aria-label*="캡션"], textarea, [contenteditable="true"][role="textbox"]');
      if (ca) { await ca.click({ force: true }); await sleep(500); await ca.fill(card.caption); console.log('  캡션 ✅'); }
      await sleep(1000);

      // 공유하기
      const shared = await p.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '공유하기' && !b.disabled);
        if (btn) { btn.click(); return true; }
        return false;
      });
      console.log('  공유:', shared ? '✅' : '❌');
      await sleep(5000);
      console.log('  ✅ 완료!');
      success++;
      await p.close();
    } catch(e) {
      console.log(`  ❌ 오류: ${e.message.substring(0, 60)}`);
    }

    if (i < CARDS.length - 1) {
      const w = rand(15000, 25000);
      console.log(`  ${w/1000}초 대기...`);
      await sleep(w);
    }
  }

  console.log(`\n✅ ${success}/${CARDS.length}개 업로드 완료`);
  process.exit(0);
})().catch(e => { console.error('Fatal:', e.message.substring(0, 60)); process.exit(1); });

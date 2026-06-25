const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');

const POSTS = [
  `영상 편집 의뢰하면 가장 많이 듣는 말 👂

"이번 달에 올리려고 했는데 편집이 밀려서..."

에이컷은 이 문제를 월정액으로 해결했어요.
전담 에디터가 매달 정해진 날짜에 납품 → 업로드 일정 절대 안 밀림 🗓️

#영상편집 #콘텐츠제작 #마케팅 #숏폼`,

  `AI로 영상 만든다고요? 🤖

저희도 씁니다. 근데 AI가 다 하진 않아요.
자막 교정, 컷 감각, 브랜드 톤 맞추기 — 이건 여전히 사람이 해요.

AI + 전담 에디터 = 빠르고 합리적인 비용
그게 에이컷 방식이에요.

#AI영상 #영상제작 #에디터 #브랜드영상`,

  `"영상 하나 만드는 데 얼마예요?"

건당보다 월정액이 훨씬 쌉니다.
월 4편, 전담팀, 정기납품 — 나눠보면 건당의 절반 이하.

약정도 없어요. 한 달만 써보고 결정하세요 🙌

#영상제작비용 #월정액 #콘텐츠마케팅`,

  `병원 마케팅에서 영상이 중요한 이유 🏥

진료과 소개, 의료진 인터뷰, 시술 과정 —
이런 영상을 매달 꾸준히 올려야 효과가 나요.

에이컷은 병원·의원 영상 전문으로도 제작합니다 💊

#병원마케팅 #의원홍보 #브랜드영상`,

  `부동산 유튜브 하려는 분들께 🏠

처음엔 다들 "주 2회 업로드!" 다짐하죠.
3개월 후엔 대부분 멈춰 있어요.

에이컷 쓰시면 전담팀이 매달 고정 납품 —
업로드 걱정 없이 콘텐츠에만 집중!

👉 aicut.co.kr

#부동산유튜브 #부동산마케팅 #영상편집`
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  let count = 0;

  for (let i = 0; i < POSTS.length; i++) {
    const text = POSTS[i];
    console.log(`\n[${i+1}/${POSTS.length}] ${text.split('\n')[0]}`);

    try {
      await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);

      // "새로운 소식이 있나요?" 버튼 클릭
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = btns.find(b => b.innerText?.trim() === '새로운 소식이 있나요?');
        if (btn) btn.click();
      });
      await sleep(1500);

      // contenteditable 대기
      let box = null;
      try { box = await page.waitForSelector('[contenteditable="true"]', { timeout: 5000 }); } catch(e) {}
      if (!box) { console.log('  ❌ 입력창 없음'); continue; }

      // React 방식: 입력창 클릭 후 각 글자를 keyboard.type 으로 입력
      // (React는 실제 DOM 이벤트를 신뢰함)
      await box.click();
      await sleep(300);

      // 한 줄씩 입력 + Shift+Enter
      const lines = text.split('\n');
      for (let j = 0; j < lines.length; j++) {
        if (lines[j]) {
          await page.keyboard.type(lines[j], { delay: 30 });
        }
        if (j < lines.length - 1) {
          await page.keyboard.down('Shift');
          await page.keyboard.press('Enter');
          await page.keyboard.up('Shift');
          await sleep(50);
        }
      }
      await sleep(1000);

      // React state 업데이트 확인
      const inputLen = await page.evaluate(() => {
        const el = document.querySelector('[contenteditable="true"]');
        return el ? el.innerText.trim().length : 0;
      });
      console.log(`  입력: ${inputLen}자`);

      // 게시 버튼 활성화 상태 확인
      const btnInfo = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = btns.find(b => b.innerText?.trim() === '게시');
        if (!btn) return null;
        return {
          disabled: btn.disabled,
          ariaDisabled: btn.getAttribute('aria-disabled'),
          opacity: window.getComputedStyle(btn).opacity,
          pointerEvents: window.getComputedStyle(btn).pointerEvents
        };
      });
      console.log('  게시버튼:', JSON.stringify(btnInfo));

      if (btnInfo && btnInfo.disabled) {
        console.log('  ❌ 게시버튼 disabled');
        continue;
      }

      // 게시 버튼 클릭
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const btn = btns.find(b => b.innerText?.trim() === '게시');
        if (btn) btn.click();
      });
      await sleep(4000);

      // 확인
      await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const postCount = await page.evaluate(() =>
        document.querySelectorAll('[data-pressable-container]').length
      );
      console.log(`  게시글: ${postCount}개`);
      if (postCount > count + 1) {
        count = postCount - 1;
        console.log(`  ✅ 성공!`);
      }

    } catch(e) {
      console.log(`  [ERR] ${e.message.split('\n')[0].substring(0, 60)}`);
    }
    await sleep(await rand(5000, 8000));
  }

  console.log(`\n✅ 총 ${count}개 게시`);
  await b.close();
})().catch(e => console.error('ERR:', e.message));

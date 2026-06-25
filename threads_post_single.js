const { chromium } = require('playwright');

const POST_TEXT = `병원 마케팅에서 영상이 중요한 이유 🏥

진료과 소개, 의료진 인터뷰, 시술 과정 —
이런 영상을 매달 꾸준히 올려야 효과가 나요.

에이컷은 병원·의원 영상 전문으로도 제작합니다 💊

#병원마케팅 #의원홍보 #브랜드영상`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('브라우저 연결 중...');
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  console.log(`\n포스팅: ${POST_TEXT.split('\n')[0]}`);

  try {
    // 홈 이동
    try {
      await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch(e) {
      if (!e.message.includes('ERR_ABORTED')) throw e;
    }
    await sleep(3000);
    console.log(`현재 URL: ${page.url()}`);

    // 새 스레드 버튼 클릭
    const opened = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.innerText?.trim() === '새로운 소식이 있나요?');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!opened) {
      console.log('❌ 버튼 없음 - 스크린샷 찍어 확인');
      await page.screenshot({ path: 'threads_debug_shot.png' });
      await b.close();
      return;
    }
    await sleep(2000);

    // 입력창 포커스
    const focused = await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      if (!el) return false;
      el.focus();
      el.click();
      return true;
    });
    if (!focused) {
      console.log('❌ 입력창 없음');
      await b.close();
      return;
    }
    await sleep(500);

    // 텍스트 입력
    const lines = POST_TEXT.split('\n');
    for (let j = 0; j < lines.length; j++) {
      if (lines[j]) {
        await page.keyboard.type(lines[j], { delay: 20 });
      }
      if (j < lines.length - 1) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await sleep(20);
      }
    }
    await sleep(1000);

    const inputLen = await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      return el ? el.innerText.trim().length : 0;
    });
    console.log(`입력 완료: ${inputLen}자`);

    if (inputLen < 5) {
      console.log('❌ 입력 실패');
      await b.close();
      return;
    }

    // 게시 버튼 클릭
    const posted = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.innerText?.trim() === '게시');
      if (!btn) return 'no_btn';
      if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return 'disabled';
      btn.click();
      return 'ok';
    });
    console.log(`게시 결과: ${posted}`);

    if (posted === 'ok') {
      await sleep(5000);
      console.log('✅ 포스팅 성공!');
    }

  } catch(e) {
    console.log(`[ERR] ${e.message.split('\n')[0].substring(0, 100)}`);
  }

  await b.close();
})().catch(e => console.error('Fatal:', e.message));

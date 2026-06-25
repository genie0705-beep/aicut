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

  try {
    // 홈 이동
    try {
      await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch(e) {
      if (!e.message.includes('ERR_ABORTED')) throw e;
    }
    await sleep(3000);
    console.log('현재 URL:', page.url());

    // "새로운 소식이 있나요?" 버튼 찾기
    const opened = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.innerText && b.innerText.trim() === '새로운 소식이 있나요?');
      if (btn) { btn.click(); return true; }
      // 텍스트 포함 방식도 시도
      const btn2 = btns.find(b => b.innerText && b.innerText.includes('새로운 소식'));
      if (btn2) { btn2.click(); return '포함'; }
      return false;
    });
    console.log('버튼 클릭:', opened);
    if (!opened) {
      await page.screenshot({ path: 'threads_retry_debug.png' });
      console.log('❌ 버튼 못 찾음. 스크린샷 저장됨.');
      await b.close();
      return;
    }
    await sleep(2500);

    // 입력창 포커스
    const focused = await page.evaluate(() => {
      const editors = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      if (editors.length === 0) return false;
      const el = editors[0];
      el.focus();
      el.click();
      return true;
    });
    console.log('입력창 포커스:', focused);
    if (!focused) {
      await page.screenshot({ path: 'threads_retry_debug2.png' });
      console.log('❌ 입력창 없음');
      await b.close();
      return;
    }
    await sleep(500);

    // 텍스트 입력
    const lines = POST_TEXT.split('\n');
    for (let j = 0; j < lines.length; j++) {
      if (lines[j]) {
        await page.keyboard.type(lines[j], { delay: 30 });
      }
      if (j < lines.length - 1) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await sleep(30);
      }
    }
    await sleep(1500);

    const inputLen = await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      return el ? el.innerText.trim().length : 0;
    });
    console.log('입력 완료:', inputLen + '자');

    if (inputLen < 5) {
      console.log('❌ 입력 실패');
      await b.close();
      return;
    }

    // 게시 버튼 상태 확인
    const btnInfo = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.innerText && b.innerText.trim() === '게시');
      if (!btn) return { found: false };
      return {
        found: true,
        disabled: btn.disabled,
        ariaDisabled: btn.getAttribute('aria-disabled'),
        text: btn.innerText.trim()
      };
    });
    console.log('게시 버튼:', JSON.stringify(btnInfo));

    if (!btnInfo.found) {
      await page.screenshot({ path: 'threads_no_post_btn.png' });
      console.log('❌ 게시 버튼 없음');
      await b.close();
      return;
    }

    if (btnInfo.disabled || btnInfo.ariaDisabled === 'true') {
      console.log('❌ 게시 버튼 비활성화');
      await b.close();
      return;
    }

    // 게시 버튼 클릭
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.innerText && b.innerText.trim() === '게시');
      if (btn) btn.click();
    });
    console.log('게시 버튼 클릭!');

    await sleep(5000);

    // 결과 확인 - 게시 후 URL 또는 피드 확인
    const afterUrl = page.url();
    console.log('게시 후 URL:', afterUrl);
    
    await page.screenshot({ path: 'threads_after_post.png' });
    console.log('✅ 완료! 스크린샷: threads_after_post.png');

  } catch(e) {
    console.log('[ERR]', e.message.substring(0, 100));
    await page.screenshot({ path: 'threads_error.png' }).catch(() => {});
  }

  await b.close();
})().catch(e => console.error('Fatal:', e.message));

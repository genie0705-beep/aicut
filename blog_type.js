// 키보드 타이핑 방식 - React 에디터 대응
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) {
    console.log('에디터 탭 없음. 새로 엽니다.');
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(5000);
  }

  ctx.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

  // 에디터 완전히 초기화 - 새로고침
  await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(5000);

  // === 제목 타이핑 ===
  const title = '스타트업 CEO가 영상 PD 대신 월정기 편집을 선택한 이유';
  await page.evaluate((t) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.type === 'text' && inp.offsetParent !== null) {
        // React 16+ uses value + onChange
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(inp, '');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        // 한 글자씩 입력하는 효과
        for (let i = 0; i < t.length; i++) {
          const currentVal = inp.value + t[i];
          nativeSetter.call(inp, currentVal);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  }, title);
  console.log('✅ 제목 입력 완료');

  await page.waitForTimeout(1000);

  // === 본문 입력 ===
  // contenteditable 찾기
  const editorEl = await page.$('[contenteditable="true"]');
  if (editorEl) {
    await editorEl.focus();
    await page.waitForTimeout(500);

    // 한 줄씩 타이핑
    const lines = [
      '"편집을 어떻게 해결할까?"',
      '',
      '직접 하기엔 시간이 없고, 채용하기엔 비용이 부담스럽다.',
      '스타트업이라면 누구나 한 번쯤 하는 고민이다.',
      '',
      '대부분이 선택하는 두 가지 경로.',
      '',
      '프리랜서에게 건당 의뢰하거나,',
      '영상편집 월정액 서비스를 쓰거나.',
      '',
      '이 글에서 두 방식의 실제 비용과 운영 현실을 직접 비교한다.',
      '',
    ];

    for (const line of lines) {
      if (line === '') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(80);
      } else {
        await page.keyboard.type(line, { delay: 20 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(80);
      }
    }
    console.log('✅ 본문 1/5 입력');

    // 나머지 본문 줄바꿈
    const moreLines = [
      '──────────',
      '',
      '프리랜서 편집, 실제 비용은?',
      '',
      '월 10편 기준 → 50만~150만 원',
      '',
      '여기에 숨은 비용이 있다.',
      '',
      '❶ 편집자 교체 시마다 처음부터 브리핑 반복',
      '❷ 수정 2~3회 초과 시 추가 비용 발생',
      '❸ 납기 지연 시 광고·업로드 일정 전체 밀림',
      '',
      '눈에 보이지 않는 비용이 더 크다.',
    ];
    for (const line of moreLines) {
      if (line === '') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(50);
      } else {
        await page.keyboard.type(line, { delay: 15 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(50);
      }
    }
    console.log('✅ 본문 2/5 입력');

    // 발행 버튼 클릭
    const btns = await page.$$('button');
    for (const btn of btns) {
      const txt = await btn.innerText().catch(() => '');
      const vis = await btn.isVisible().catch(() => false);
      if (txt.trim() === '발행' && vis) {
        await btn.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('발행(툴바) 클릭');
        break;
      }
    }

    // 모달 발행 버튼
    await page.waitForTimeout(2000);
    let clickCount = 0;
    const btns2 = await page.$$('button');
    for (const btn of btns2) {
      const txt = await btn.innerText().catch(() => '');
      const vis = await btn.isVisible().catch(() => false);
      if (txt.trim() === '발행' && vis) {
        clickCount++;
        if (clickCount === 2) {
          await btn.click({ force: true });
          await page.waitForTimeout(3000);
          console.log('발행(모달) 클릭 ✅');
          break;
        }
      }
    }
  }

  // 결과 확인
  await page.waitForTimeout(2000);
  const result = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    let t = '';
    for (const inp of inputs) {
      if (inp.value && inp.value.length > 3) { t = inp.value.substring(0, 30); break; }
    }
    const eds = document.querySelectorAll('[contenteditable]');
    let body = '';
    for (const ed of eds) {
      const txt = ed.innerText || '';
      if (txt.length > body.length) body = txt;
    }
    return { title: t || '없음', bodyLen: body.length, bodyStart: body.substring(0, 100) };
  }).catch(() => ({}));
  console.log('\n=== 최종 확인 ===');
  console.log('제목:', result.title);
  console.log('본문:', result.bodyLen > 0 ? `${result.bodyLen}자` : '❌ 없음');
  if (result.bodyStart) console.log('시작:', result.bodyStart);

  try { await b.close(); } catch(e) {}
})();

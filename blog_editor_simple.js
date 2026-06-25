// 에디터 - 모바일 최적화 텍스트 작성
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(5000);
  } else {
    await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(5000);
  }

  ctx.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

  // === 1) 제목 입력 ===
  const titleText = '스타트업 CEO가 영상 PD 대신 월정기 편집을 선택한 이유';
  await page.evaluate((t) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes('제목')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  }, titleText);
  console.log('✅ 제목');

  await page.waitForTimeout(1000);

  // === 2) 본문 영역 찾아서 타이핑 ===
  // '글감과 함께' 텍스트가 보이는 영역 클릭
  const clickTargets = await page.$$('[class*="editor"], [class*="Editor"], [class*="content"], [class*="write"], .notranslate');
  console.log('에디터 영역 후보:', clickTargets.length);

  // placeholder 텍스트 영역 찾기
  const bodyText = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.innerText && el.innerText.includes('글감과 함께')) {
        return {
          tag: el.tagName,
          class: (el.className || '').substring(0, 80),
          id: el.id
        };
      }
    }
    return null;
  }).catch(() => null);
  console.log('Placeholder 위치:', bodyText);

  // '글감과 함께' 영역 클릭 시도
  const placeholderEls = await page.$$('[class*="empty"], [class*="placeholder"], [class*="guide"]');
  for (const el of placeholderEls) {
    const vis = await el.isVisible().catch(() => false);
    if (vis) {
      console.log('Placeholder 요소 클릭');
      await el.click();
      await page.waitForTimeout(1000);
      break;
    }
  }

  // contenteditable 찾아서 포커스
  const editor = await page.$('[contenteditable="true"]');
  if (editor) {
    // 강제로 focus
    await page.evaluate(() => {
      const ed = document.querySelector('[contenteditable="true"]');
      if (ed) {
        ed.focus();
        // focus 이벤트 발생
        ed.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      }
    }).catch(() => {});
    await page.waitForTimeout(1000);

    // 본문 입력 (모바일 최적화 - 간결하게)
    const bodyLines = [
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
      '이 글에서 두 방식의 실제 비용과',
      '운영 방식을 비교합니다.',
      '',
      '──────────',
      '',
      '프리랜서 편집, 실제 비용은?',
      '',
      '월 10편 기준 50만~150만 원.',
      '여기에 브리핑·수정·납기 리스크가 숨어 있다.',
      '',
      '──────────',
      '',
      '에이컷 월정액, 비용 구조는?',
      '',
      '월 4편 기준 49만 원~',
      '전담 에디터 · 수정 무제한 · D+1 납품',
      '',
      '──────────',
      '',
      '지금 바로 무료 상담 신청하세요.',
      '👉 aicut.co.kr',
    ];

    for (const line of bodyLines) {
      if (line === '') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(50);
      } else {
        await page.keyboard.type(line, { delay: 8 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(50);
      }
    }
    console.log('✅ 본문 타이핑 완료');
  }

  // === 확인 ===
  await page.waitForTimeout(1000);
  const result = await page.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    let body = '';
    for (const ed of eds) {
      const txt = ed.innerText || '';
      if (txt.length > body.length) body = txt;
    }
    return { len: body.length, preview: body.substring(0, 100) };
  }).catch(() => ({}));
  console.log('본문 확인:', result.len ? `✅ ${result.len}자` : '❌ 없음');
  if (result.preview) console.log('시작:', result.preview);

  try { await b.close(); } catch(e) {}
})();

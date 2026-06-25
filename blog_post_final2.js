// 블로그 에디터 v4 - clipboard paste 방식
const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '스타트업 CEO가 영상 PD 대신 월정기 편집을 선택한 이유';
const IMAGES = [
  'C:\\Users\\paul\\.openclaw\\workspace\\blog_thumb.png',
  'C:\\Users\\paul\\.openclaw\\workspace\\blog_content_img.png',
  'C:\\Users\\paul\\.openclaw\\workspace\\blog_content_img2.png'
];
const BODY_TEXT = `"편집을 어떻게 해결할까?"

직접 하기엔 시간이 없고, 채용하기엔 비용이 부담스럽다.
스타트업이라면 누구나 한 번쯤 하는 고민이다.

대부분이 선택하는 두 가지 경로.

프리랜서에게 건당 의뢰하거나,
영상편집 월정액 서비스를 쓰거나.

이 글에서 두 방식의 실제 비용과 운영 현실을 직접 비교한다.

──────────

프리랜서 편집, 실제 비용은?

월 10편 기준 → 50만~150만 원

여기에 숨은 비용이 있다.

❶ 편집자 교체 시마다 처음부터 브리핑 반복
❷ 수정 2~3회 초과 시 추가 비용 발생
❸ 납기 지연 시 광고·업로드 일정 전체 밀림

눈에 보이지 않는 비용이 더 크다.

──────────

에이컷 월정액, 비용 구조는?

월 4편 기준 → 약 49만 원~
편당 환산 시 → 약 12만 원 내외

여기에 포함되는 것들.

✔ 전담 에디터 고정 배정
✔ 브랜드 가이드 누적 저장
✔ 수정 무제한
✔ 48시간 납품 보장

──────────

월정액이 맞는 경우

· 월 4편 이상 정기 제작
· 납기가 콘텐츠 계획과 연동될 때
· 브랜드 품질 일관성이 중요할 때
· 편집에 시간을 너무 빼앗길 때

──────────

마무리

"편당 얼마"만으로 비용을 계산하면 안 된다.

납기 지연 비용, 브리핑 반복 시간, 품질 불일치 리스크까지 더하면
월정액의 실제 효율이 훨씬 높다.

──────────

지금 바로 무료 상담 신청하세요.
👉 aicut.co.kr`;

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // 기존 postwrite 탭 찾기
  let p = null;
  for (const page of ctx.pages()) {
    if (page.url().includes('postwrite')) {
      p = page;
      console.log('기존 postwrite 탭 사용');
      break;
    }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(5000);
  }

  // 새로고침 (초기화)
  await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.waitForTimeout(5000);
  console.log('URL:', p.url());

  // === 제목 입력 (네이티브 이벤트로 React 상태 변경) ===
  await p.evaluate((t) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.type === 'text' && inp.offsetParent !== null) {
        // React controlled input hack
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, TITLE);
  console.log('제목 입력 완료');

  await p.waitForTimeout(1000);

  // === 본문 입력 (clipboard paste 방식) ===
  // 에디터 영역 찾기 (보이지 않는 contenteditable)
  const editorBox = await p.$('[contenteditable="true"]');
  if (editorBox) {
    // clipboard API로 복사 후 붙여넣기
    await p.evaluate((text) => {
      // 클립보드에 저장
      navigator.clipboard.writeText(text).then(() => {
        console.log('clipboard write success');
      }).catch(() => {
        console.log('clipboard write failed');
      });
    }, BODY_TEXT).catch(() => {});

    await p.waitForTimeout(1000);

    // 에디터에 포커스 후 붙여넣기
    await editorBox.focus();
    await p.waitForTimeout(500);

    // Ctrl+V (Windows)
    await p.keyboard.press('Control+V');
    await p.waitForTimeout(2000);
    console.log('본문 붙여넣기 완료');
  } else {
    console.log('에디터 영역 찾을 수 없음');

    // 대체: React state 직접 조작 시도
    await p.evaluate((text) => {
      // 가장 큰 contenteditable 찾기
      const all = document.querySelectorAll('[contenteditable]');
      let target = null;
      for (const el of all) {
        if (el.innerHTML && el.innerHTML.includes('글감과 함께') || el.innerHTML.trim() === '' || el.innerHTML === '<br>') {
          target = el;
        }
      }
      if (!target) target = all[0];
      if (target) {
        target.focus();
        target.innerText = text;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        target.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    }, BODY_TEXT).catch(() => {});
    console.log('innerText 직접 설정 시도');
  }

  await p.waitForTimeout(1000);

  // 저장 버튼 클릭
  const btns = await p.$$('button');
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    if (txt.trim() === '저장') {
      const vis = await btn.isVisible().catch(() => false);
      if (vis) {
        await btn.click({ force: true }).catch(() => {});
        await p.waitForTimeout(2000);
        console.log('저장 버튼 클릭');
        break;
      }
    }
  }

  console.log('\n✅ 에디터 작성 완료! 브라우저에서 확인해주세요.');
  console.log('탭 위치: postwrite (blog.naver.com/aicut/postwrite)');
})();

// 네이버 블로그 에디터 - 새 탭에서 열기
const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '스타트업 CEO가 영상 PD 대신 월정기 편집을 선택한 이유';
const IMAGES = [
  'C:\\Users\\paul\\.openclaw\\workspace\\blog_thumb.png',
  'C:\\Users\\paul\\.openclaw\\workspace\\blog_content_img.png',
  'C:\\Users\\paul\\.openclaw\\workspace\\blog_content_img2.png'
];

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage(); // 새 탭

  // 다이얼로그 자동 dismiss
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  await p.goto('https://blog.naver.com/aicut/postwrite', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await p.waitForTimeout(4000);
  console.log('URL:', p.url());

  // 제목 입력
  await p.evaluate((t) => {
    const inp = document.querySelector('input[placeholder*="제목"], input.se_string_title, [title*="제목"]');
    if (inp) { inp.value = t; return true; }
    // React input - set native value
    const inputs = document.querySelectorAll('input');
    for (const i of inputs) {
      if (i.type === 'text' && i.offsetParent !== null) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(i, t);
        i.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, TITLE).then(r => console.log('제목:', r ? '입력됨' : '못찾음')).catch(() => {});

  // 에디터 찾아서 텍스트 입력 (React 에디터 대응)
  await p.waitForTimeout(2000);

  // 모든 에디터 영역 선택자 시도
  const editors = await p.$$('[contenteditable="true"], [contenteditable="plaintext-only"], .notranslate, [role="textbox"]');
  console.log(`에디터 요소: ${editors.length}개`);
  
  let typed = false;
  for (const ed of editors) {
    const tag = await ed.evaluate(el => el.tagName + '.' + (el.className || '').substring(0, 50)).catch(() => '?');
    const isVisible = await ed.isVisible().catch(() => false);
    console.log(`  ${tag} visible=${isVisible}`);
    
    if (isVisible && !typed) {
      await ed.click();
      await p.waitForTimeout(500);
      
      // 내용 초기화
      await ed.evaluate(el => el.innerHTML = '');
      await p.waitForTimeout(300);
      
      // 각 줄 입력
      const text = `"편집을 어떻게 해결할까?"
      
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

      await p.keyboard.type(text, { delay: 5 });
      await p.waitForTimeout(1000);
      typed = true;
      console.log('본문 타이핑 완료');
    }
  }

  if (!typed) {
    console.log('에디터에 직접 입력 실패 — 복사/붙여넣기 시도');
    // 시도: innerHTML 설정
    const htmlContent = '<p>"편집을 어떻게 해결할까?"</p><p><br></p><p>직접 하기엔 시간이 없고, 채용하기엔 비용이 부담스럽다.</p><p>스타트업이라면 누구나 한 번쯤 하는 고민이다.</p><p><br></p><p>대부분이 선택하는 두 가지 경로.</p><p><br></p><p>프리랜서에게 건당 의뢰하거나,</p><p>영상편집 월정액 서비스를 쓰거나.</p><p><br></p><p>이 글에서 두 방식의 실제 비용과 운영 현실을 직접 비교한다.</p>';
    await p.evaluate((html) => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) editor.innerHTML = html;
    }, htmlContent).catch(() => {});
  }

  // 이미지 업로드
  await p.waitForTimeout(1000);
  
  // 사진 추가 버튼 클릭 → 파일 input 활성화
  const btns = await p.$$('button');
  let clicked = false;
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    if ((txt.trim() === '사진' || txt.trim() === '사진 추가') && !clicked) {
      await btn.click();
      await p.waitForTimeout(3000);
      clicked = true;
      console.log('사진 추가 버튼 클릭');
    }
  }

  // 파일 input 찾아서 업로드
  let fileInput = await p.$('input[type="file"]');
  if (fileInput) {
    for (const imgPath of IMAGES) {
      if (fs.existsSync(imgPath)) {
        await fileInput.setInputFiles(imgPath).catch(e => console.log(`업로드 오류: ${e.message.substring(0, 50)}`));
        await p.waitForTimeout(3000);
        console.log(`이미지: ${imgPath.split('\\').pop()}`);
      }
    }
  } else {
    console.log('파일 input 없음');
  }

  console.log('\n✅ 에디터 준비 — 브라우저 새 탭에서 확인해주세요!');
})();

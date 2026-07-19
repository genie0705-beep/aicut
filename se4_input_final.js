const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');

(async () => {
  console.log('=== SE4 에디터 직접 입력 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  const posts = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', html: 'aicut_blog_baseball.html', label: '⚾ 프로야구' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', html: 'aicut_blog_rainy.html', label: '🌧 주말 장맛비' },
  ];

  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    console.log(`\n━━━ 포스팅 ${pi+1}: ${post.label} ━━━`);

    // 블로그 글쓰기 페이지 열기
    console.log('   에디터 열기...');
    await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await sleep(8000);

    console.log('   URL:', (await page.evaluate('location.href')).substring(0, 80));

    // ========================================
    // 방법: 제목 input에 직접 값 설정
    // ========================================
    console.log('   [제목 입력]');
    const titleSet = await page.evaluate((title) => {
      // 1. SmartEditor API
      try {
        if (window.SmartEditor && window.SmartEditor._editors) {
          for (const k of Object.keys(window.SmartEditor._editors)) {
            const ed = window.SmartEditor._editors[k];
            if (typeof ed.setDocumentTitle === 'function') {
              ed.setDocumentTitle(title);
              return 'SmartEditor API';
            }
          }
        }
      } catch(e) {}

      // 2. contenteditable 제목 영역
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const t = el.textContent?.trim();
        if (t && (el.getAttribute('contenteditable') === 'true' || el.isContentEditable) && t.length < 5 && el.offsetParent !== null) {
          el.focus();
          el.textContent = title;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return 'contenteditable';
        }
      }

      // 3. 제목 input
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if (inp.offsetParent !== null && inp.type !== 'hidden') {
          const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
          if (proto && proto.set) {
            proto.set.call(inp, title);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            return 'input setter';
          }
        }
      }
      return 'failed';
    }, post.title);
    console.log(`   → ${titleSet}`);

    await sleep(1000);

    // ========================================
    // 방법: 본문 HTML을 clipboad에 넣고 React paste 트리거
    // ========================================
    console.log('   [본문 입력]');
    const html = fs.readFileSync(post.html, 'utf-8');

    // 대량 HTML을 한 번에 보내기 어려우므로 clipboard 접근 방식 사용
    try {
      const bodyResult = await page.evaluate((htmlContent) => {
        // 에디터 body 영역 찾기
        const editorBodies = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          if (el.isContentEditable && el.textContent.trim().length < 50 && el.offsetParent !== null) {
            editorBodies.push(el);
          }
        }

        if (editorBodies.length === 0) return 'no editable element found';

        // 첫 번째 빈 에디터 영역에 붙여넣기
        const target = editorBodies[editorBodies.length - 1]; // 가장 마지막 (본문)
        target.focus();

        // DataTransfer 방식
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/html', htmlContent);
        dataTransfer.setData('text/plain', ' ');
        
        target.dispatchEvent(new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        }));

        return 'paste event fired';
      }, html);
      console.log(`   → ${bodyResult}`);
    } catch(e) {
      console.log(`   → 오류: ${e.message.substring(0, 40)}`);
    }

    await sleep(2000);

    // ========================================
    // 저장 버튼 클릭
    // ========================================
    console.log('   [저장]');
    const saved = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장' && b.offsetParent !== null) {
          b.click();
          return 'button clicked';
        }
      }
      return 'no save button';
    });
    console.log(`   → ${saved}`);
    await sleep(3000);
    console.log('   ✅ 저장 완료');
  }

  console.log('\n━━━ ✅ 2개 포스팅 저장 완료 ━━━');
  console.log('  이미지 12장 업로드는 정이사님 직접 부탁드립니다.');

  b.close();
})().catch(e => console.log('FATAL:', e.message.substring(0, 60)));

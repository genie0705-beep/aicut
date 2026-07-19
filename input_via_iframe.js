const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=== iframe PostWriteForm 에디터 입력 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 글쓰기 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com/aicut') && p.url().includes('Write')) {
      page = p;
      break;
    }
  }
  if (!page) {
    console.log('❌ 글쓰기 탭 없음, 새로 엽니다...');
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(4000);
  }

  await page.bringToFront();
  await sleep(3000);

  // PostWriteForm iframe 찾기
  const writeFrame = page.frames().find(f => f.url().includes('PostWriteForm'));
  if (!writeFrame) {
    console.log('❌ PostWriteForm iframe 없음');
    // 모든 프레임 출력
    page.frames().forEach((f, i) => {
      const u = f.url();
      if (u !== 'about:blank') console.log(`  [${i}] ${u.substring(0, 100)}`);
    });
    b.close();
    return;
  }
  console.log('✅ PostWriteForm iframe 발견:', writeFrame.url().substring(0, 80));

  // iframe 내부 에디터 상태 확인
  const editorInfo = await writeFrame.evaluate(() => {
    const r = {};
    r.hasSmartEditor = typeof SmartEditor !== 'undefined';
    r.hasSE = typeof SE !== 'undefined';
    r.bodyId = document.body.id;
    r.bodyClass = document.body.className;
    
    // 모든 contenteditable
    r.editables = [];
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
      r.editables.push({ id: el.id, tag: el.tagName, cls: el.className.substring(0, 40), text: el.textContent.trim().substring(0, 20) });
    });

    // 모든 input
    r.inputs = [];
    document.querySelectorAll('input:not([type="hidden"])').forEach(el => {
      r.inputs.push({ id: el.id, placeholder: el.placeholder, value: el.value.substring(0, 20) });
    });

    // buttons
    r.buttons = [];
    document.querySelectorAll('button, a[role="button"]').forEach(el => {
      r.buttons.push({ text: el.textContent.trim().substring(0, 20) });
    });

    // SmartEditor 객체
    if (r.hasSmartEditor && SmartEditor._editors) {
      r.editorKeys = Object.keys(SmartEditor._editors);
    }

    // textarea
    r.textareas = [];
    document.querySelectorAll('textarea').forEach(el => {
      r.textareas.push({ id: el.id, name: el.name });
    });

    // iframe inside iframe
    r.innerIframes = [];
    document.querySelectorAll('iframe').forEach(f => {
      r.innerIframes.push({ id: f.id, src: (f.src || '').substring(0, 80) });
    });

    return r;
  });

  console.log('\n=== iframe 에디터 상태 ===');
  console.log(JSON.stringify(editorInfo, null, 2));

  const posts = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', html: 'aicut_blog_baseball.html', label: '⚾ 프로야구' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', html: 'aicut_blog_rainy.html', label: '🌧 주말 장맛비' },
  ];

  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    console.log(`\n━━━ 포스팅 ${pi+1}: ${post.label} ━━━`);

    // 제목 입력 - SmartEditor API
    const titleResult = await writeFrame.evaluate((title) => {
      // SmartEditor API
      if (typeof SmartEditor !== 'undefined') {
        if (SmartEditor._editors) {
          for (const k of Object.keys(SmartEditor._editors)) {
            const ed = SmartEditor._editors[k];
            if (typeof ed.setDocumentTitle === 'function') {
              ed.setDocumentTitle(title);
              return 'API: setDocumentTitle';
            }
          }
        }
        // SmartEditor API v2
        if (typeof SmartEditor.setTitle === 'function') {
          SmartEditor.setTitle(title);
          return 'API: setTitle';
        }
      }
      // contenteditable title 찾기
      const editables = document.querySelectorAll('[contenteditable="true"]');
      for (const el of editables) {
        if (el.textContent.trim() === '' && el.offsetParent !== null) {
          el.focus();
          el.textContent = title;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return 'contenteditable';
        }
      }
      // 입력 필드
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      for (const inp of inputs) {
        if (inp.offsetParent !== null) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
          if (setter && setter.set) {
            setter.set.call(inp, title);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            return 'input setter';
          }
        }
      }
      return 'failed';
    }, post.title);
    console.log(`   제목: ${titleResult}`);

    await sleep(1000);

    // 본문 입력
    const htmlPath = path.join(__dirname, post.html);
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    console.log(`   HTML 크기: ${(htmlContent.length/1024).toFixed(0)}KB`);
    const bodyResult = await writeFrame.evaluate((html) => {
      // SmartEditor API
      if (typeof SmartEditor !== 'undefined') {
        if (SmartEditor._editors) {
          for (const k of Object.keys(SmartEditor._editors)) {
            const ed = SmartEditor._editors[k];
            if (typeof ed.setDocumentData === 'function') {
              ed.setDocumentData(html);
              console.log('setDocumentData called, length:', html.length);
          ed.setDocumentData(html);
          return 'API: setDocumentData';
          }
        }
        if (typeof SmartEditor.setContents === 'function') {
          SmartEditor.setContents(html);
          return 'API: setContents';
        }
      }
      // contenteditable 본문에 paste
      const editables = document.querySelectorAll('[contenteditable="true"]');
      for (const el of editables) {
        if (el.offsetParent !== null) {
          const dt = new DataTransfer();
          dt.setData('text/html', html);
          el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
          return 'paste to contenteditable';
        }
      }
      return 'failed';
    }, htmlContent);
    console.log(`   본문: ${bodyResult}`);

    await sleep(2000);

    // 저장
    const saveResult = await writeFrame.evaluate(() => {
      const all = document.querySelectorAll('button, a[role="button"], span[role="button"]');
      for (const el of all) {
        if (el.textContent.trim() === '저장' && el.offsetParent !== null) {
          el.click();
          return 'clicked';
        }
      }
      return 'no button';
    });
    console.log(`   저장: ${saveResult}`);
    await sleep(2000);

    // 새 글쓰기 (for post 2)
    if (pi === 0) {
      console.log('\n   새 글쓰기 페이지 열기...');
      await page.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await sleep(5000);
      
      // 새 iframe 찾기
      const newFrame = page.frames().find(f => f.url().includes('PostWriteForm'));
      if (newFrame) {
        console.log('   ✅ 새 에디터 iframe 로딩됨');
        // writeFrame 변수 교체 - 재할당 불가능하니 마지막 루프에서 break
        break;
      }
    }
  }

  console.log('\n━━━ ✅ 입력 완료 ━━━');
  console.log('  이미지 업로드는 정이사님 직접 부탁드립니다!');

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

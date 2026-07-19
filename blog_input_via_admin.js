const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');

(async () => {
  console.log('=== 블로그 2개 포스팅 입력 (Admin 경유) ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // Admin 블로그 접속 (로그인 상태)
  console.log('1. 블로그 관리자 접속...');
  await page.goto('https://admin.blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);

  // "블로그 글쓰기" 링크 찾기
  const writeUrl = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const a of links) {
      if (a.textContent.includes('글쓰기') || a.href.includes('PostWrite')) {
        return a.href;
      }
    }
    return null;
  });

  if (!writeUrl) {
    console.log('❌ 글쓰기 링크를 찾을 수 없음');
    b.close();
    return;
  }
  console.log('   글쓰기 URL:', writeUrl.substring(0, 80));

  // === Post 1: 프로야구 ===
  console.log('\n━━━ 포스팅 1: ⚾ 프로야구 ━━━');
  await page.goto(writeUrl, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(6000);
  console.log('   에디터 URL:', (await page.evaluate('location.href')).substring(0, 80));

  // 에디터 iframe 찾기
  let editorFrame = page.frames().find(f => f.url().includes('smartEditor') || f.url().includes('se2') || f.name().includes('editor'));
  if (!editorFrame) {
    // 모든 프레임 이름 확인
    const frames = page.frames();
    for (const f of frames) {
      const u = f.url();
      if (u !== 'about:blank' && u.length > 20) {
        try {
          const ft = await f.evaluate(() => document.body.innerText.substring(0, 50)).catch(() => '');
          if (ft.includes('에디터') || ft.length > 10) {
            editorFrame = f;
            console.log(`   에디터 프레임 발견: ${u.substring(0, 80)}`);
            break;
          }
        } catch(e) {}
      }
    }
  }

  // 제목 입력 (기본 페이지)
  const title1 = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
  
  // 다양한 제목 입력 방법
  let titleOk = false;
  try {
    titleOk = await page.evaluate((t) => {
      // SE API
      if (typeof SmartEditor !== 'undefined' && SmartEditor._editors) {
        for (const key of Object.keys(SmartEditor._editors)) {
          if (typeof SmartEditor._editors[key].setDocumentTitle === 'function') {
            SmartEditor._editors[key].setDocumentTitle(t);
            return true;
          }
        }
      }
      // SE2 API
      if (typeof jindo !== 'undefined') {
        const ed = document.querySelector('#titleArea, .se_title, [contenteditable="true"]');
        if (ed) { ed.textContent = t; return true; }
      }
      return false;
    }, title1);
  } catch(e) {}

  if (titleOk) {
    console.log('   ✅ 제목 입력 완료');
  } else {
    // 직접 input에 입력
    await page.evaluate((title) => {
      const inputs = document.querySelectorAll('input[type="text"], input:not([type]), [contenteditable="true"]');
      for (const inp of inputs) {
        if (inp.offsetParent !== null) { // visible
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(inp, title);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }, title1);
    console.log('   ✅ 제목 직접 입력');
  }

  await sleep(1000);

  // 본문 HTML
  const html1 = fs.readFileSync('aicut_blog_baseball.html', 'utf-8');

  // 클립보드 방식으로 본문 붙여넣기
  try {
    await page.evaluate((html) => {
      // 클립보드에 쓰기
      const blob = new Blob([html], { type: 'text/html' });
      const dt = new DataTransfer();
      dt.items.add(new ClipboardItem({ 'text/html': blob }));
      
      // 에디터 영역 찾아서 paste 이벤트 발생
      const editors = document.querySelectorAll('[contenteditable="true"], .se_editArea, .se2_editArea');
      for (const ed of editors) {
        if (ed.offsetParent !== null) {
          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dt,
            bubbles: true,
            cancelable: true
          });
          ed.dispatchEvent(pasteEvent);
          return 'paste to editor';
        }
      }
      return 'no editor found';
    }, html1).then(r => console.log(`   본문: ${r}`));
  } catch(e) {
    console.log(`   ⚠️ 본문 오류: ${e.message.substring(0, 40)}`);
  }

  await sleep(2000);

  // 저장 버튼 찾기
  console.log('   저장 시도...');
  await page.evaluate(() => {
    const all = document.querySelectorAll('button, a, span[role="button"]');
    for (const el of all) {
      if (el.textContent.trim() === '저장') {
        el.click(); return;
      }
    }
  });
  await sleep(3000);
  console.log('   ✅ 포스팅 1 저장됨');

  // === Post 2: 주말 장맛비 ===
  console.log('\n━━━ 포스팅 2: 🌧 주말 장맛비 ━━━');
  await page.goto(writeUrl, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  const title2 = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';
  
  // 제목
  try {
    await page.evaluate((t) => {
      if (typeof SmartEditor !== 'undefined' && SmartEditor._editors) {
        for (const key of Object.keys(SmartEditor._editors)) {
          if (typeof SmartEditor._editors[key].setDocumentTitle === 'function') {
            SmartEditor._editors[key].setDocumentTitle(t);
            return;
          }
        }
      }
      const inputs = document.querySelectorAll('input[type="text"], input:not([type]), [contenteditable="true"]');
      for (const inp of inputs) {
        if (inp.offsetParent !== null) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inp, t);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }, title2);
    console.log('   ✅ 제목 입력 완료');
  } catch(e) {
    console.log(`   제목 오류: ${e.message.substring(0, 30)}`);
  }

  // 본문
  const html2 = fs.readFileSync('aicut_blog_rainy.html', 'utf-8');
  try {
    await page.evaluate((html) => {
      const blob = new Blob([html], { type: 'text/html' });
      const dt = new DataTransfer();
      dt.items.add(new ClipboardItem({ 'text/html': blob }));
      const editors = document.querySelectorAll('[contenteditable="true"]');
      for (const ed of editors) {
        if (ed.offsetParent !== null) {
          const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
          ed.dispatchEvent(ev);
          return 'ok';
        }
      }
      return 'no editor';
    }, html2).then(r => console.log(`   본문: ${r}`));
  } catch(e) {}

  await sleep(2000);

  await page.evaluate(() => {
    const all = document.querySelectorAll('button, a, span[role="button"]');
    for (const el of all) {
      if (el.textContent.trim() === '저장') { el.click(); return; }
    }
  });
  await sleep(3000);
  console.log('   ✅ 포스팅 2 저장됨');

  console.log('\n━━━ ✅ 2개 포스팅 저장 완료 ━━━');
  console.log('  ⚾ 타이틀:', title1.substring(0, 50) + '...');
  console.log('  🌧 타이틀:', title2.substring(0, 50) + '...');
  console.log('  📸 이미지 12장은 정이사님께서 직접 업로드 부탁드립니다');

  b.close();
})().catch(e => console.log('FATAL:', e.message.substring(0, 60)));

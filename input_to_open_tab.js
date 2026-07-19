const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');

(async () => {
  console.log('=== 열린 블로그 탭에 입력 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 글쓰기 관련 탭 찾기
  let writePage = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url.includes('PostWrite') || url.includes('Redirect=Write') || (url.includes('blog.naver.com/aicut') && url.includes('Write'))) {
      writePage = p;
      console.log('✅ 글쓰기 탭 발견:', url.substring(0, 90));
      break;
    }
  }

  if (!writePage) {
    console.log('❌ 글쓰기 탭 없음');
    b.close();
    return;
  }

  await writePage.bringToFront();
  await sleep(3000);

  // 현재 URL 확인
  const currentUrl = await writePage.evaluate('location.href');
  console.log('현재 URL:', currentUrl.substring(0, 100));

  // 에디터 상태 확인
  const editorState = await writePage.evaluate(() => {
    const result = {};
    result.hasSmartEditor = typeof SmartEditor !== 'undefined';
    result.hasSE = typeof SE !== 'undefined';
    result.hasjindo = typeof jindo !== 'undefined';
    result.bodyId = document.body.id;
    result.bodyClass = document.body.className;
    
    // contenteditable 요소 찾기
    const editables = [];
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
      editables.push({
        id: el.id,
        tag: el.tagName,
        cls: el.className.substring(0, 40),
        text: el.textContent.trim().substring(0, 30),
        visible: el.offsetParent !== null
      });
    });
    result.editables = editables;

    // input 요소
    const inputs = [];
    document.querySelectorAll('input:not([type="hidden"])').forEach(el => {
      inputs.push({
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
        value: el.value.substring(0, 20),
        visible: el.offsetParent !== null
      });
    });
    result.inputs = inputs.slice(0, 10);

    // 버튼
    const btns = [];
    document.querySelectorAll('button').forEach(el => {
      btns.push({
        text: el.textContent.trim().substring(0, 20),
        visible: el.offsetParent !== null
      });
    });
    result.buttons = btns.slice(0, 10);

    // iframe
    const iframes = [];
    document.querySelectorAll('iframe').forEach(f => {
      iframes.push({ id: f.id, src: (f.src || '').substring(0, 80) });
    });
    result.iframes = iframes;

    return result;
  });

  console.log('\n=== 에디터 상태 ===');
  console.log(JSON.stringify(editorState, null, 2));

  // 글쓰기 페이지가 PostWrite로 리다이렉트 안 되어 있으면 이동
  if (!currentUrl.includes('PostWrite') && !currentUrl.includes('smartEditor')) {
    console.log('\nPostWrite 페이지로 이동...');
    await writePage.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await sleep(5000);
    console.log('URL:', (await writePage.evaluate('location.href')).substring(0, 100));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

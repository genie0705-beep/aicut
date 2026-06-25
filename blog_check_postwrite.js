const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  // PostWriteForm 탭 찾기
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') || p.url().includes('PostWrite')) {
      targetPage = p;
      console.log('✅ PostWriteForm 탭 발견:', p.url());
      break;
    }
  }

  if (!targetPage) {
    // 새로 열기
    console.log('새 탭 열기...');
    targetPage = await ctx.newPage();
    await targetPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }

  await targetPage.waitForTimeout(5000);
  console.log('현재 URL:', targetPage.url());
  
  // SmartEditor 확인
  const editorInfo = await targetPage.evaluate(() => {
    const hasSE = typeof window.SmartEditor !== 'undefined';
    const seKeys = window.SmartEditor?._editors ? Object.keys(window.SmartEditor._editors) : [];
    const iframes = document.querySelectorAll('iframe');
    const iframeList = Array.from(iframes).map(f => ({ id: f.id, title: f.title, name: f.name, src: (f.src || '').substring(0, 80) }));
    
    // 제목 입력 필드
    const titleInputs = document.querySelectorAll('input[type="text"]');
    const titles = Array.from(titleInputs).map(i => ({ id: i.id, name: i.name, placeholder: i.placeholder, class: i.className?.substring(0,40) }));
    
    return { hasSE, seKeys, iframeList, titles, bodyText: document.body.innerText.substring(0, 500) };
  });
  console.log('에디터 정보:', JSON.stringify(editorInfo, null, 2));

  await b.close();
})();

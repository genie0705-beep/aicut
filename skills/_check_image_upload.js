const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 기존 postwrite 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite') || p.url().includes('aicut/postwrite')) {
      page = p;
      console.log('기존 postwrite 탭 발견:', p.url());
      break;
    }
  }
  
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    console.log('새 탭 열기:', page.url());
  }
  
  // 현재 에디터 내용 확인
  const editorState = await page.evaluate(() => {
    const seContent = document.querySelector('.se-content.__se-scroll-target');
    if (!seContent) return { error: 'no .se-content' };
    return {
      textPresent: seContent.innerText?.includes('부동산'),
      htmlLen: seContent.innerHTML.length,
      imgTags: (seContent.innerHTML.match(/<img/g) || []).length,
      firstImg: seContent.innerHTML.includes('aicut_blog')
    };
  });
  console.log('에디터 상태:', JSON.stringify(editorState, null, 2));
  
  // 이미지 업로드 방식 테스트: 사진 버튼 찾기
  const uploadBtnInfo = await page.evaluate(() => {
    // 사진 업로드 관련 버튼 찾기
    const buttons = [];
    document.querySelectorAll('button, a, span, div').forEach(el => {
      const text = (el.innerText || el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
      const cls = typeof el.className === 'string' ? el.className.slice(0,60) : '';
      if (text.includes('사진') || text.includes('이미지') || text.includes('image') || text.includes('photo') || cls.includes('photo') || cls.includes('image') || cls.includes('picture')) {
        buttons.push({ tag: el.tagName, text: text.slice(0,30), cls, id: el.id });
      }
    });
    return buttons;
  });
  console.log('사진 관련 버튼:', JSON.stringify(uploadBtnInfo, null, 2));
  
  // 에디터 툴바 확인  
  const toolbar = await page.evaluate(() => {
    // SE4 툴바 영역
    const toolbarEl = document.querySelector('.blog_editor') || document.querySelector('[class*="toolbar"]') || document.querySelector('[class*="tool"]');
    if (toolbarEl) {
      return {
        cls: typeof toolbarEl.className === 'string' ? toolbarEl.className.slice(0,100) : '',
        buttons: Array.from(toolbarEl.querySelectorAll('button')).slice(0,15).map(b => ({
          text: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0,20),
          cls: typeof b.className === 'string' ? b.className.slice(0,40) : '',
        }))
      };
    }
    return 'no toolbar';
  });
  console.log('툴바:', JSON.stringify(toolbar, null, 2));
  
  // 파일 업로드 input 찾기
  const fileInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="file"]')).map(el => ({
      id: el.id,
      cls: typeof el.className === 'string' ? el.className.slice(0,60) : '',
      accept: el.getAttribute('accept'),
      hidden: el.offsetParent === null,
    }));
  });
  console.log('파일 input:', JSON.stringify(fileInputs, null, 2));
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

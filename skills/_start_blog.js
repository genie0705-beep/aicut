// 네이버 블로그 작성 시작 — 탭 확인 및 글쓰기 진입
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 1. 현재 열린 탭 모두 확인
  const pages = ctx.pages();
  console.log('전체 탭:', pages.length, '개');
  
  // 이미 있는 탭 중 blog 확인
  let blogPage = null;
  for (const p of pages) {
    const url = p.url();
    if (url.includes('blog.naver.com')) {
      blogPage = p;
      console.log('기존 블로그 탭 발견:', url.slice(0, 100));
      break;
    }
  }
  
  // 없으면 새 탭 열기
  if (!blogPage) {
    blogPage = await ctx.newPage();
    console.log('새 탭 생성');
  }
  
  // 2. 블로그 관리 페이지로 이동
  console.log('블로그 글쓰기 페이지로 이동...');
  await blogPage.goto('https://blog.naver.com/aicut/223321668804?viewType=pc', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await blogPage.waitForTimeout(5000);
  
  console.log('현재 URL:', blogPage.url());
  
  // 3. 에디터 확인 — 글쓰기 버튼 찾기
  const writeBtn = await blogPage.evaluate(() => {
    // 글쓰기 버튼 찾기 (네이버 블로그 로고 옆)
    const links = document.querySelectorAll('a');
    for (const a of links) {
      const text = a.innerText.trim();
      if (text === '글쓰기' || text === '글 작성') {
        return a.href;
      }
    }
    return null;
  });
  
  console.log('글쓰기 버튼 URL:', writeBtn);
  
  // 4. 직접 글쓰기 URL로 이동
  // 네이버 블로그 SmartEditor 글쓰기 URL
  await blogPage.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut&viewType=pc', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await blogPage.waitForTimeout(5000);
  
  console.log('글쓰기 페이지 URL:', blogPage.url());
  
  // 5. 에디터 상태 확인
  const editorState = await blogPage.evaluate(() => {
    const result = {};
    
    // SmartEditor SE4 체크
    if (window.SmartEditor) {
      result.SmartEditor = true;
      result.editorVersion = window.SmartEditor.version || '?';
    } else {
      result.SmartEditor = false;
    }
    
    // DOM 에디터 체크
    const iframes = document.querySelectorAll('iframe');
    result.iframes = iframes.length;
    
    const seEditAreas = document.querySelectorAll('[contenteditable="true"]');
    result.contentEditable = seEditAreas.length;
    
    // 제목 입력창 찾기
    const titleInput = document.querySelector('input[name="title"], #title, [placeholder*="제목"]');
    result.titleInput = titleInput ? (titleInput.id || titleInput.name || 'found') : 'none';
    
    // SE4 에디터
    const editorDiv = document.querySelectorIfExists ? 'has_querySelectorIfExists' : 'no';
    
    return result;
  });
  
  console.log('에디터 상태:', JSON.stringify(editorState, null, 2));
  
  // 스크린샷
  await blogPage.screenshot({ path: 'debug_blog_start.png', fullPage: true });
  console.log('스크린샷 저장: debug_blog_start.png');
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
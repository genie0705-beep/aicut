// 네이버 블로그 글쓰기 — 기존 탭 활용
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 기존 탭 확인
  const pages = ctx.pages();
  console.log('전체 탭:', pages.length);
  
  let blogPage = null;
  for (const p of pages) {
    const url = p.url();
    console.log('  탭:', url.slice(0, 120));
    if (url.includes('blog.naver.com')) {
      blogPage = p;
    }
  }
  
  if (blogPage) {
    console.log('\n기존 블로그 탭 사용');
    
    // dialog 자동 수락
    blogPage.on('dialog', async dialog => {
      console.log('  dialog:', dialog.message().slice(0, 50));
      await dialog.accept();
    });
    
    // 현재 페이지 확인
    const url = blogPage.url();
    console.log('현재 URL:', url);
    
    if (url.includes('PostWrite.nhn') || url.includes('Redirect=Write')) {
      console.log('✅ 이미 글쓰기 페이지에 있습니다');
    }
    
    // 제목 입력
    await blogPage.waitForTimeout(2000);
    
    // SmartEditor API 확인
    const editorInfo = await blogPage.evaluate(() => {
      const info = {};
      info.hasEditor = !!window.SmartEditor;
      info.editors = window.SmartEditor ? Object.keys(window.SmartEditor._editors || {}) : [];
      info.titleEl = document.querySelector('#title, [name="title"], input.title');
      info.titleTag = info.titleEl ? info.titleEl.tagName + (info.titleEl.id ? '#'+info.titleEl.id : '') : null;
      info.contentEditable = document.querySelectorAll('[contenteditable]').length;
      info.iframes = document.querySelectorAll('iframe').length;
      
      // iframe 정보
      const iframeInfo = [];
      document.querySelectorAll('iframe').forEach(f => {
        iframeInfo.push({
          id: f.id || 'no-id',
          src: (f.src || '').slice(0, 80)
        });
      });
      info.iframeList = iframeInfo;
      
      return info;
    });
    
    console.log('\n에디터 정보:', JSON.stringify(editorInfo, null, 2));
    
    // 스크린샷
    await blogPage.screenshot({ path: 'debug_blog_editor.png', fullPage: false });
    console.log('\n스크린샷: debug_blog_editor.png');
    
  } else {
    console.log('블로그 탭 없음 → 새로 열기');
    const p = await ctx.newPage();
    p.on('dialog', async dialog => {
      console.log('  dialog:', dialog.message().slice(0, 50));
      await dialog.accept();
    });
    await p.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    await p.waitForTimeout(5000);
    console.log('URL:', p.url());
    await p.screenshot({ path: 'debug_blog_editor.png', fullPage: false });
  }
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));
// 네이버 블로그 — 글쓰기 페이지 이동 + 제목 입력 + 본문 붙여넣기
const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // blog 탭 찾기
  let blogPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com')) {
      blogPage = p;
      // dialog 자동 처리
      p.on('dialog', async d => { await d.accept(); });
      break;
    }
  }
  
  if (!blogPage) {
    console.log('블로그 탭 없음, 새로 생성');
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async d => { await d.accept(); });
  }
  
  // 글쓰기 페이지로 이동 (강제)
  console.log('✏️ 글쓰기 페이지로 이동...');
  await blogPage.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await blogPage.waitForTimeout(5000);
  
  console.log('URL:', blogPage.url());
  
  // 에디터 상태 확인
  const info = await blogPage.evaluate(() => {
    const r = {};
    r.hasEditor = !!window.SmartEditor;
    r.editors = window.SmartEditor ? Object.keys(window.SmartEditor._editors || []) : [];
    r.titleInput = document.querySelector('#title, input.title, [name="title"]') ? 'found' : 'none';
    r.contentEditable = document.querySelectorAll('[contenteditable]').length;
    r.iframes = document.querySelectorAll('iframe').length;
    
    // iframe 세부 정보
    r.frames = [];
    document.querySelectorAll('iframe').forEach(f => {
      r.frames.push({ id: f.id || '-', src: (f.src || '').slice(0, 80) });
    });
    
    // SE4 에디터
    if (window.SmartEditor && window.SmartEditor._editors) {
      r.editorIds = Object.keys(window.SmartEditor._editors);
      for (const k of r.editorIds) {
        const ed = window.SmartEditor._editors[k];
        r[k + '_type'] = typeof ed;
        r[k + '_keys'] = Object.keys(ed || {}).slice(0, 10);
      }
    }
    
    return r;
  });
  
  console.log('\n에디터 상태:', JSON.stringify(info, null, 2));
  
  // 스크린샷
  await blogPage.screenshot({ path: 'debug_blog_write.png', fullPage: false });
  console.log('\n스크린샷: debug_blog_write.png');
  
  await b.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
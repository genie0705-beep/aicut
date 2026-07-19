// 네이버 블로그 → SE4 글쓰기 페이지 진입
const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let blogPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com')) {
      blogPage = p;
      p.on('dialog', async d => { await d.accept(); });
      break;
    }
  }
  if (!blogPage) {
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async d => { await d.accept(); });
  }
  
  // 글쓰기 페이지로 이동
  console.log('1. 글쓰기 페이지 이동...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await blogPage.waitForTimeout(8000);
  
  console.log('   URL:', blogPage.url());
  
  // 현재 페이지 상태 확인
  const pageInfo = await blogPage.evaluate(() => {
    const r = {};
    r.url = location.href;
    r.hasEditor = !!window.SmartEditor;
    r.se4Api = typeof window.SmartEditor_Utils !== 'undefined';
    r.title = document.querySelector('#title, input.title, [name="title"]') ? 'found' : 'none';
    r.contentEditable = document.querySelectorAll('[contenteditable]').length;
    r.iframes = document.querySelectorAll('iframe').length;
    
    // iframe 목록
    r.frames = [];
    document.querySelectorAll('iframe').forEach(f => {
      r.frames.push({ id: f.id || '-', src: (f.src || '').slice(0, 120) });
    });
    
    // textarea / editor div
    r.textareas = document.querySelectorAll('textarea').length;
    r.editorDIV = document.querySelectorAll('div.se-editor, div[data-editor]').length;
    
    // SmartEditor 전역
    if (window.SmartEditor) {
      const SE = window.SmartEditor;
      r.SE_keys = Object.keys(SE).slice(0, 10);
      if (SE._editors) {
        r.editorIds = Object.keys(SE._editors);
        for (const id of r.editorIds) {
          r[id + '_api'] = typeof SE._editors[id];
          r[id + '_methods'] = Object.keys(SE._editors[id]).slice(0, 15);
        }
      }
    }
    
    // HTML body의 첫 500자
    r.bodyText = (document.body.innerText || '').slice(0, 500);
    
    return r;
  });
  
  console.log('\n2. 페이지 정보:');
  console.log(JSON.stringify(pageInfo, null, 2));
  
  // 스크린샷
  await blogPage.screenshot({ path: 'debug_se4_editor.png', fullPage: false });
  console.log('\n3. 스크린샷: debug_se4_editor.png');
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
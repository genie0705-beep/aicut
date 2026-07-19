// SE4 — 에디터 iframe 찾아서 paste
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  const blogPage = await ctx.newPage();
  
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  
  // SE4 앱 프레임: #__se_app 안에 content가 존재
  console.log('2️⃣ SE4 구조 분석...');
  const seInfo = await blogPage.evaluate(() => {
    const info = {};
    
    // __se_app 프레임
    const seApp = document.querySelector('#__se_app');
    info.hasSeApp = !!seApp;
    
    if (seApp) {
      info.seAppChildren = seApp.children.length;
      info.seAppHTML = seApp.innerHTML.slice(0, 500);
    }
    
    // 모든 iframe (editor iframe 등)
    const frames = [];
    document.querySelectorAll('iframe').forEach(f => {
      frames.push({
        id: f.id,
        src: (f.src || '').slice(0, 150),
        inSeApp: seApp ? seApp.contains(f) : false
      });
    });
    info.frames = frames;
    
    // contenteditable
    info.contentEditables = [];
    document.querySelectorAll('[contenteditable]').forEach(el => {
      info.contentEditables.push({
        tag: el.tagName,
        id: el.id,
        inSeApp: seApp ? seApp.contains(el) : false,
        text: (el.innerText || '').slice(0, 80)
      });
    });
    
    // SmartEditor의 iframe id 찾기
    const ed = window.SmartEditor && window.SmartEditor._editors && window.SmartEditor._editors['blogpc001'];
    if (ed) {
      info.editorKeys = Object.keys(ed).filter(k => !k.startsWith('_')).slice(0, 20);
      info.privateKeys = Object.keys(ed).filter(k => k.startsWith('_')).slice(0, 20);
      
      // _document 체크
      if (ed._document) {
        info.hasDocument = true;
        info.docType = typeof ed._document;
        info.docKeys = Object.keys(ed._document).slice(0, 10);
      }
      
      // iframe 찾기
      if (ed._editorIframe || ed._iframe) {
        info.editorIframe = ed._editorIframe ? 'found' : (ed._iframe ? 'found' : null);
      }
      
      // appId
      info.appId = ed._appId;
    }
    
    return info;
  });
  
  console.log('SE4 정보:', JSON.stringify(seInfo, null, 2));
  
  // 만약 __se_app 안에 숨겨진 iframe이 있다면 찾기
  // SmartEditor가 생성한 body 부모 찾기
  console.log('\n3️⃣ _document 내부 요소 찾기...');
  const docInfo = await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (!ed || !ed._document) return null;
    
    const doc = ed._document;
    const r = { docType: typeof doc };
    
    // doc이 iframe.contentDocument인지 확인
    if (doc.body) {
      r.hasBody = true;
      r.bodyHTML = doc.body.innerHTML.slice(0, 200);
      r.bodyText = doc.body.innerText.slice(0, 100);
    }
    
    if (doc.getElementById) {
      r.hasGetElementById = true;
    }
    
    return r;
  });
  console.log('document 정보:', JSON.stringify(docInfo));
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
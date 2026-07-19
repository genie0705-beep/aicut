// SE4 — _document.document 구조 분석
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  const blogPage = await ctx.newPage();
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  
  const docDetail = await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (!ed || !ed._document) return null;
    const doc = ed._document;
    const r = {};
    
    // doc.document 체크
    if (doc.document) {
      r.hasDocument = true;
      const dd = doc.document;
      r.docType = typeof dd;
      r.docKeys = Object.keys(dd).slice(0, 15);
      r.docIsIframe = dd instanceof HTMLIFrameElement;
      r.docIsDocument = dd instanceof Document;
      r.docTagName = dd.tagName || '';
      r.docId = dd.id || '';
      r.docSrc = (dd.src || '').slice(0, 100);
    }
    
    // doc.body 체크
    if (doc.body) {
      r.hasBody = true;
      r.bodyText = doc.body.innerText.slice(0, 200);
      r.bodyInner = doc.body.innerHTML.slice(0, 200);
    }
    
    // _editorIframe 체크 (ed 객체에서 직접)
    if (ed._editorIframe) {
      r.editorIframe = {
        id: ed._editorIframe.id,
        src: (ed._editorIframe.src || '').slice(0, 100)
      };
    }
    
    // documentService에서 body element 얻기
    if (ed._documentService && ed._documentService.getBodyElement) {
      try {
        const bodyEl = ed._documentService.getBodyElement();
        if (bodyEl) {
          r.serviceBody = {
            tag: bodyEl.tagName,
            text: bodyEl.innerText.slice(0, 100),
            htmlLen: bodyEl.innerHTML.length
          };
        }
      } catch(e) {
        r.serviceBodyError = e.message;
      }
    }
    
    // canvas element (SE4가 실제로 DOM을 렌더링하는 위치)
    if (ed._canvasElement) {
      r.canvasElement = {
        tag: ed._canvasElement.tagName,
        id: ed._canvasElement.id,
        parentId: ed._canvasElement.parentElement ? ed._canvasElement.parentElement.id : null
      };
    }
    
    // DOM에서 직접 SmartEditor가 렌더링한 영역 찾기
    const seCanvas = document.querySelector('.se-canvas, [class*="se-canvas"], #se-canvas, .editor-canvas');
    r.domCanvas = seCanvas ? { tag: seCanvas.tagName, id: seCanvas.id, cls: (seCanvas.className || '').slice(0, 50), innerLen: seCanvas.innerHTML.length } : null;
    
    // 공식 iframe 찾기
    const seIframe = document.querySelector('iframe[src*="editor"], iframe[src*="se-editor"]');
    r.seIframe = seIframe ? { id: seIframe.id, src: (seIframe.src || '').slice(0, 100) } : null;
    
    // 모든 div의 id="se"나 class="se" 검색
    const seElements = [];
    document.querySelectorAll('div[id*="se"], div[class*="se-"]').forEach(el => {
      seElements.push({ id: el.id, cls: (el.className || '').slice(0, 30), innerLen: el.innerHTML.length });
    });
    r.seElements = seElements.slice(0, 5);
    
    return r;
  });
  
  console.log('문서 구조:', JSON.stringify(docDetail, null, 2));
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
// SE4 에디터 - 기존 탭에서 에디터 구조 확인
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  for (const page of pages) {
    const url = page.url();
    if (url.includes('postwrite') || url.includes('aicut/postwrite')) {
      console.log('기존 탭 발견:', url);
      
      // 모든 editor/텍스트 영역 탐색
      const info = await page.evaluate(() => {
        const result = [];
        
        // 모든 요소 중 editor 관련
        document.querySelectorAll('*').forEach(el => {
          const role = el.getAttribute('role');
          const ce = el.getAttribute('contenteditable');
          const cls = typeof el.className === 'string' ? el.className.slice(0,60) : '';
          const id = el.id || '';
          
          if (role === 'textbox' || role === 'application' || ce === 'true' || 
              cls.includes('editor') || cls.includes('content') || cls.includes('input') ||
              id.includes('editor') || id.includes('content') || id.includes('input') ||
              (el.getAttribute && el.getAttribute('placeholder') && el.getAttribute('placeholder').includes('제목'))) {
            result.push({
              id, 
              cls, 
              tag: el.tagName, 
              role,
              ce,
              parentCls: typeof el.parentElement?.className === 'string' ? el.parentElement.className.slice(0,40) : '',
              text: (el.innerText || '').slice(0,100),
              placeholder: el.getAttribute && el.getAttribute('placeholder'),
            });
          }
        });
        
        // body의 자식 구조 (요약)
        result.push({
          _note: 'body children summary',
          count: document.body.children.length,
          first3: Array.from(document.body.children).slice(0,5).map(c => ({
            tag: c.tagName,
            id: c.id,
            cls: (c.className || '').slice(0,50),
            children: c.children.length,
          }))
        });
        
        return result;
      });
      
      console.log(JSON.stringify(info, null, 2));
      
      // 제목 영역 확인
      const titleInfo = await page.evaluate(() => {
        // 제목 입력 필드 찾기
        const titleEl = document.querySelector('input[placeholder*="제목"], textarea[placeholder*="제목"], [contenteditable][placeholder*="제목"]');
        if (titleEl) {
          return { tag: titleEl.tagName, id: titleEl.id, cls: titleEl.className, placeholder: titleEl.getAttribute('placeholder'), value: titleEl.value || titleEl.innerText };
        }
        // 제목 관련 div 찾기
        const allDivs = Array.from(document.querySelectorAll('div, input, textarea')).filter(el => {
          const text = el.innerText || el.placeholder || el.value || '';
          return text.includes('제목');
        });
        return allDivs.slice(0,5).map(el => ({ tag: el.tagName, id: el.id, cls: el.className.slice(0,50), text: (el.innerText || el.placeholder || '').slice(0,50) }));
      });
      console.log('제목 영역:', JSON.stringify(titleInfo, null, 2));
      
      break;
    }
  }
  
  // 새 탭에서 구조 확인
  const p = await ctx.newPage();
  await p.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(5000);
  
  // 제목 입력 후 본문 영역 깊게 파고들기
  const deepInfo = await p.evaluate(() => {
    // SmartEditor API의 실제 editor 객체 탐색
    const ed = SmartEditor._editors['blogpc001'];
    
    // editor._document 살펴보기
    const doc = ed._document;
    
    return {
      hasDocument: !!doc,
      docType: typeof doc,
      docKeys: doc ? Object.keys(doc).slice(0,20) : [],
      // editor 본문의 get/set 메서드
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(ed)).filter(m => m.includes('ment') || m.includes('Data') || m.includes('Html') || m.includes('Content') || m.includes('Body') || m.includes('Text')),
      // documentService
      docService: ed._documentService ? Object.keys(ed._documentService).slice(0,10) : 'none',
      // editingService
      editService: ed._editingService ? Object.keys(ed._editingService).slice(0,10) : 'none',
    };
  });
  console.log('Deep info:', JSON.stringify(deepInfo, null, 2));
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));

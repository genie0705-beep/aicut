const { chromium } = require('playwright');
const BLOG_URL = 'https://blog.naver.com/aicut/224341544476';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 직접 수정 URL로 이동
    console.log('📄 수정 페이지 직접 접속...');
    await page.goto('https://blog.naver.com/PostEdit.naver?blogId=aicut&postNo=224341544476&from=postView', { 
      waitUntil: 'load', timeout: 30000 
    });
    await sleep(5000);

    console.log('URL:', page.url());
    await page.screenshot({ path: '_debug_edit.png' });

    // SE4 에디터 확인
    const seInfo = await page.evaluate(() => {
      // SmartEditor 검색
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) {
        // iframe 체크
        const editors = document.querySelectorAll('iframe');
        const editorFrames = Array.from(editors).map(f => ({ 
          id: f.id, 
          name: f.name, 
          src: (f.src || '').substring(0, 120) 
        }));
        return { seFound: false, frames: editorFrames };
      }
      
      try {
        const docSvc = se._documentService;
        const data = docSvc.getDocumentData();
        return {
          seFound: true,
          compCount: data.length,
          comps: data.slice(0, 10).map(c => ({ type: c.type, text: (c.text || '').substring(0, 40) })),
          methods: {
            insertDocData: typeof docSvc.insertDocumentData,
            appendDocData: typeof docSvc.appendDocumentData,
            setDocData: typeof docSvc.setDocumentData,
            getDocData: typeof docSvc.getDocumentData,
          }
        };
      } catch(e) {
        return { seFound: true, error: e.message };
      }
    });

    console.log('SE4:', JSON.stringify(seInfo, null, 2));

    // 에디터 iframe이 있는지 확인
    const editFrames = page.frames();
    editFrames.forEach((f, i) => {
      const u = f.url();
      if (u.includes('editor') || u.includes('smart') || u.includes('se2') || u.length > 20) {
        console.log(`  Frame[${i}]: ${u.substring(0, 150)}`);
      }
    });

  } finally {
    await page.close();
  }
})();

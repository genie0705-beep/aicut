const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let p = null;
  for (const page of ctx.pages()) {
    if (page.frames().some(f => f.url().includes('PostWriteForm'))) { p = page; break; }
  }
  if (!p) { console.log('탭 없음'); b.close(); return; }

  await p.bringToFront();
  await sleep(2000);
  const f = p.frames().find(f => f.url().includes('PostWriteForm'));

  // 1. setDocumentData가 실제로 무슨 파라미터를 받는지 확인
  const sig = await f.evaluate(() => {
    const ds = SmartEditor._editors.blogpc001._documentService;
    const func = ds.setDocumentData;
    // 함수 시그니처 확인
    const str = func.toString();
    return {
      length: func.length,
      source: str.substring(0, 300)
    };
  });

  console.log('=== setDocumentData 시그니처 ===');
  console.log('파라미터 수:', sig.length);
  console.log('소스:', sig.source);

  // 2. 다양한 형식으로 테스트
  console.log('\n=== 파라미터 테스트 ===');
  
  const tests = [
    { name: '빈 문자열', val: '' },
    { name: 'simple HTML', val: '<p>hello</p>' },
  ];

  for (const t of tests) {
    const b64 = Buffer.from(t.val, 'utf-8').toString('base64');
    const res = await f.evaluate((b) => {
      try {
        const html = decodeURIComponent(escape(atob(b)));
        SmartEditor._editors.blogpc001._documentService.setDocumentData(html);
        return '✅';
      } catch(e) {
        return '❌ ' + e.message;
      }
    }, b64);
    console.log(`  ${t.name}: ${res}`);
  }

  // 3. 현재 문서 구조 확인
  console.log('\n=== 현재 문서 구조 ===');
  const docStruct = await f.evaluate(() => {
    const ed = SmartEditor._editors.blogpc001;
    const doc = ed._document;
    if (!doc) return { error: 'no document' };
    
    // document 구조
    const keys = Object.keys(doc);
    const d = doc.document;
    return {
      docKeys: keys,
      docType: typeof d,
      docJson: d ? JSON.stringify(d).substring(0, 500) : 'null',
    };
  });
  console.log(JSON.stringify(docStruct, null, 2));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

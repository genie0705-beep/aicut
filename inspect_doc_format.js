const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let tab = null;
  for (const p of ctx.pages()) {
    if (p.frames().some(f => f.url().includes('PostWriteForm'))) { tab = p; break; }
  }
  if (!tab) { console.log('탭 없음'); b.close(); return; }

  await tab.bringToFront();
  await sleep(2000);
  const f = tab.frames().find(ff => ff.url().includes('PostWriteForm'));

  // getDocumentData() 반환값 확인
  const docData = await f.evaluate(() => {
    const ed = SmartEditor._editors?.blogpc001;
    if (!ed?._documentService) return {error: 'no service'};
    
    const result = {};
    try {
      const data = ed._documentService.getDocumentData();
      result.type = typeof data;
      result.length = data?.length || 0;
      if (typeof data === 'string') {
        result.preview = data.substring(0, 500);
      } else if (typeof data === 'object') {
        result.json = JSON.stringify(data).substring(0, 500);
      } else {
        result.value = String(data).substring(0, 200);
      }
    } catch(e) { result.error = e.message; }
    
    // getDocumentTitle()
    try {
      result.title = ed._documentService.getDocumentTitle();
    } catch(e) { result.titleError = e.message; }
    
    return result;
  });

  console.log('=== getDocumentData() 반환값 ===');
  console.log(JSON.stringify(docData, null, 2));

  // setDocumentData를 올바르게 호출하는 방법 찾기
  console.log('\n=== setDocumentData 래퍼 해체 시도 ===');
  const wrapperInfo = await f.evaluate(() => {
    const ds = SmartEditor._editors?.blogpc001?._documentService;
    if (!ds) return {error: 'no service'};

    // 실제 함수 찾기 (b 함수)
    const funcStr = ds.setDocumentData.toString();
    
    // 클로저 변수 찾기
    return {
      funcStr: funcStr,
      // setDocumentData가 가리키는 함수 정보
      name: ds.setDocumentData.name,
      length: ds.setDocumentData.length,
    };
  });
  console.log(JSON.stringify(wrapperInfo, null, 2));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

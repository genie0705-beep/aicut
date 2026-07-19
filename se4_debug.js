const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Redirect=Write 탭 찾기 (새로 열지 않고 기존 탭 사용)
  let wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) {
    wp = await b.contexts()[0].newPage();
    await wp.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(8000);
  } else {
    await wp.bringToFront();
    await sleep(3000);
  }
  
  const frames = wp.frames();
  let seFrame = null;
  for (const f of frames) {
    const has = await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false);
    if (has) { seFrame = f; break; }
  }
  if (!seFrame) { console.log('NO SE FRAME'); await b.close(); return; }
  
  console.log('✅ SE 프레임 발견');
  
  // 빈 문서 데이터 구조 분석
  const emptyData = await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    // 데이터 구조 전체 파악
    function explore(obj, depth = 0) {
      if (depth > 3 || !obj || typeof obj !== 'object') return;
      const keys = Object.keys(obj);
      for (const key of keys) {
        const val = obj[key];
        if (Array.isArray(val)) {
          console.log('  '.repeat(depth) + key + ': Array[' + val.length + ']');
          if (val.length > 0) {
            const item = val[0];
            console.log('  '.repeat(depth + 1) + 'item keys: ' + Object.keys(item).join(', '));
          }
        } else if (typeof val === 'object' && val !== null) {
          console.log('  '.repeat(depth) + key + ': Object');
          explore(val, depth + 1);
        } else {
          console.log('  '.repeat(depth) + key + ': ' + String(val).substring(0, 50));
        }
      }
    }
    
    explore(data);
    return 'done';
  });
  
  // 이제 setDocumentData로 직접 데이터 설정
  await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    
    // 제목 설정
    ed.setDocumentTitle('무더위에 지친 보험설계사라면? 하반기 숏폼 마케팅으로 승부보세요');
    
    // 본문 데이터 구성
    const data = ed.getDocumentData();
    
    // document 구조 파악 후 blocks 추가
    if (data.document && Array.isArray(data.document.blocks)) {
      // blocks가 배열이면 항목 추가
    }
    
    // 빈 문서면 새로 생성
    const newData = {
      document: {
        blocks: [
          {
            type: 'paragraph',
            text: 'test paragraph',
            style: { textAlign: 'center' }
          }
        ]
      }
    };
    
    ed.setDocumentData(newData);
  });
  await sleep(3000);
  
  // 결과 확인
  const result = await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const title = ed.getDocumentTitle();
    const canvasText = (document.querySelector('.se-canvas') || {}).innerText || '';
    return {
      title,
      dataKeys: Object.keys(data),
      docKeys: data.document ? Object.keys(data.document) : [],
      blockCount: data.document && data.document.blocks ? data.document.blocks.length : 0,
      canvasText: canvasText.substring(0, 100)
    };
  });
  
  console.log('\n=== 결과 ===');
  console.log(JSON.stringify(result, null, 2));
  
  // 스크린샷
  await wp.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_test.png', fullPage: true });
  
  await b.close();
})();

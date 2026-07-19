const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let targetPage = null;
  for (const p of ctx.pages()) {
    if (p.frames().some(f => f.url().includes('PostWriteForm'))) {
      targetPage = p;
      break;
    }
  }
  if (!targetPage) { console.log('탭 없음'); b.close(); return; }

  await targetPage.bringToFront();
  await sleep(2000);
  const frame = targetPage.frames().find(f => f.url().includes('PostWriteForm'));

  // SmartEditor._editors.blogpc001의 모든 메서드 조사
  const methods = await frame.evaluate(() => {
    const ed = SmartEditor._editors.blogpc001;
    if (!ed) return { error: 'ed 없음' };
    
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(ed));
    const own = Object.getOwnPropertyNames(ed);
    const all = [...new Set([...proto, ...own])];
    
    return {
      ownKeys: own.slice(0, 30),
      protoKeys: proto.slice(0, 30),
      type: typeof ed,
      hasSetDocumentData: typeof ed.setDocumentData === 'function',
      hasSetDocumentTitle: typeof ed.setDocumentTitle === 'function',
      hasSetContents: typeof ed.setContents === 'function',
      hasSetContent: typeof ed.setContent === 'function',
      hasSetValue: typeof ed.setValue === 'function',
      hasSetHTML: typeof ed.setHTML === 'function',
      // editor body 엘리먼트
      editorBodyType: ed._editorBody ? typeof ed._editorBody : '없음',
      editorBody: ed._editorBody ? ed._editorBody.tagName : '없음',
    };
  });

  console.log('=== SmartEditor.blogpc001 메서드 ===');
  console.log(JSON.stringify(methods, null, 2));

  // setDocumentData 시도
  if (methods.hasSetDocumentData) {
    console.log('\nsetDocumentData 발견! 간단한 HTML로 테스트...');
    const testResult = await frame.evaluate(() => {
      try {
        SmartEditor._editors.blogpc001.setDocumentData('<p>테스트 본문입니다.</p>');
        return '✅ 성공';
      } catch(e) {
        return '❌ ' + e.message;
      }
    });
    console.log(`  테스트: ${testResult}`);
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

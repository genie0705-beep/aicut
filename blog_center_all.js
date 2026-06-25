const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) { console.log('❌ 에디터 탭 없음'); process.exit(1); }

  // iframe paragraph 확인
  const iframeInfo = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return { error: 'iframe 없음' };
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return { error: 'doc 없음' };
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return { error: 'editable 없음' };
    const paras = doc.querySelectorAll('p');
    return {
      bodyLen: body.innerText.length,
      pCount: paras.length,
      firstP: paras.length > 0 ? paras[0].textContent?.substring(0, 30) : 'N/A'
    };
  });
  console.log('iframe:', JSON.stringify(iframeInfo));

  // paragraph가 있으면 DOM 수정
  if (iframeInfo.pCount > 0) {
    const centerResult = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[id^="input_buffer"]');
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const paras = doc.querySelectorAll('p, div, h2');
      let count = 0;
      paras.forEach(el => {
        if (el.textContent?.trim().length > 0) {
          el.style.textAlign = 'center';
          el.setAttribute('align', 'center');
          count++;
        }
      });
      return `${count}개 센터 정렬`;
    });
    console.log('DOM 정렬:', centerResult);
  } else {
    // paragraph 없으면 setDocumentData로 textAlign 설정
    console.log('⚠️ paragraph 없음, setDocumentData 시도...');
    const sdResult = await page.evaluate(() => {
      const editor = window.SmartEditor?._editors?.['blogpc001'];
      if (!editor) return 'editor 없음';
      const data = editor.getDocumentData();
      let count = 0;
      for (const comp of data.document.components) {
        if (comp['@ctype'] !== 'text') continue;
        for (const p of (comp.value || [])) {
          if (p.nodes?.length > 0) {
            p.textAlign = 'center';
            count++;
          }
        }
      }
      try {
        editor.setDocumentData(data);
        return `✅ setDocumentData: ${count}개 center`;
      } catch(e) {
        return `❌ ${e.message}`;
      }
    });
    console.log('setDocumentData:', sdResult);
  }

  // 저장
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
  });
  await new Promise(r => setTimeout(r, 3000));
  console.log('저장: ✅');

  // 확인
  const verify = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return 'n/a';
    const data = editor.getDocumentData();
    let center = 0, total = 0;
    for (const c of data.document.components) {
      if (c['@ctype'] !== 'text') continue;
      for (const p of (c.value || [])) {
        total++;
        if (p.textAlign === 'center') center++;
      }
    }
    return { center, total };
  });
  console.log('확인:', JSON.stringify(verify));

  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

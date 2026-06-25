const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.length > 0 ? pages[0] : await ctx.newPage();

  if (!page.url().includes('PostWriteForm')) {
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
  }

  // 1. iframe DOM 상태 확인
  const domState = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return { error: 'iframe 없음' };
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return { error: 'doc 없음' };
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return { error: 'editable 없음' };
    const paras = doc.querySelectorAll('p');
    const divs = doc.querySelectorAll('div');
    return {
      bodyLen: body.innerText.length,
      pCount: paras.length,
      divCount: divs.length,
      firstP: paras.length > 0 ? paras[0].textContent?.substring(0, 30) : 'N/A',
      bodyHTML: body.innerHTML.substring(0, 200)
    };
  });
  console.log('DOM:', JSON.stringify(domState));

  // 2. 센터 정렬 적용 (paragraph 있으면)
  if (domState.pCount > 0) {
    const centerResult = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[id^="input_buffer"]');
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const paras = doc.querySelectorAll('p, div, h2, h3');
      let count = 0;
      paras.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          el.style.textAlign = 'center';
          el.setAttribute('align', 'center');
          count++;
        }
      });
      return `${count}개 센터 정렬`;
    });
    console.log('센터 정렬:', centerResult);
    await new Promise(r => setTimeout(r, 500));
  } else {
    console.log('⚠️ paragraph 없음 - DOM 정렬 불가');
    // 다른 방법: 전체 선택 후 정렬 버튼 클릭 시도
    console.log('정렬 버튼 찾는 중...');
    const alignResult = await page.evaluate(() => {
      // Ctrl+A 후 정렬 버튼 찾기
      const iframe = document.querySelector('iframe[id^="input_buffer"]');
      if (!iframe) return 'iframe 없음';
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return 'doc 없음';
      const body = doc.querySelector('[contenteditable="true"]');
      if (!body) return 'editable 없음';
      body.focus();
      
      // 전체 선택 명령 실행
      doc.execCommand('selectAll');
      
      // 중심 정렬 명령
      doc.execCommand('justifyCenter');
      
      return 'execCommand justifyCenter 실행';
    });
    console.log('정렬 결과:', alignResult);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 3. 저장
  const saved = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return true; }
    return false;
  });
  console.log('저장:', saved ? '✅' : '❌');
  await new Promise(r => setTimeout(r, 3000));

  // 4. 확인: getDocumentData에서 centerCount 확인
  const verify = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return '❌';
    const data = editor.getDocumentData();
    let center = 0;
    for (const c of data.document.components) {
      if (c['@ctype'] !== 'text') continue;
      for (const p of (c.value || [])) {
        if (p.textAlign === 'center') center++;
      }
    }
    return { center, comps: data.document.components.length };
  });
  console.log('저장 후 확인:', JSON.stringify(verify));

  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

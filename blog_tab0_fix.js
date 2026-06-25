const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  // 탭 0 (데이터 온전한 탭) 사용
  const page = pages[0];
  if (!page.url().includes('PostWriteForm')) {
    console.log('❌ 탭 0이 PostWriteForm 아님');
    await b.close();
    return;
  }
  await page.bringToFront();
  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });

  console.log('📝 탭 0 사용 (데이터: 61 paragraphs, 2315자)');
  
  // 1. iframe DOM 확인
  const domInfo = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return { error: 'iframe 없음' };
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return { error: 'doc 없음' };
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return { error: 'editable 없음' };
    const paras = doc.querySelectorAll('p');
    const divs = doc.querySelectorAll('div');
    const spans = doc.querySelectorAll('span');
    return {
      bodyLen: body.innerText.length,
      bodyHtmlLen: body.innerHTML.length,
      paragraphCount: paras.length,
      divCount: divs.length,
      spanCount: spans.length,
      firstParaText: paras.length > 0 ? paras[0].textContent?.substring(0, 40) : 'N/A',
      bodyPreview: body.innerHTML.substring(0, 300)
    };
  });
  console.log('iframe DOM:', JSON.stringify(domInfo, null, 2));

  // 2. paragraph가 있으면 center 정렬 적용
  if (domInfo.paragraphCount > 0) {
    console.log('🎯 센터 정렬 적용...');
    const alignResult = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[id^="input_buffer"]');
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const paras = doc.querySelectorAll('p');
      let count = 0;
      paras.forEach(p => {
        p.style.textAlign = 'center';
        p.setAttribute('align', 'center');
        count++;
      });
      return `${count}개 paragraph center 정렬 완료`;
    });
    console.log(alignResult);
    await new Promise(r => setTimeout(r, 1000));

    // 3. 저장
    console.log('💾 저장...');
    const saveOk = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return true;
        }
      }
      return false;
    });
    console.log('저장:', saveOk ? '✅' : '❌');
    await new Promise(r => setTimeout(r, 3000));

    // 4. 확인
    const verify = await page.evaluate(() => {
      const editor = window.SmartEditor?._editors?.['blogpc001'];
      if (!editor) return { error: 'editor 없음' };
      const data = editor.getDocumentData();
      const comps = data.document.components;
      let centerCount = 0, totalText = 0;
      for (const comp of comps) {
        if (comp['@ctype'] !== 'text') continue;
        for (const p of (comp.value || [])) {
          if (p.textAlign === 'center') centerCount++;
          for (const node of (p.nodes || [])) totalText += (node.value || '').length;
        }
      }
      return { centerCount, totalText, compsCount: comps.length };
    });
    console.log('저장 후 확인:', JSON.stringify(verify));
  } else {
    console.log('⚠️ iframe에 paragraph 없음 - DOM center 정렬 불가');
    console.log('   iframe body HTML:', domInfo.bodyHtmlLen > 0 ? `${domInfo.bodyHtmlLen}자` : '비어있음');
    console.log('   body innerText:', domInfo.bodyLen > 0 ? `${domInfo.bodyLen}자` : '비어있음');
    
    // 그래도 저장 버튼 한번 눌러서 현재 상태 저장
    console.log('💾 저장 시도...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 3000));
  }

  await b.close();
}
run().catch(e => console.error('❌', e.message));

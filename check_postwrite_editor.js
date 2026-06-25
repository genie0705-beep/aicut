const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('postwrite'));
  if (!page) { console.log('postwrite 탭 없음'); await b.close(); process.exit(0); }

  console.log('URL:', page.url().substring(0, 120));
  
  // 모든 프레임 출력
  const frames = page.frames();
  console.log('프레임 수:', frames.length);
  frames.forEach((f, i) => {
    const url = f.url();
    if (url.length > 10) {
      console.log(` [${i}] name="${f.name()}" url=${url.substring(0, 100)}`);
    }
  });

  // 페이지 본문에서 에디터 관련 요소 찾기
  const editorInfo = await page.evaluate(() => {
    const info = {};
    info.iframes = document.querySelectorAll('iframe').length;
    info.editorId = !!document.querySelector('#SE_editor, .se-editor, [class*="editor"]');
    info.textareas = document.querySelectorAll('textarea').length;
    info.contenteditables = document.querySelectorAll('[contenteditable]').length;
    
    // iframe 상세
    info.iframeSrcs = Array.from(document.querySelectorAll('iframe')).map(f => ({
      id: f.id || '',
      name: f.name || '',
      src: (f.getAttribute('src') || '').substring(0, 80)
    }));
    
    return info;
  });
  console.log('\n=== 페이지 에디터 정보 ===');
  console.log(JSON.stringify(editorInfo, null, 2));

  // postwrite 에서 PostWriteForm이름의 프레임을 name으로 찾기
  const pwFrame = frames.find(f => f.name() === 'postwrite' || f.url().includes('PostWriteForm') || f.url().includes('postwrite'));
  if (pwFrame) {
    console.log('\npostwrite 프레임 찾음');
    const pwInfo = await pwFrame.evaluate(() => {
      return {
        url: window.location.href.substring(0, 100),
        inputCount: document.querySelectorAll('input').length,
        textareaCount: document.querySelectorAll('textarea').length,
        editableCount: document.querySelectorAll('[contenteditable]').length,
        bodySample: document.body.innerText.substring(0, 200)
      };
    });
    console.log(JSON.stringify(pwInfo, null, 2));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

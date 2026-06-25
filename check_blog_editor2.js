const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  // 블로그 에디터 페이지 열기
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('blog.naver.com') && p.url().includes('Write'));
  
  if (!page) {
    page = pages.find(p => p.url().includes('blog.naver.com/aicut'));
    if (!page) {
      page = await ctx.newPage();
    }
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  }
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('현재 URL:', page.url().substring(0, 120));
  
  // 모든 프레임 확인
  const frames = page.frames();
  console.log('프레임 수:', frames.length);
  
  let pwFrame = null;
  for (const f of frames) {
    const url = f.url();
    if (url.includes('PostWriteForm') || url.includes('SmartEditor')) {
      pwFrame = f;
      console.log('찾음:', url.substring(0, 100));
      break;
    }
  }
  
  if (!pwFrame) {
    console.log('PostWriteForm 프레임 없음, 모든 프레임 출력');
    frames.forEach((f,i) => {
      console.log(' ['+i+'] ' + f.url().substring(0, 100));
    });
    await b.close();
    process.exit(0);
  }
  
  // 에디터 분석
  const editorInfo = await pwFrame.evaluate(() => {
    const info = {};
    
    // 제목 input
    const title = document.querySelector('#title, input[name="title"], input.se-title, .se-title input');
    if (title) {
      info.title = {
        tag: title.tagName,
        id: title.id || '',
        placeholder: title.placeholder || '',
        value: title.value || ''
      };
    } else {
      info.title = 'not found';
    }
    
    // contenteditable 영역
    const editors = document.querySelectorAll('[contenteditable]');
    info.editors = Array.from(editors).map(el => ({
      tag: el.tagName,
      id: el.id || '',
      cls: (el.className || '').substring(0, 60),
      text: (el.innerText || '').substring(0, 50)
    }));
    
    // iframe 내부 프레임
    info.childFrames = document.querySelectorAll('iframe').length;
    
    // SE editor 구조
    info.seBody = !!document.querySelector('.se-body');
    info.seWrapper = !!document.querySelector('.se-wrapper');
    
    return info;
  });
  
  console.log('\n=== 에디터 구조 ===');
  console.log(JSON.stringify(editorInfo, null, 2));
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

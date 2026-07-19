const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages.find(p => p.url().includes('Redirect=Write'));
  if (!page) { console.log('NO PAGE'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);
  
  const allFrames = page.frames();
  let seFrame = null;
  for (const f of allFrames) {
    const has = await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false);
    if (has) { seFrame = f; break; }
  }
  if (!seFrame) { console.log('NO SE FRAME'); await b.close(); return; }
  
  console.log('✅ SmartEditor 프레임 발견');
  
  // CTA 링크 생성 (execCommand createLink)
  const result = await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const results = [];
    
    // 데이터에서 URL 텍스트를 찾아서 링크로 변환
    function convertUrlsToLinks(blocks) {
      if (!blocks) return;
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.type === 'text' || block.type === 'paragraph' || block.componentType === 'text') {
          const text = (block.text || block.content || '').toString();
          
          // pf.kakao.com 링크
          if (text.includes('pf.kakao.com')) {
            block.link = 'https://pf.kakao.com/_GIesX/chat';
            block.href = 'https://pf.kakao.com/_GIesX/chat';
            results.push('kakao link set');
          }
          // aicut.co.kr 링크
          if (text.includes('aicut.co.kr')) {
            block.link = 'https://aicut.co.kr';
            block.href = 'https://aicut.co.kr';
            results.push('homepage link set');
          }
          // master@ 이메일
          if (text.includes('master@')) {
            block.link = 'mailto:master@aicut.co.kr';
            block.href = 'mailto:master@aicut.co.kr';
            results.push('email link set');
          }
        }
        if (block.children) convertUrlsToLinks(block.children);
        if (block.blocks) convertUrlsToLinks(block.blocks);
        if (block.content) {
          if (Array.isArray(block.content)) convertUrlsToLinks(block.content);
        }
      }
    }
    
    if (data.blocks) convertUrlsToLinks(data.blocks);
    if (data.children) convertUrlsToLinks(data.children);
    if (data.content) {
      if (Array.isArray(data.content)) convertUrlsToLinks(data.content);
    }
    
    ed.setDocumentData(data);
    return results;
  });
  
  console.log('CTA 변환:', result);
  await sleep(3000);
  
  // 다시 저장
  await seFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // CTA 링크 재확인
  const verify = await seFrame.evaluate(() => {
    const links = document.querySelectorAll('a');
    const ctaLinks = Array.from(links).filter(a => {
      const h = a.getAttribute('href') || '';
      return h.includes('kakao.com') || h.includes('aicut.co.kr') || h.includes('master@');
    });
    return {
      totalLinks: links.length,
      ctaCount: ctaLinks.length,
      ctaDetails: ctaLinks.map(a => ({
        text: (a.innerText || '').substring(0, 30),
        href: (a.getAttribute('href') || '').substring(0, 50)
      }))
    };
  });
  
  console.log('\n=== 🔍 CTA 링크 재확인 ===');
  console.log(JSON.stringify(verify, null, 2));
  
  if (verify.ctaCount >= 3) {
    console.log('✅ CTA 링크 3개 모두 정상!');
  } else {
    console.log('⚠️ CTA 링크 ' + verify.ctaCount + '/3개 — 추가 처리 필요');
  }
  
  await b.close();
})();

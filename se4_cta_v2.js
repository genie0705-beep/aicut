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
  
  // execCommand createLink로 CTA 링크 생성
  const urls = [
    { text: 'pf.kakao.com', url: 'https://pf.kakao.com/_GIesX/chat' },
    { text: 'aicut.co.kr', url: 'https://aicut.co.kr' },
    { text: 'master@', url: 'mailto:master@aicut.co.kr' }
  ];
  
  for (const item of urls) {
    const found = await seFrame.evaluate(({ text, url }) => {
      // 본문에서 텍스트 노드 찾기
      const walker = document.createTreeWalker(
        document.querySelector('.se-canvas') || document.body,
        4, // Text nodes only
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes(text)) {
          // 해당 텍스트 범위 선택
          const range = document.createRange();
          const startIdx = node.textContent.indexOf(text);
          range.setStart(node, startIdx);
          range.setEnd(node, startIdx + text.length);
          
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          // createLink 실행
          const success = document.execCommand('createLink', false, url);
          return { found: true, text: text, url: url, success: success };
        }
      }
      return { found: false, text: text };
    }, item);
    
    console.log(`   ${item.text}:`, JSON.stringify(found));
    await sleep(1000);
  }
  
  await sleep(2000);
  
  // 저장
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
  
  console.log('\n=== 🔍 최종 CTA 링크 확인 ===');
  console.log(JSON.stringify(verify, null, 2));
  
  if (verify.ctaCount >= 3) {
    console.log('✅ CTA 링크 3개 모두 정상!');
  } else {
    console.log('⚠️ CTA 링크 ' + verify.ctaCount + '/3개');
  }
  
  await b.close();
})();

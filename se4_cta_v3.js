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
  
  // 에디터에서 직접 Range로 텍스트 찾기 (contenteditable 내에서)
  const ctaHtml = `
<p style="text-align: center;">📞 카카오톡: <a href="https://pf.kakao.com/_GIesX/chat" target="_blank">pf.kakao.com/_GIesX/chat</a></p>
<p style="text-align: center;">📧 이메일: <a href="mailto:master@aicut.co.kr">master@aicut.co.kr</a></p>
<p style="text-align: center;">🌐 홈페이지: <a href="https://aicut.co.kr" target="_blank">https://aicut.co.kr</a></p>
<br>`;
  
  // clipboard에 CTA HTML 복사
  await seFrame.evaluate(async (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(div);
    
    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    document.body.removeChild(div);
  }, ctaHtml);
  await sleep(1000);
  
  // 문서 끝으로 커서 이동 후 붙여넣기
  await seFrame.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return;
    
    // 마지막으로 포커스
    canvas.focus();
    
    // 문서 끝으로 이동
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(canvas);
    range.collapse(false); // 끝으로
    sel.removeAllRanges();
    sel.addRange(range);
    
    // 붙여넣기
    document.execCommand('paste');
  });
  await sleep(3000);
  
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
    const ctaClicks = Array.from(links).filter(a => {
      const h = a.getAttribute('href') || '';
      return h.includes('kakao.com') || h.includes('aicut.co.kr') || h.includes('master@');
    });
    
    // 본문에서 해시태그 확인
    const bodyText = document.body.innerText || '';
    const hashMatch = bodyText.match(/#\S+/g);
    
    return {
      totalLinks: links.length,
      ctaCount: ctaClicks.length,
      ctaDetails: ctaClicks.map(a => ({
        text: (a.innerText || '').substring(0, 30),
        href: (a.getAttribute('href') || '').substring(0, 50)
      })),
      hashTags: hashMatch ? hashMatch.length : 0
    };
  });
  
  console.log('\n=== 🔍 최종 검증 ===');
  console.log(JSON.stringify(verify, null, 2));
  
  if (verify.ctaCount >= 3) {
    console.log('\n✅ 모든 항목 정상!');
  } else {
    console.log('\n⚠️ CTA ' + verify.ctaCount + '/3 — 추가 처리 필요');
    
    // 실패 시 직접 execCommand createLink 시도 (se-canvas 내에서)
    if (verify.ctaCount < 3) {
      await seFrame.evaluate(() => {
        // se-canvas 내의 모든 텍스트 노드에서 URL 찾기
        const canvas = document.querySelector('.se-canvas');
        if (!canvas) return;
        
        const walker = document.createTreeWalker(canvas, 4, null, false);
        const targets = [];
        let node;
        while (node = walker.nextNode()) {
          const t = node.textContent || '';
          if (t.includes('pf.kakao.com')) targets.push({ node, text: 'pf.kakao.com', url: 'https://pf.kakao.com/_GIesX/chat' });
          else if (t.includes('aicut.co.kr')) targets.push({ node, text: 'aicut.co.kr', url: 'https://aicut.co.kr' });
          else if (t.includes('master@')) targets.push({ node, text: 'master@', url: 'mailto:master@aicut.co.kr' });
        }
        
        // 각 대상 선택 후 createLink
        targets.forEach(t => {
          const range = document.createRange();
          const idx = t.node.textContent.indexOf(t.text);
          if (idx >= 0) {
            range.setStart(t.node, idx);
            range.setEnd(t.node, idx + t.text.length);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('createLink', false, t.url);
          }
        });
      });
      await sleep(3000);
      
      // 다시 저장
      await seFrame.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.innerText.trim() === '저장') { btn.click(); return; }
        }
      });
      await sleep(5000);
      
      // 최종 확인
      const finalVerify = await seFrame.evaluate(() => {
        const links = document.querySelectorAll('a');
        return Array.from(links)
          .filter(a => (a.getAttribute('href') || '').includes('kakao.com') || (a.getAttribute('href') || '').includes('aicut.co.kr') || (a.getAttribute('href') || '').includes('master@'))
          .map(a => ({ text: (a.innerText || '').substring(0, 30), href: (a.getAttribute('href') || '').substring(0, 50) }));
      });
      console.log('재시도 후:', JSON.stringify(finalVerify));
    }
  }
  
  await b.close();
})();

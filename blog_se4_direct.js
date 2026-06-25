const { chromium } = require('playwright');
const fs = require('fs');

// SE4 포맷으로 HTML 변환
function toSE4Html(bodyContent) {
  
  const pToSe4 = (innerHtml, isHeading = false) => {
    // strong 태그를 se-ff-bold span으로 변환
    let text = innerHtml
      .replace(/<strong>([\s\S]*?)<\/strong>/g, '<span class="se-ff-bold __se-node">$1</span>')
      .replace(/<br\s*\/?>/g, '');
    
    // a 태그 제거 (링크는 텍스트만)
    text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1');
    
    const fontSize = isHeading ? 'se-fs32' : 'se-fs32';
    const fontWeight = isHeading ? ' se-ff-bold' : '';
    
    return `<p class="se-text-paragraph se-text-paragraph-align-center"><span class="se-ff-nanumgothic ${fontSize}__se-node${fontWeight}">${text}</span></p>`;
  };
  
  const bodyMatch = bodyContent.match(/<body>([\s\S]*?)<\/body>/);
  const inner = bodyMatch ? bodyMatch[1].trim() : bodyContent;
  
  // 태그별 분리
  const tagRegex = /<(h[23]|p)[^>]*>[\s\S]*?<\/\1>/g;
  let match;
  let parts = [];
  while ((match = tagRegex.exec(inner)) !== null) {
    parts.push(match[0]);
  }
  
  let result = '';
  for (const part of parts) {
    if (part.startsWith('<h2')) {
      const content = part.replace(/<h2[^>]*>/, '').replace(/<\/h2>/, '');
      result += `<div class="se-component se-text se-l-default"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text __se-unit">${pToSe4(content, true)}</div></div></div></div>`;
    } else if (part.startsWith('<h3')) {
      const content = part.replace(/<h3[^>]*>/, '').replace(/<\/h3>/, '');
      result += `<div class="se-component se-text se-l-default"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text __se-unit">${pToSe4(content)}</div></div></div></div>`;
    } else if (part.startsWith('<p')) {
      const content = part.replace(/<p[^>]*>/, '').replace(/<\/p>/, '');
      if (content.trim()) {
        result += `<div class="se-component se-text se-l-default"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text __se-unit">${pToSe4(content)}</div></div></div></div>`;
      }
    }
  }
  
  return `<div class="se-components-wrap">${result}</div>`;
}

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { console.log('페이지 없음'); await ctx.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(3000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
    
    // 모바일 최적화 HTML → SE4 포맷 변환
    const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const se4Html = toSE4Html(mobileHtml);
    console.log('SE4 HTML 생성됨, 길이:', se4Html.length);
    
    // setDocumentData 시도 (SE4 포맷 HTML)
    const result = await pf.evaluate((html) => {
      const se = SmartEditor._editors['blogpc001'];
      
      // 제목 설정
      se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
      
      // setDocumentData 재시도
      try {
        se._documentService.setDocumentData(html);
        return { ok: true, msg: 'setDocumentData 성공' };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, se4Html).catch(e => ({ error: e.message }));
    console.log('결과:', JSON.stringify(result, null, 2));
    
    if (!result.ok) {
      // DOM에 직접 SE4 HTML 주입 + setValidSet
      console.log('setDocumentData 실패, DOM 직접 주입 시도');
      const domResult = await pf.evaluate((html) => {
        const se = SmartEditor._editors['blogpc001'];
        const dds = se._documentService._documentDataStore;
        
        try {
          // se-components-wrap에 SE4 HTML 직접 주입
          const wrap = document.querySelector('.se-components-wrap');
          if (!wrap) return { error: 'no wrap' };
          wrap.innerHTML = html;
          
          // 변경 이벤트 발생
          wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
          
          // input 이벤트
          const inputEvent = new InputEvent('input', { bubbles: true, cancelable: true });
          wrap.dispatchEvent(inputEvent);
          
          // _documentService에 변경 알림
          dds.setValidSet(true);
          
          // documentDataStore의 document에 components 정보 설정
          // DOM에서 컴포넌트 수 계산
          const comps = wrap.querySelectorAll('.se-component.se-text');
          
          return {
            compCount: comps.length,
            textLen: se.getContentText().length,
            firstText: comps[0]?.querySelector('.__se-node')?.textContent?.substring(0, 100) || 'none'
          };
        } catch(e) {
          return { error: e.message };
        }
      }, se4Html).catch(e => ({ error: e.message }));
      console.log('DOM 주입 결과:', JSON.stringify(domResult, null, 2));
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();

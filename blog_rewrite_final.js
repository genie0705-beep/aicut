const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { await ctx.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(2000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { await ctx.close(); return; }
    
    const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = mobileHtml.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : mobileHtml;
    
    const result = await pf.evaluate((htmlContent) => {
      const se = SmartEditor._editors['blogpc001'];
      
      // 제목 설정
      se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
      
      // DOM 파서로 HTML 파싱
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const elements = Array.from(doc.body.children);
      
      // 제목 컴포넌트 템플릿 (기존 DOM에서 추출)
      const wrap = document.querySelector('.se-components-wrap');
      if (!wrap) return { error: 'wrap not found' };
      
      // 기존 내용 초기화
      wrap.innerHTML = '';
      
      // 텍스트 컴포넌트 템플릿 HTML
      const textCompTemplate = `<div class="se-component se-text se-l-default" data-a11y-title="본문"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text __se-unit"><p class="se-text-paragraph se-text-paragraph-align-center"><span class="se-ff-nanumgothic se-fs32 __se-node">__CONTENT__</span></p></div></div></div></div>`;
      
      // H2 템플릿
      const h2Template = `<div class="se-component se-text se-l-default" data-a11y-title="본문"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text __se-unit"><p class="se-text-paragraph se-text-paragraph-align-center"><span class="se-ff-nanumgothic se-fs32 se-ff-bold __se-node">__CONTENT__</span></p></div></div></div></div>`;
      
      // 각 HTML 요소를 SE4 컴포넌트로 변환하여 추가
      for (const el of elements) {
        const tag = el.tagName.toLowerCase();
        let compHtml = '';
        
        if (tag === 'p') {
          const inner = el.innerHTML || el.textContent || '';
          if (inner.trim()) {
            compHtml = textCompTemplate.replace('__CONTENT__', inner);
          }
        } else if (tag === 'h2') {
          const inner = el.innerHTML || el.textContent || '';
          if (inner.trim()) {
            compHtml = h2Template.replace('__CONTENT__', inner);
          }
        } else if (tag === 'h3') {
          const inner = el.innerHTML || el.textContent || '';
          if (inner.trim()) {
            compHtml = textCompTemplate.replace('__CONTENT__', inner);
          }
        } else if (tag === 'img') {
          // 이미지 컴포넌트 (텍스트로 placeholder)
          const alt = el.getAttribute('alt') || '이미지';
          compHtml = textCompTemplate.replace('__CONTENT__', `[이미지: ${alt}]`);
        }
        
        if (compHtml) {
          wrap.insertAdjacentHTML('beforeend', compHtml);
        }
      }
      
      // 변경 알림 이벤트 발생
      ['input', 'change', 'DOMSubtreeModified'].forEach(evt => {
        wrap.dispatchEvent(new Event(evt, { bubbles: true }));
      });
      
      return {
        compCount: wrap.querySelectorAll('.se-component').length,
        textLen: se.getContentText().length,
        firstText: wrap.querySelector('.se-text .se-text-paragraph')?.textContent?.substring(0, 50) || 'none'
      };
    }, contentHtml).catch(e => ({ error: e.message }));
    
    console.log('작성 결과:', JSON.stringify(result, null, 2));
    
    if (result?.textLen > 100) {
      console.log('✅ 작성 성공!');
      
      // 저장 버튼 찾기 (메인 페이지)
      const saveBtn = await page.evaluate(() => {
        // PostUpdateForm 위젯의 저장 버튼
        const all = document.querySelectorAll('em:not(.se- *)');
        for (const el of document.querySelectorAll('*')) {
          const text = (el.textContent || '').trim();
          const cls = el.className || '';
          if ((text === '저장' || text === '등록') && el.offsetParent !== null) {
            return { tag: el.tagName, text, cls: cls.substring(0, 50), id: el.id };
          }
        }
        return null;
      });
      console.log('저장 버튼:', JSON.stringify(saveBtn));
      
      if (saveBtn) {
        console.log('저장 버튼 발견! 사용자가 직접 클릭 필요: ', saveBtn.text);
      }
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();

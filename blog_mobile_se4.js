const { chromium } = require('playwright');
const fs = require('fs');
const { randomUUID } = require('crypto');

function seId(prefix = 'SE-') {
  return prefix + randomUUID().substring(0, 20);
}

// 일반 HTML을 SE4 컴포넌트 구조로 변환
function convertToSE4(htmlContent) {
  // body 내용만 파싱
  const bodyMatch = htmlContent.match(/<body>([\s\S]*?)<\/body>/);
  const inner = bodyMatch ? bodyMatch[1].trim() : htmlContent;
  
  // 태그별로 분리
  const tags = [];
  const tagRegex = /<(h[23]|p|table|img)[^>]*>[\s\S]*?<\/\1>/g;
  let match;
  while ((match = tagRegex.exec(inner)) !== null) {
    tags.push(match[0]);
  }
  
  // 각 태그를 SE4 컴포넌트로 변환
  let result = [];
  
  for (const tag of tags) {
    if (tag.startsWith('<h2')) {
      // H2 → se-text 컴포넌트 (강조 스타일)
      const content = tag.replace(/<h2[^>]*>/, '').replace(/<\/h2>/, '');
      result.push(`<div class="se-component se-text se-l-default" id="${seId()}">
        <div class="se-component-content">
          <div class="se-section se-section-text se-l-default">
            <div class="se-module se-module-text __se-unit">
              <p class="se-text-paragraph se-text-paragraph-align-center">
                <span class="se-ff-nanumgothic se-fs32 __se-node se-ff-bold">${content}</span>
              </p>
            </div>
          </div>
        </div>
      </div>`);
    } else if (tag.startsWith('<h3')) {
      const content = tag.replace(/<h3[^>]*>/, '').replace(/<\/h3>/, '');
      result.push(`<div class="se-component se-text se-l-default" id="${seId()}">
        <div class="se-component-content">
          <div class="se-section se-section-text se-l-default">
            <div class="se-module se-module-text __se-unit">
              <p class="se-text-paragraph se-text-paragraph-align-center">
                <span class="se-ff-nanumgothic se-fs32 __se-node">${content}</span>
              </p>
            </div>
          </div>
        </div>
      </div>`);
    } else if (tag.startsWith('<p')) {
      const content = tag.replace(/<p[^>]*>/, '').replace(/<\/p>/, '');
      if (content.trim()) {
        result.push(`<div class="se-component se-text se-l-default" id="${seId()}">
          <div class="se-component-content">
            <div class="se-section se-section-text se-l-default">
              <div class="se-module se-module-text __se-unit">
                <p class="se-text-paragraph se-text-paragraph-align-center">
                  <span class="se-ff-nanumgothic se-fs32 __se-node">${content}</span>
                </p>
              </div>
            </div>
          </div>
        </div>`);
      }
    } else if (tag.startsWith('<table')) {
      // 테이블은 텍스트로 변환
      const text = tag.replace(/<[^>]+>/g, '').trim();
      result.push(`<div class="se-component se-text se-l-default" id="${seId()}">
        <div class="se-component-content">
          <div class="se-section se-section-text se-l-default">
            <div class="se-module se-module-text __se-unit">
              <p class="se-text-paragraph se-text-paragraph-align-center">
                <span class="se-ff-nanumgothic se-fs32 __se-node">${text}</span>
              </p>
            </div>
          </div>
        </div>
      </div>`);
    }
  }
  
  return `<div class="se-components-wrap">${result.join('\n')}</div>`;
}

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    const page = pages.find(p => p.url().includes('Redirect=Update'));
    if (!page) { console.log('페이지 없음'); await context.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(2000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await context.close(); return; }
    
    // 현재 _documentDataStore 메서드 완전 분석
    const ddsInfo = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      const dds = se._documentService._documentDataStore;
      
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(dds));
      const own = Object.keys(dds);
      
      return {
        protoMethods: proto.filter(k => typeof dds[k] === 'function'),
        ownProps: own,
        // getDocumentData 상세
        dataKeys: dds.getDocumentData() ? Object.keys(dds.getDocumentData()) : []
      };
    }).catch(e => ({ error: e.message }));
    console.log('DDS 정보:', JSON.stringify(ddsInfo, null, 2));
    
    // 방법: se-components-wrap의 innerHTML 교체
    const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const se4Html = convertToSE4(mobileHtml);
    console.log('SE4 HTML 생성됨, 길이:', se4Html.length);
    
    // components-wrap 교체
    const replaceResult = await pf.evaluate((newHtml) => {
      try {
        const wrap = document.querySelector('.se-components-wrap');
        if (!wrap) return { ok: false, msg: 'wrap not found' };
        
        // 기존 내용 저장 (복원용)
        const oldHtml = wrap.innerHTML;
        
        // 새 내용 설정
        wrap.innerHTML = newHtml;
        
        // SE4에 변경 알림 - input 이벤트 발생
        const event = new Event('input', { bubbles: true, cancelable: true });
        wrap.dispatchEvent(event);
        
        const changeEvent = new Event('change', { bubbles: true });
        wrap.dispatchEvent(changeEvent);
        
        return { 
          ok: true, 
          oldLen: oldHtml.length,
          newLen: newHtml.length
        };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, se4Html).catch(e => ({ error: e.message }));
    console.log('교체 결과:', JSON.stringify(replaceResult, null, 2));
    
    await page.waitForTimeout(3000);
    
    // 저장 버튼 찾기
    const saveInfo = await pf.evaluate(() => {
      const buttons = document.querySelectorAll('em, button, a, span');
      const btns = [];
      buttons.forEach(b => {
        const t = (b.textContent || '').trim();
        if (t.includes('저장') || t.includes('등록')) {
          btns.push({ tag: b.tagName, text: t.substring(0, 20), cls: (b.className || '').substring(0, 40) });
        }
      });
      return btns;
    }).catch(e => ({ error: e.message }));
    console.log('저장 버튼:', JSON.stringify(saveInfo));
    
    // 확인
    const after = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      const wrap = document.querySelector('.se-components-wrap');
      const compCount = wrap?.querySelectorAll('.se-component').length || 0;
      return {
        title: se.getDocumentTitle(),
        textLen: se.getContentText().length,
        compCount
      };
    }).catch(e => ({ error: e.message }));
    console.log('After:', JSON.stringify(after));
    
    await context.close();
  } catch(e) {
    console.error('FATAL:', e.message);
    console.error(e.stack);
  }
})();

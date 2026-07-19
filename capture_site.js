// aicut.co.kr 전체 페이지 캡처 + 모든 가상 페이지 HTML 추출
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages.find(p => p.url().includes('aicut.co.kr'));
    if (!page) page = pages[0];

    // 1. 메인 페이지 로드
    await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // 2. 전체 HTML 소스 저장 (서버가 보낸 원본)
    const htmlSource = await page.content();
    fs.writeFileSync(path.join(__dirname, 'aicut_full.html'), htmlSource);
    console.log('Full HTML saved: aicut_full.html (' + (htmlSource.length / 1024).toFixed(0) + 'KB)');

    // 3. 각 가상 페이지별 DOM 캡처
    // 각 페이지를 showPage()로 전환 후 주요 콘텐츠 추출
    const virtualPages = ['home', 'pricing', 'service'];
    
    for (const vp of virtualPages) {
      await page.evaluate((p) => {
        if (typeof showPage === 'function') showPage(p);
      }, vp);
      await page.waitForTimeout(800);
      
      const pageContent = await page.content();
      const fileName = `aicut_page_${vp}.html`;
      fs.writeFileSync(path.join(__dirname, fileName), pageContent);
      console.log(`Page '${vp}' saved: ${fileName} (${(pageContent.length / 1024).toFixed(0)}KB)`);

      // 주요 콘텐츠 영역만 추출
      const mainContent = await page.evaluate(() => {
        // 메인 콘텐츠 영역 찾기
        const main = document.querySelector('main, .main-content, #main-content, .app-container, [class*="content"]');
        const sections = document.querySelectorAll('section, .section, [class*="section"]');
        const visibleSections = [];
        sections.forEach(s => {
          if (s.offsetParent !== null || s.style.display !== 'none') {
            visibleSections.push({
              id: s.id,
              class: s.className,
              html: s.outerHTML.slice(0, 2000)
            });
          }
        });
        return {
          mainHtml: main ? main.outerHTML.slice(0, 5000) : 'MAIN NOT FOUND',
          visibleSections: visibleSections
        };
      });

      const contentFile = `aicut_content_${vp}.json`;
      fs.writeFileSync(path.join(__dirname, contentFile), JSON.stringify(mainContent, null, 2));
      console.log(`Content for '${vp}' saved: ${contentFile}`);
    }

    // 4. CSS/JS 리소스 목록 확인
    const resources = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      const scripts = document.querySelectorAll('script[src]');
      return {
        css: Array.from(links).map(l => l.href),
        js: Array.from(scripts).map(s => s.src),
        fonts: Array.from(document.querySelectorAll('link[rel="preconnect"], link[rel="preload"]')).map(l => l.href)
      };
    });
    fs.writeFileSync(path.join(__dirname, 'aicut_resources.json'), JSON.stringify(resources, null, 2));
    console.log('\nResources:', JSON.stringify(resources, null, 2));

    // 5. 페이지별 visible text content 추출 (SEO용)
    const seoContent = await page.evaluate(() => {
      const result = {};
      const sections = [
        { id: 'service-section', name: 'service' },
        { id: 'vfx-section', name: 'vfx' },
        { id: 'process-section', name: 'process' },
        { id: 'steps-section', name: 'steps' },
        { id: 'reviews-section', name: 'reviews' },
        { id: 'pricing-section', name: 'pricing' }
      ];
      sections.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) result[s.name] = el.innerText.slice(0, 500).replace(/\n{3,}/g, '\n\n').trim();
        else result[s.name] = 'NOT FOUND';
      });
      return result;
    });
    console.log('\n=== SEO Content Sections ===');
    Object.entries(seoContent).forEach(([k, v]) => {
      console.log(`\n--- ${k} ---`);
      console.log(v.slice(0, 300));
    });

    console.log('\n✅ All captures complete!');
  } catch(e) {
    console.error('Script Error:', e.message);
    console.error(e.stack);
  }
})();

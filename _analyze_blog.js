// 블로그 포스팅 분석 - 수정 버튼 및 에디터 구조 파악
const { chromium } = require('playwright');

const BLOG_URL = 'https://blog.naver.com/aicut/224341544476';
const CDP_PORT = process.env.CDP_PORT || 9224;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  try {
    console.log('📄 포스팅 로딩...');
    await page.goto(BLOG_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);

    // 스크린샷
    await page.screenshot({ path: '_debug_blog.png', fullPage: false });
    console.log('  ✅ 스크린샷 저장');

    // 페이지 제목
    const title = await page.title();
    console.log(`  📌 제목: ${title}`);

    // 모든 <a>, <button> 태그에서 "수정" 관련 텍스트 찾기
    const editElements = await page.evaluate(() => {
      const all = document.querySelectorAll('a, button, span, div');
      const results = [];
      for (const el of all) {
        const text = (el.textContent || '').trim();
        if (text.includes('수정') && text.length < 20) {
          results.push({
            tag: el.tagName,
            text: text,
            class: el.className?.substring(0, 100),
            id: el.id,
            href: el.href || '',
            rect: el.getBoundingClientRect()
          });
        }
      }
      return results;
    });
    
    console.log(`\n🔍 '수정' 포함 요소 ${editElements.length}개:`);
    editElements.forEach((el, i) => {
      console.log(`  [${i}] <${el.tag}> text="${el.text}" class="${el.class}" href="${el.href}"`);
    });

    // 페이지의 주요 영역들
    const pageInfo = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      const frameSrcs = Array.from(iframes).map(f => f.src?.substring(0, 100) || f.id || 'no-src');
      
      // 네이버 블로그 본문 영역 찾기
      const mainContent = document.querySelector('.se-main-container, .se_component_wrap, .se_sectionArea, .post-view, #post-view');
      
      return {
        iframes: frameSrcs,
        mainContentTag: mainContent?.tagName,
        mainContentClass: mainContent?.className?.substring(0, 100),
        url: window.location.href,
      };
    });
    
    console.log(`\n📋 페이지 정보:`);
    console.log(`  URL: ${pageInfo.url}`);
    console.log(`  iframe 수: ${pageInfo.iframes.length}`);
    pageInfo.iframes.forEach((s, i) => console.log(`    [${i}] ${s}`));
    console.log(`  본문: ${pageInfo.mainContentTag} .${pageInfo.mainContentClass}`);

  } catch(err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await page.close();
  }
})();

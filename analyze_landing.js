const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // 새 페이지로 aicut.co.kr 열기
  const page = pages[0];
  await page.goto('https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  // CTA 버튼 분석
  const ctaBtns = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    return btns
      .map(el => {
        const rect = el.getBoundingClientRect();
        const text = el.innerText?.trim() || el.getAttribute('aria-label') || '';
        if (!text || rect.width === 0) return null;
        return {
          tag: el.tagName,
          text: text.substring(0, 50),
          href: el.href || '',
          visible: rect.width > 0 && rect.height > 0,
          y: Math.round(rect.y),
          prominent: text.includes('상담') || text.includes('문의') || text.includes('신청') || 
                     text.includes('시작') || text.includes('무료') || text.includes('견적') ||
                     text.includes('연락') || text.includes('체험')
        };
      })
      .filter(b => b && b.visible)
      .slice(0, 30);
  });

  console.log('\n=== CTA 버튼 목록 ===');
  ctaBtns.forEach(b => console.log(`  [y=${b.y}] ${b.tag} "${b.text}" ${b.prominent ? '⭐CTA' : ''} ${b.href ? '→'+b.href.substring(0,50) : ''}`));

  // 페이지 전체 텍스트 구조
  const structure = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
    return headings.map(h => ({ tag: h.tagName, text: h.innerText?.trim().substring(0, 80) }));
  });

  console.log('\n=== 헤딩 구조 ===');
  structure.forEach(h => console.log(`  ${h.tag}: ${h.text}`));

  // 폼 요소 확인
  const forms = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, form'));
    return inputs.map(el => ({
      tag: el.tagName,
      type: el.type || '',
      placeholder: el.placeholder || '',
      name: el.name || ''
    })).slice(0, 10);
  });

  console.log('\n=== 폼/입력 요소 ===');
  forms.forEach(f => console.log(`  ${f.tag} type="${f.type}" placeholder="${f.placeholder}" name="${f.name}"`));

  // 스크린샷
  await page.screenshot({ path: 'aicut_landing.png', fullPage: false });
  console.log('\n스크린샷: aicut_landing.png');

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

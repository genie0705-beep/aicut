const fs = require('fs');
const h = fs.readFileSync('aicut_full.html', 'utf8');

// ===================== EXTRACT PARTS =====================

function extractSection(id) {
  const idx = h.indexOf('id="' + id + '"');
  if (idx === -1) return null;
  const sectionStart = h.lastIndexOf('<section', idx);
  const sectionEnd = h.indexOf('</section>', idx) + 10;
  if (sectionStart > -1 && sectionEnd > sectionStart) {
    return h.slice(sectionStart, sectionEnd);
  }
  return null;
}

function extractAllBetween(startMarker, endMarker) {
  const s = h.indexOf(startMarker);
  if (s === -1) return '';
  const e = h.indexOf(endMarker, s + startMarker.length);
  if (e === -1) return '';
  return h.slice(s, e + endMarker.length);
}

// Extract head
const headMatch = h.match(/<head>([\s\S]*?)<\/head>/);
const headContent = headMatch ? headMatch[1] : '';

// Extract nav
const navStart = h.indexOf('<nav id="mainNav"');
const navEnd = h.indexOf('</nav>') + 6;
let navHtml = h.slice(navStart, navEnd);

// Fix navigation links for static pages
navHtml = navHtml
  .replace(/onclick="showPage\('home'\)"/g, 'href="/" style="cursor:pointer"')
  .replace(/onclick="showPage\('pricing'\)"/g, 'href="/pricing" style="cursor:pointer"')
  .replace(/onclick="scrollTo_\('#process-section'\)"/g, 'href="/service" style="cursor:pointer"')
  .replace(/onclick="scrollTo_\('#service-section'\)"/g, 'href="/service" style="cursor:pointer"')
  .replace(/onclick="scrollTo_\('#vfx-section'\)"/g, 'href="/service" style="cursor:pointer"')
  .replace(/onclick="scrollTo_\('#steps-section'\)"/g, 'href="/#steps-section" style="cursor:pointer"')
  .replace(/onclick="scrollTo_\('#reviews-section'\)"/g, 'href="/#reviews-section" style="cursor:pointer"')
  .replace(/onclick="mobileGo\('([^']+)'\)"/g, 'href="$1" style="cursor:pointer"')
  .replace(/href="##/g, 'href="/#')
  .replace(/href="#([^"])/g, 'href="/#$1');

// Extract scripts
const allScripts = [];
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let sm;
while ((sm = scriptRegex.exec(h)) !== null) {
  allScripts.push(sm[1]);
}
const sharedScripts = allScripts.join('\n');

// Extract external scripts
const extScripts = h.match(/<script[^>]*src="[^"]*"[^>]*><\/script>/g) || [];

// Extract CSS links
const cssLinks = h.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];

// Extract inline styles
const inlineStyles = h.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];

// Extract footer / contact area
const footerMatch = h.match(/<footer[\s\S]*?<\/footer>/);
const footerHtml = footerMatch ? footerMatch[0] : '';

// ===================== CORE SECTIONS =====================
const serviceSection = extractSection('service-section') || '';
const vfxSection = extractSection('vfx-section') || '';
const stepsSection = extractSection('steps-section') || '';
const reviewsSection = extractSection('reviews-section') || '';
const faqSection = extractSection('faq-section') || '';

// Find hero section (for home page)
const heroStart = h.indexOf('id="heroSection"');
let heroHtml = '';
if (heroStart > -1) {
  const sectionStart = h.lastIndexOf('<section', heroStart);
  const sectionEnd = h.indexOf('</section>', heroStart) + 10;
  if (sectionStart > -1) heroHtml = h.slice(sectionStart, sectionEnd);
}

// Find stats/process sections
const painSection = extractSection('pain-section') || '';
const statsSection = extractSection('stats-section') || '';
const processSection = extractSection('process-section') || '';

// ===================== BUILD FUNCTIONS =====================

function buildPage(title, desc, bodyHtml, extraHead = '') {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="robots" content="index, follow">
  ${cssLinks.join('\n  ')}
  ${inlineStyles.join('\n  ')}
  ${extraHead}
</head>
<body>
  ${navHtml}
  <main>
    ${bodyHtml}
  </main>
  ${footerHtml}
  ${extScripts.join('\n  ')}
  <script>
  ${sharedScripts}
  </script>
</body>
</html>`;
}

// ===================== 1. index.html =====================
// Extract home page content (exact byte boundary from page-home div to page-pricing div)
const homeDivStart = h.indexOf('<div id="page-home"');
const homeDivEnd = h.indexOf('<div id="page-pricing"');
let homeBodyContent = '';
if (homeDivStart > -1 && homeDivEnd > homeDivStart) {
  homeBodyContent = h.slice(homeDivStart, homeDivEnd);
} else {
  homeBodyContent = `${heroHtml}${painSection}${statsSection}${processSection}${serviceSection}${vfxSection}${stepsSection}${reviewsSection}${faqSection}`;
}

fs.writeFileSync('index.html', buildPage(
  '에이컷 AICUT — 채용 없이 매월 납품하는 영상편집 파트너',
  '숏폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+1 납품, 재계약률 92%. 영상 편집 아웃소싱은 에이컷',
  homeBodyContent,
  '<script>window.STATIC_PAGE = "home";</script>'
));
console.log('✅ index.html created');

// ===================== 2. service.html =====================
const serviceBody = `
  <div class="page-service-header" style="padding-top:80px;background:var(--gray-50);">
    <div class="section-center" style="text-align:center;padding:60px 24px;">
      <h1 data-i18n="service_title" style="font-size:clamp(28px,4vw,48px);font-weight:800;margin-bottom:20px;">영상 편집 서비스</h1>
      <p data-i18n="service_sub" style="font-size:18px;color:var(--gray-500);max-width:600px;margin:0 auto;">숏폼부터 유튜브, VFX까지. 에이컷의 전담팀이 매월 정기 납품합니다.</p>
    </div>
  </div>
  ${serviceSection}
  ${vfxSection}
  ${stepsSection}
  ${faqSection.replace('<section id="faq-section"', '<section id="faq-section" style="scroll-margin-top:52px"')}
`;

fs.writeFileSync('service.html', buildPage(
  '영상편집 아웃소싱 서비스 — 숏폼·유튜브·VFX | 에이컷 AICUT',
  '에이컷 영상편집 서비스 소개. 숏폼, 유튜브, 기업홍보, VFX/CG/모션그래픽까지. 전담 에디터가 매월 정기 납품.',
  serviceBody,
  '<script>window.STATIC_PAGE = "service";</script>'
));
console.log('✅ service.html created');

// ===================== 3. pricing.html =====================
// Extract pricing-specific content from the page-pricing div (exact byte boundary)
const pricingDivStart = h.indexOf('<div id="page-pricing"');
const pricingDivEnd = h.indexOf('<div id="page-client"');
let pricingBodyContent = '';
if (pricingDivStart > -1 && pricingDivEnd > pricingDivStart) {
  pricingBodyContent = h.slice(pricingDivStart, pricingDivEnd);
} else {
  // fallback
  pricingBodyContent = extractSection('pricing-section') || '';
}

fs.writeFileSync('pricing.html', buildPage(
  '에이컷 요금제 — 숏폼·유튜브 영상편집 월 정기 플랜 | AICUT',
  '에이컷 영상편집 요금제. STARTER 월 20편, STANDARD 월 40편, ENTERPRISE 맞춤 견적. 전담 에디터 배정, D+1 납품.',
  pricingBodyContent,
  '<script>window.STATIC_PAGE = "pricing";</script>'
));
console.log('✅ pricing.html created');

// ===================== 4. faq.html =====================
const faqBody = `
  <div class="page-faq-header" style="padding-top:80px;background:var(--gray-50);">
    <div class="section-center" style="text-align:center;padding:60px 24px;">
      <h1 data-i18n="faq_title" style="font-size:clamp(28px,4vw,48px);font-weight:800;margin-bottom:20px;">자주 묻는 질문</h1>
      <p data-i18n="faq_sub" style="font-size:18px;color:var(--gray-500);">에이컷 이용 전 궁금한 점을 확인하세요.</p>
    </div>
  </div>
  ${faqSection}
`;

fs.writeFileSync('faq.html', buildPage(
  '자주 묻는 질문 — 영상편집 아웃소싱 FAQ | 에이컷 AICUT',
  '에이컷 영상편집 FAQ. 계약, 요금제, 작업 방식, 납품 기간, 수정 정책 등 자주 묻는 질문을 확인하세요.',
  faqBody,
  '<script>window.STATIC_PAGE = "faq";</script>'
));
console.log('✅ faq.html created');

// ===================== 5. 404.html (SPA fallback) =====================
const fallbackJs = `
<script>
// SPA fallback for GitHub Pages
(function() {
  var path = window.location.pathname;
  if (path && path !== '/') {
    var page = path.replace('.html', '').replace(/^\\//, '');
    if (page === 'pricing' && typeof showPage === 'function') {
      showPage('pricing');
    } else if ((page === 'service' || page === 'services') && typeof scrollTo_ === 'function') {
      scrollTo_('#service-section');
    } else if (page === 'faq' && typeof scrollTo_ === 'function') {
      scrollTo_('#faq-section');
    } else if (page === 'contact' && typeof openB2B === 'function') {
      openB2B();
    }
  }
})();
</script>`;

// 404.html = index.html + fallback JS
let indexContent = fs.readFileSync('index.html', 'utf8');
indexContent = indexContent.replace('</body>', fallbackJs + '\n</body>');
fs.writeFileSync('404.html', indexContent);
console.log('✅ 404.html created');

// ===================== 6. sitemap.xml =====================
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aicut.co.kr/</loc>
    <lastmod>2026-07-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aicut.co.kr/service</loc>
    <lastmod>2026-07-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aicut.co.kr/pricing</loc>
    <lastmod>2026-07-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aicut.co.kr/faq</loc>
    <lastmod>2026-07-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://aicut.co.kr/contact</loc>
    <lastmod>2026-07-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
fs.writeFileSync('sitemap.xml', sitemap);
console.log('✅ sitemap.xml created');

// ===================== FILE SIZES =====================
console.log('\n=== Generated Files ===');
['index.html', 'service.html', 'pricing.html', 'faq.html', '404.html', 'sitemap.xml'].forEach(f => {
  const size = fs.statSync(f).size;
  console.log(f + ': ' + (size / 1024).toFixed(0) + 'KB');
});
console.log('\n✅ All pages generated!');

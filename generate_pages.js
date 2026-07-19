const fs = require('fs');
const html = fs.readFileSync('aicut_full.html', 'utf8');

// === Helper: extract text content for SEO ===
function extractTextBetween(html, start, end) {
  const s = html.indexOf(start);
  if (s === -1) return '';
  const e = end ? html.indexOf(end, s + start.length) : html.length;
  if (e === -1) return html.slice(s + start.length).trim();
  return html.slice(s + start.length, e).trim();
}

// === 1. Extract shared HEAD (meta, CSS, fonts, inline styles, preloads) ===
const headStart = html.indexOf('<head>');
const headEnd = html.indexOf('</head>');
const sharedHead = html.slice(headStart + 6, headEnd);

// === 2. Extract the navigation bar ===
const navStart = html.indexOf('<nav');
const navEnd = html.indexOf('</nav>') + 6;
const navHtml = html.slice(navStart, navEnd)
  .replace(/onclick="showPage\('home'\)"/g, 'href="/" ')
  .replace(/onclick="showPage\('pricing'\)"/g, 'href="/pricing" ')
  .replace(/onclick="scrollTo_\('([^']+)'\)"/g, (m, id) => {
    if (id === 'process-section' || id === 'service-section') return `href="/service" `;
    if (id === 'steps-section') return `href="/#steps-section" `;
    if (id === 'reviews-section') return `href="/#reviews-section" `;
    if (id === 'vfx-section') return `href="/service" `;
    return `href="/#${id}" `;
  })
  // Keep login/register modals working but change to button
  .replace(/onclick="openModal\('login'\)"/g, 'href="/" onclick="return false;" class="login-btn" data-modal="login"')
  .replace(/onclick="closeMobileMenu\(\);openModal\('login'\)"/g, 'href="/" onclick="return false;" class="login-btn" data-modal="login"');

// === 3. Extract footer ===
const footerStart = html.indexOf('<footer');
const footerEnd = html.indexOf('</footer>') + 9;
let footerHtml = '';
if (footerStart !== -1 && footerEnd > footerStart) {
  footerHtml = html.slice(footerStart, footerEnd);
} else {
  // Get contact area before </body>
  const bodyEnd = html.indexOf('</body>');
  const contactArea = html.slice(Math.max(0, bodyEnd - 2000), bodyEnd);
  footerHtml = contactArea.includes('footer') ? '' : '<footer class="site-footer">' + html.match(/카카오톡[\s\S]{0,500}이메일[\s\S]{0,500}master@aicut\.co\.kr/)?.[0]?.slice(0, 500) || '' + '</footer>';
}

// === 4. Extract each section's HTML ===
function extractSection(html, sectionId) {
  const regex = new RegExp(`(<section[^>]*id="${sectionId}"[^>]*>[\\s\\S]*?<\\/section>)`);
  const match = html.match(regex);
  return match ? match[1] : `<!-- Section ${sectionId} not found -->`;
}

// Get main page content (everything in page-home)
const pageHomeRegex = /<div[^>]*id="page-home"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<!--\s*END\s+page-home/i;
let homeContent = '';
const homeMatch = html.match(pageHomeRegex);
if (homeMatch) {
  homeContent = homeMatch[1];
} else {
  // Fallback: get hero + all sections
  const heroMatch = html.match(/<section[^>]*class="hero-section[^>]*>[\s\S]*?<\/section>/);
  homeContent = heroMatch ? heroMatch[0] : '<!-- home content -->';
}

// Get pricing page content
const pricingRegex = /<div[^>]*id="page-pricing"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<!--\s*END\s+page-pricing/i;
let pricingContent = '';
const pricingMatch = html.match(pricingRegex);
if (pricingMatch) {
  pricingContent = pricingMatch[1];
} else {
  pricingContent = extractSection(html, 'pricing-section');
}

// === 5. Extract all inline scripts (shared across pages) ===
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
const allScripts = [];
let sm;
while ((sm = scriptRegex.exec(html)) !== null) {
  allScripts.push(sm[1]);
}
const sharedScripts = allScripts.join('\n');

// === 6. Extract external scripts ===
const extScripts = html.match(/<script[^>]*src="[^"]*"[^>]*><\/script>/g) || [];
const extScriptsHtml = extScripts.join('\n');

// === 7. Extract external CSS ===
const cssLinks = html.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];
const cssLinksHtml = cssLinks.join('\n');

// === 8. Build full pages ===
function buildPage(title, description, bodyContent, extraHead = '') {
  const header = `<header class="site-header">${navHtml}</header>`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  ${cssLinksHtml}
  ${extraHead}
</head>
<body>
  ${header}
  <main>
    ${bodyContent}
  </main>
  ${footerHtml}
  
  <!-- Shared scripts -->
  ${extScriptsHtml}
  <script>
  ${sharedScripts}
  </script>
</body>
</html>`;
}

// ===== GENERATE PAGES =====

// 1. index.html (메인 페이지)
const indexHtml = buildPage(
  '에이컷 AICUT — 채용 없이 매월 납품하는 영상편집 파트너',
  '숏폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+1 납품, 재계약률 92%. 영상 편집 아웃소싱은 에이컷',
  homeContent
);
fs.writeFileSync('index.html', indexHtml);
console.log('✅ index.html created (' + (indexHtml.length/1024).toFixed(0) + 'KB)');

// 2. pricing.html (요금제)
const pricingHtml = buildPage(
  '에이컷 요금제 — 숏폼·유튜브 영상편집 월 정기 플랜 | AICUT',
  '에이컷 영상편집 요금제. STARTER 월 20편, STANDARD 월 40편, ENTERPRISE 맞춤 견적. 전담 에디터 배정, D+1 납품.',
  pricingContent
);
fs.writeFileSync('pricing.html', pricingHtml);
console.log('✅ pricing.html created (' + (pricingHtml.length/1024).toFixed(0) + 'KB)');

// 3. service.html (서비스 소개)
const serviceSections = [
  extractSection(html, 'service-section'),
  extractSection(html, 'vfx-section'),
  extractSection(html, 'steps-section')
].join('\n');
const serviceHtml = buildPage(
  '영상편집 아웃소싱 서비스 — 숏폼·유튜브·VFX | 에이컷 AICUT',
  '에이컷 영상편집 서비스 소개. 숏폼, 유튜브, 기업홍보, VFX/CG/모션그래픽까지. 전담 에디터가 매월 정기 납품.',
  serviceSections
);
fs.writeFileSync('service.html', serviceHtml);
console.log('✅ service.html created (' + (serviceHtml.length/1024).toFixed(0) + 'KB)');

// 4. faq.html (FAQ)
const faqSection = extractSection(html, 'faq-section');
const faqHtml = buildPage(
  '자주 묻는 질문 — 영상편집 아웃소싱 FAQ | 에이컷 AICUT',
  '에이컷 영상편집 FAQ. 계약, 요금제, 작업 방식, 납품 기간, 수정 정책 등 자주 묻는 질문을 확인하세요.',
  faqSection
);
fs.writeFileSync('faq.html', faqHtml);
console.log('✅ faq.html created (' + (faqHtml.length/1024).toFixed(0) + 'KB)');

// 5. 404.html (SPA fallback)
// Copy index.html + add URL routing logic
const fallbackScript = `
<script>
// SPA fallback for GitHub Pages - handle URL routing
(function() {
  var path = window.location.pathname;
  if (path && path !== '/') {
    // Try to show the appropriate page
    if (path === '/pricing' || path === '/pricing.html') {
      if (typeof showPage === 'function') showPage('pricing');
    } else if (path === '/service' || path === '/service.html') {
      if (typeof scrollTo_ === 'function') scrollTo_('#service-section');
    } else if (path === '/faq' || path === '/faq.html') {
      if (typeof scrollTo_ === 'function') scrollTo_('#faq-section');
    } else if (path === '/contact' || path === '/contact.html') {
      if (typeof openB2B === 'function') openB2B();
    }
  }
})();
</script>`;
const notFoundHtml = indexHtml.replace('</body>', fallbackScript + '\n</body>');
fs.writeFileSync('404.html', notFoundHtml);
console.log('✅ 404.html created (' + (notFoundHtml.length/1024).toFixed(0) + 'KB)');

// 6. sitemap.xml
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
</urlset>`;
fs.writeFileSync('sitemap.xml', sitemap);
console.log('✅ sitemap.xml created');

console.log('\n=== ALL FILES GENERATED ===');
console.log('Files in workspace:');
const files = fs.readdirSync(__dirname).filter(f => 
  f.endsWith('.html') || f.endsWith('.xml')
);
files.forEach(f => {
  if (fs.statSync(f).isFile()) {
    console.log('  ' + f + ' (' + (fs.statSync(f).size / 1024).toFixed(0) + 'KB)');
  }
});

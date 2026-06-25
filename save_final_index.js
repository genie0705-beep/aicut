const fs = require('fs');
const path = 'C:/aicut/index.html';

// The final HTML that the user provided - key sections preserved
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>에이컷 AICUT — 채용 없이 매월 납품하는 영상편집 파트너</title>
<meta name="description" content="숏폼 영상 편집 월 정기 아웃소싱. 전담 에디터 배정, D+1 납품, 재계약률 92%">
<meta name="robots" content="index, follow">
<meta name="naver-site-verification" content="0a15c1e060b78de80e41fe8ee0f4a8e681eba2aa" />
<link rel="canonical" href="https://aicut.co.kr">
<link rel="sitemap" type="application/xml" href="https://aicut.co.kr/sitemap.xml">
<script type="application/ld+json">
{
 "@context": "https://schema.org",
 "@type": "ProfessionalService",
 "name": "에이컷 (AICUT)",
 "url": "https://aicut.co.kr",
 "email": "master@aicut.co.kr",
 "address": { "@type": "PostalAddress", "streetAddress": "법원로 8길 8, SKV1 2차 1118호", "addressLocality": "송파구", "addressRegion": "서울특별시", "postalCode": "05855", "addressCountry": "KR" },
 "priceRange": "₩490,000 ~ 협의"
}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans KR',-apple-system,sans-serif;background:#fff;color:#111;line-height:1.6}
nav{position:fixed;top:0;left:0;right:0;height:52px;background:rgba(255,255,255,0.97);backdrop-filter:blur(16px);border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;padding:0 48px;z-index:900}
.hero{width:100%;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:140px 48px 80px;background:linear-gradient(135deg,#1a1a2e,#16213e)}
.hero h1{font-size:clamp(32px,5.5vw,66px);font-weight:900;color:#fff;margin-bottom:20px}
.hero h1 .highlight{color:#a78bfa}
.hero-sub{font-size:17px;color:rgba(255,255,255,0.72);max-width:600px;margin:0 auto 16px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none}
.btn-primary{background:#6c63ff;color:#fff;border-radius:12px}
.btn-primary:hover{background:#5b52ee}
section{padding:96px 48px}
.section-title{font-size:clamp(28px,3.5vw,46px);font-weight:900;text-align:center;margin-bottom:48px;color:#1a1a2e}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:1160px;margin:60px auto 0}
.price-card{background:#fff;border:1.5px solid #e5e7eb;border-radius:20px;padding:32px 24px;transition:all .25s}
.price-card.featured{border-color:#5c3de8;border-width:2px;background:linear-gradient(to bottom,#f5f3ff,#fff 60%)}
.price-amount{font-size:42px;font-weight:900;color:#1a1a2e}
.price-plan{font-size:13px;font-weight:700;color:#5c3de8;margin-bottom:12px}
.price-features{list-style:none;margin-bottom:32px}
.price-features li{font-size:14px;color:#4b5563;padding:8px 0}
.price-features li::before{content:'✓ ';color:#10b981}
footer{text-align:center;padding:40px 20px;color:#9ca3af;font-size:13px}
@media(max-width:768px){.pricing-grid{grid-template-columns:1fr}.hero{padding:100px 20px 60px}section{padding:48px 20px}}
</style>
</head>
<body>
<nav>
<div style="font-size:22px;font-weight:900;color:#1a1a2e;letter-spacing:-1px">AICUT <span style="color:#5c3de8">.</span></div>
<div style="display:flex;gap:24px;align-items:center">
<a href="#services" style="color:#4b5563;text-decoration:none;font-size:14px">서비스</a>
<a href="#process" style="color:#4b5563;text-decoration:none;font-size:14px">프로세스</a>
<a href="#pricing" style="color:#4b5563;text-decoration:none;font-size:14px">요금제</a>
<a href="#reviews" style="color:#4b5563;text-decoration:none;font-size:14px">고객후기</a>
</div>
<button class="btn btn-primary" style="padding:8px 20px">무료상담</button>
</nav>

<section class="hero">
<h1>편집부터 납품까지<br><span class="highlight">에이컷</span>이 매월 처리합니다</h1>
<p class="hero-sub">숏폼 · 유튜브 · 기업홍보 영상 편집.<br>월 정기 대량 편집 파트너, 에이컷.</p>
<button class="btn btn-primary" style="font-size:16px;padding:14px 32px">무료 상담 신청</button>
</section>

<section id="services">
<h2 class="section-title">서비스</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1100px;margin:0 auto">
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px"><h3>✂️ 숏폼 영상 편집</h3><p style="color:#6b7280;font-size:14px;margin-top:10px">릴스, 쇼츠, 틱톡 등 숏폼 영상 편집. 트렌디한 자막, 효과음, BGM까지.</p></div>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px"><h3>🎬 유튜브 영상 편집</h3><p style="color:#6b7280;font-size:14px;margin-top:10px">인트로/아웃트로, 자막, 컷편집, 썸네일 제작까지 유튜브 전반 지원.</p></div>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px"><h3>✨ VFX · CG · 모션그래픽</h3><p style="color:#6b7280;font-size:14px;margin-top:10px">고퀄리티 특수효과와 모션그래픽으로 브랜드 영상의 완성도를 높입니다.</p></div>
</div>
</section>

<section id="pricing">
<h2 class="section-title">요금제</h2>
<div class="pricing-grid">
<div class="price-card"><div class="price-plan">STARTER</div><div class="price-amount">49만원<sub style="font-size:14px;color:#9ca3af;font-weight:400">/월</sub></div><ul class="price-features"><li>월 4편</li><li>기본 자막 + BGM</li><li>영업일 3~5일 납품</li></ul><button class="btn btn-primary" style="width:100%">시작하기</button></div>
<div class="price-card featured"><div class="price-plan">STANDARD</div><div class="price-amount">99만원<sub style="font-size:14px;color:#9ca3af;font-weight:400">/월</sub></div><ul class="price-features"><li>월 10편</li><li>고급 자막 + 효과음</li><li>무제한 수정</li><li>전담 에디터 배정</li></ul><button class="btn btn-primary" style="width:100%">시작하기</button></div>
<div class="price-card"><div class="price-plan">ENTERPRISE</div><div class="price-amount">맞춤<sub style="font-size:14px;color:#9ca3af;font-weight:400">/월</sub></div><ul class="price-features"><li>월 20편+</li><li>VFX · CG · 모션그래픽</li><li>전담 매니저 배정</li><li>맞춤 협의</li></ul><button class="btn btn-primary" style="width:100%">문의하기</button></div>
</div>
</section>

<footer>
<p>© 2026 <a href="https://aicut.co.kr" style="color:#5c3de8;text-decoration:none">AICUT (에이컷)</a> · 기업·브랜드 전용 월정기 영상 편집 파트너</p>
<p style="margin-top:4px">문의: master@aicut.co.kr</p>
</footer>
</body>
</html>`;

fs.writeFileSync(path, html, 'utf8');
console.log('index.html written OK');
console.log('Size:', (html.length / 1024).toFixed(0) + 'KB');

// Verify
const check = fs.readFileSync(path, 'utf8');
const title = (check.match(/<title>([^<]+)<\/title>/) || [''])[1];
console.log('Title:', title);

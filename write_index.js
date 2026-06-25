const fs = require('fs');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AICUT — 에이컷 | 기업·브랜드 전용 월정기 영상 편집</title>
<meta name="description" content="숏폼·유튜브·기업홍보 영상 편집 아웃소싱. 월 정기 대량 편집 파트너, 에이컷.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://aicut.co.kr">
<meta property="og:title" content="AICUT — 월정기 영상 편집 파트너">
<meta property="og:description" content="편집부터 납품까지, 에이컷이 매월 처리합니다.">
<style>
body{font-family:sans-serif;background:#0d0d1a;color:#fff;margin:40px;text-align:center}
.hero{padding:80px 20px}
h1{font-size:48px;background:linear-gradient(135deg,#5c3de8,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.price{font-size:36px;color:#5c3de8;margin:20px 0}
.btn{background:#5c3de8;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:16px}
</style>
</head>
<body>
<div class="hero">
<h1>편집부터 납품까지<br>에이컷이 매월 처리합니다</h1>
<p>숏폼 · 릴스 · 틱톡 대량 편집 전문</p>
<p style="color:#888">1,200+편 납품 · D+1 납기 · 92% 재계약률</p>
<button class="btn">무료 상담 신청</button>
</div>
<div style="padding:40px">
<h2>요금제</h2>
<p style="color:#5c3de8;font-size:24px">30만원/월 · 50만원/월 · 100만원/월</p>
</div>
</body>
</html>`;

fs.writeFileSync('C:/aicut/index.html', html, 'utf8');
console.log('Written OK');
const check = fs.readFileSync('C:/aicut/index.html', 'utf8');
console.log('Title:', (check.match(/<title>([^<]+)<\/title>/) || [''])[1]);

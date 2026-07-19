const fs = require('fs');
const html = fs.readFileSync('blog_realestate_body_v2.html', 'utf8');

const ps = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || [];
const texts = ps.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(p => p && !p.startsWith('#'));
const tot = texts.reduce((a,b) => a+b.length, 0);
const over70 = texts.filter(p => p.length > 70).length;
const avg = Math.round(tot/texts.length);

console.log('=== 기본 ===');
console.log('본문:', tot, '자');
console.log('문단:', texts.length, '개, 평균', avg, '자');
console.log('70자 초과:', over70, '개');
console.log('H2:', (html.match(/<h2/g)||[]).length);
console.log('H3:', (html.match(/<h3/g)||[]).length);
console.log('Strong:', (html.match(/<strong>/g)||[]).length);
console.log('해시태그:', (html.match(/#[가-힣\w]+/g)||[]).length);

console.log('\n=== CTA ===');
console.log('카톡:', html.includes('pf.kakao.com') ? '✅' : '❌');
console.log('메일:', html.includes('master@aicut.co.kr') ? '✅' : '❌');
console.log('홈페이지:', html.includes('aicut.co.kr') ? '✅' : '❌');

console.log('\n=== 키워드 ===');
const kws = ['부동산', '분양 마케팅', '숏폼', '매물 영상', '하반기', '중개법인', '공인중개사', '릴스'];
kws.forEach(k => {
  const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  console.log('  ' + k + ': ' + (html.match(re) || []).length + '회');
});

console.log('\n=== 70자 초과 ===');
texts.forEach((t, i) => {
  const lineNum = i + 1;
  const prefix = '[' + lineNum + '][' + t.length + '자]';
  if (t.length > 70) console.log('  ⚠️ ' + prefix + ' ' + t.slice(0, 50) + '...');
});

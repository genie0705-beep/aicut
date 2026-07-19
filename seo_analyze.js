const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  const postUrl = 'https://m.blog.naver.com/aicut/224349792018';
  
  console.log('=== 블로그 포스팅 SEO 분석 ===\n');
  console.log(`URL: ${postUrl}\n`);

  // 페이지 로드
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);

  // 1. 메타 정보
  const meta = await page.evaluate(() => {
    const title = document.title;
    const getMeta = (name) => {
      const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return el ? el.getAttribute('content') : '';
    };
    return {
      title,
      description: getMeta('description'),
      ogTitle: getMeta('og:title'),
      ogDesc: getMeta('og:description'),
      keywords: getMeta('keywords'),
    };
  });
  console.log('1️⃣  메타 정보:');
  console.log(`   제목(Title): ${meta.title}`);
  console.log(`   설명(Description): ${meta.description?.substring(0, 100)}`);
  console.log(`   OG 제목: ${meta.ogTitle}`);
  console.log(`   OG 설명: ${meta.ogDesc?.substring(0, 100)}`);
  console.log(`   키워드 태그: ${meta.keywords || '(없음)'}`);

  // 2. 본문 분석
  const content = await page.evaluate(() => {
    // 네이버 모바일 페이지 본문 선택자
    const seCanvas = document.querySelector('.se-main-container, .post-content, .se-text, [class*="se_component"]');
    const text = seCanvas ? seCanvas.innerText : document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines;
  });

  const fullText = content.join(' ');
  console.log(`\n2️⃣  본문 분석:`);
  console.log(`   전체 분량: ${fullText.length}자`);
  console.log(`   문단 수: ${content.length}개`);

  // 3. H 태그 확인
  const headings = await page.evaluate(() => {
    const hTags = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(hTags).map(h => ({ tag: h.tagName, text: h.innerText.substring(0, 50) }));
  });
  console.log(`\n3️⃣  제목 태그(H):`);
  if (headings.length > 0) {
    headings.forEach(h => console.log(`   ${h.tag}: ${h.text}`));
  } else {
    console.log('   ❌ H 태그 없음');
  }

  // 4. Strong 태그
  const strongCount = await page.evaluate(() => document.querySelectorAll('strong, b').length);
  console.log(`\n4️⃣  굵기(Strong) 태그: ${strongCount}개`);

  // 5. 이미지 분석
  const images = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(img => ({
      src: (img.src || '').substring(0, 60),
      alt: img.alt || '(alt 없음)',
      width: img.naturalWidth,
      height: img.naturalHeight
    }));
  });
  console.log(`\n5️⃣  이미지 분석:`);
  console.log(`   총 이미지: ${images.length}개`);
  let altCount = 0;
  images.forEach((img, i) => {
    const hasAlt = img.alt !== '(alt 없음)' && img.alt.length > 0;
    if (hasAlt) altCount++;
    if (i < 8) console.log(`   [${i+1}] alt="${img.alt?.substring(0, 40)}" (${img.width}x${img.height})`);
  });
  console.log(`   alt 태그 있음: ${altCount}/${images.length}`);

  // 6. 키워드 분석
  const keywords = [
    '날씨별', '서울숲', '성수동', '코엑스', '별마당도서관', 
    '북서울꿈의숲', '양재천', '양재꽃시장', '올림픽공원', '석촌호수', '잠실',
    '주말나들이', '7월', '여름', '장마', '실내데이트', '맥도날드', '성심당',
    '맘스터치', '서브웨이', '빕스', '에이컷'
  ];
  console.log(`\n6️⃣  키워드 빈도:`);
  keywords.forEach(kw => {
    const count = (fullText.match(new RegExp(kw, 'g')) || []).length;
    if (count > 0) console.log(`   ${kw}: ${count}회`);
  });

  // 7. 해시태그
  const hashtags = content.filter(l => l.startsWith('#'));
  console.log(`\n7️⃣  해시태그: ${hashtags.length}개`);
  if (hashtags.length > 0) console.log(`   ${hashtags[hashtags.length-1].substring(0, 100)}...`);

  console.log('\n=== 분석 완료 ===');
})();

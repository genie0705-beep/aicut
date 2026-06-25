const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Close any modal
  await adPage.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.trim() === '닫기' && btn.offsetParent !== null) btn.click();
    });
  });
  await adPage.waitForTimeout(500);
  
  const allKeywords = [];
  
  async function parseCurrentPage() {
    const text = await adPage.evaluate(() => document.body.innerText);
    const lines = text.split('\n');
    
    // Parse keywords from the table text
    const pageKeywords = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      // Keyword names are standalone lines (no numbers/symbols, Korean mainly)
      if (line.match(/^[가-힣0-9#&()/]+$/) && line.length >= 2 && line.length <= 20 &&
          !line.includes('원') && !line.includes('키워드') && !line.includes('결과') &&
          !line.includes('보기') && !line.includes('모든') && !line.includes('전체') &&
          !line.includes('노출') && !line.includes('확장') && !line.includes('기업') && !line.includes('고객') &&
          !line.includes('광고주') && !line.includes('검색') && !line.includes('계정') &&
          !line.includes('비즈') && !line.includes('구성') && !line.includes('대시') &&
          !line.includes('이용') && !line.includes('운영') && !line.includes('정보') &&
          !line.includes('개인') && !line.includes('네이버') && !line.includes('사업자') &&
          !line.includes('통신') && !line.includes('대표') && !line.includes('주소') &&
          !line.includes('도구') && !line.includes('보고서') && !line.includes('즐겨') &&
          !line.includes('파워') && !line.includes('쇼핑') && !line.includes('플레이스') &&
          !line.includes('브랜드') && !line.includes('콘텐츠') && !line.includes('상품') &&
          !line.includes('성과') && !line.includes('매체') && !line.includes('소재') &&
          !line.includes('타겟') && !line.includes('새') && !line.includes('입찰') &&
          !line.includes('선택') && !line.includes('다운') && !line.includes('열') &&
          !line.includes('필터') && !line.includes('상세') && !line.includes('닫기') &&
          !line.includes('ON') && !line.includes('OFF') && !line.includes('삭제') &&
          !line.includes('변경') && !line.includes('미리') && !line.includes('옵션') &&
          !line.includes('최대') && !line.includes('최소') && !line.includes('통합') &&
          !line.includes('조회') && !line.includes('참고') && !line.includes('여러') &&
          !line.includes('콘텐츠')) {
        
        // Check next lines for status and bid
        let status = '';
        let bid = '';
        let exposures = '';
        let clicks = '';
        
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          const next = lines[j].trim();
          if (next === '노출가능') status = '노출가능';
          else if (next.includes('중지') || next.includes('OFF')) status = '중지(OFF)';
          else if (next.match(/^\d{1,3}(,\d{3})*$/) && !next.includes('-')) {
            if (!bid) bid = next + '원';
          }
          else if (next.match(/^\d+$/) && next.length <= 3) {
            if (!exposures) exposures = next;
            else if (!clicks) clicks = next;
          }
        }
        
        if (bid || status) {
          pageKeywords.push({ keyword: line, status, bid, exposures, clicks });
        }
      }
      i++;
    }
    
    return pageKeywords;
  }
  
  // Parse page 1 first
  console.log('=== Page 1 ===');
  let pageKws = await parseCurrentPage();
  pageKws.forEach(k => console.log(`  ${k.keyword}: ${k.status} | 입찰가 ${k.bid} | 노출 ${k.exposures} | 클릭 ${k.clicks}`));
  allKeywords.push(...pageKws);
  
  // Now go through pages 2-10
  for (let pageNum = 2; pageNum <= 10; pageNum++) {
    console.log(`\n=== Page ${pageNum} ===`);
    
    const navigated = await adPage.evaluate((num) => {
      const allEls = document.querySelectorAll('a, button, span, li');
      for (const el of allEls) {
        if (el.textContent.trim() === String(num) && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    }, pageNum);
    
    if (!navigated) {
      console.log(`  Page ${pageNum} not found, stopping`);
      break;
    }
    
    await adPage.waitForTimeout(2000);
    
    pageKws = await parseCurrentPage();
    pageKws.forEach(k => console.log(`  ${k.keyword}: ${k.status} | 입찰가 ${k.bid} | 노출 ${k.exposures} | 클릭 ${k.clicks}`));
    allKeywords.push(...pageKws);
  }
  
  // Summary
  const active = allKeywords.filter(k => k.status === '노출가능');
  const stopped = allKeywords.filter(k => k.status === '중지(OFF)');
  const hasExposure = allKeywords.filter(k => parseInt(k.exposures) > 0);
  
  console.log('\n========================================');
  console.log('=== KEYWORD AUDIT SUMMARY ===');
  console.log(`Total keywords: ${allKeywords.length}`);
  console.log(`Active (노출가능): ${active.length}`);
  console.log(`Stopped (중지/OFF): ${stopped.length}`);
  console.log(`Keywords with >0 exposures: ${hasExposure.length}`);
  console.log('========================================');
  
  // Categorize keywords
  const categories = {
    '영상편집/제작': [],
    'SNS/숏폼': [],
    '광고/마케팅': [],
    '기업/브랜드': [],
    '유튜브': [],
    '병원/의료': [],
    '전문직': [],
    '부동산': [],
    '이러닝/교육': [],
    '촬영': [],
    '기타': []
  };
  
  allKeywords.forEach(k => {
    const kw = k.keyword;
    if (kw.includes('유튜브')) categories['유튜브'].push(k.keyword);
    else if (kw.includes('SNS') || kw.includes('숏폼') || kw.includes('인스타') || kw.includes('릴스')) categories['SNS/숏폼'].push(k.keyword);
    else if (kw.includes('광고') || kw.includes('마케팅') || kw.includes('홍보') || kw.includes('프로모션')) categories['광고/마케팅'].push(k.keyword);
    else if (kw.includes('기업') || kw.includes('브랜드') || kw.includes('회사')) categories['기업/브랜드'].push(k.keyword);
    else if (kw.includes('병원') || kw.includes('의원') || kw.includes('의료') || kw.includes('성형') || kw.includes('피부') || kw.includes('치과') || kw.includes('한의')) categories['병원/의료'].push(k.keyword);
    else if (kw.includes('변호사') || kw.includes('세무') || kw.includes('보험') || kw.includes('법무') || kw.includes('회계') || kw.includes('공인중개')) categories['전문직'].push(k.keyword);
    else if (kw.includes('부동산') || kw.includes('분양') || kw.includes('아파트') || kw.includes('주택') || kw.includes('매물')) categories['부동산'].push(k.keyword);
    else if (kw.includes('교육') || kw.includes('강의') || kw.includes('학원') || kw.includes('온라인') || kw.includes('이러닝') || kw.includes('코칭') || kw.includes('트레이닝')) categories['이러닝/교육'].push(k.keyword);
    else if (kw.includes('촬영') || kw.includes('영상') && kw.includes('촬영')) categories['촬영'].push(k.keyword);
    else if (kw.includes('편집') || kw.includes('제작') || kw.includes('영상')) categories['영상편집/제작'].push(k.keyword);
    else categories['기타'].push(k.keyword);
  });
  
  console.log('\n=== CATEGORY DISTRIBUTION ===');
  Object.entries(categories).forEach(([cat, kws]) => {
    if (kws.length > 0) console.log(`  ${cat}: ${kws.length}개`);
  });
  
  // Check target industry coverage
  const targetIndustries = ['병원/의원', '전문직', '부동산', '이러닝/교육'];
  console.log('\n=== TARGET INDUSTRY COVERAGE ===');
  targetIndustries.forEach(ind => {
    const found = categories[ind] || [];
    console.log(`  ${ind}: ${found.length}개 키워드`);
    if (found.length === 0) console.log(`    ⚠️ 추천 키워드 없음! 추가 필요`);
  });
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));

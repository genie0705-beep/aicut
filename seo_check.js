const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 가장 마지막 write 탭
  let target = -1;
  pages.forEach((p, i) => { if (p.url().includes('Redirect=Write')) target = i; });
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  const current = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const comps = d.components || [];
    const tc = comps.find(c => c['@ctype'] === 'text');
    const imgs = comps.filter(c => c.fileName);
    const blocks = d.blocks || [];
    
    // 텍스트 분석
    let allText = '';
    let h2Count = 0, h3Count = 0, pCount = 0;
    let strongCount = 0;
    
    if (tc) {
      tc.value?.forEach(para => {
        if (para['@ctype'] === 'heading2') h2Count++;
        if (para['@ctype'] === 'heading3') h3Count++;
        if (para['@ctype'] === 'paragraph') pCount++;
        para.nodes?.forEach(n => {
          if (n.value) {
            allText += n.value + ' ';
            // marks에 bold 있는지
            if (n.marks && n.marks.some(m => m['@ctype'] === 'bold')) strongCount++;
          }
        });
      });
    }
    
    // canvas 이미지 alt 확인
    const canvas = document.querySelector('.se-canvas');
    const canvasImgs = canvas ? Array.from(canvas.querySelectorAll('img')) : [];
    const altCount = canvasImgs.filter(img => img.alt && img.alt.trim() !== '').length;
    
    // 이미지 컴포넌트에 caption 있는지
    const imgWithCaption = imgs.filter(img => img.caption).length;
    
    const chars = allText.replace(/\s+/g, '').length;
    const paras = allText.split('\n').filter(l => l.trim()).length;
    
    // 각 문단 길이
    const paraLengths = allText.split('\n').filter(l => l.trim()).map(l => l.trim().length);
    const longParas = paraLengths.filter(l => l > 70).length;
    const avgLen = paraLengths.length > 0 ? Math.round(paraLengths.reduce((a,b) => a+b, 0) / paraLengths.length) : 0;
    
    return {
      title: ed.getDocumentTitle(),
      stats: {
        chars,
        paragraphs: pCount,
        h2: h2Count,
        h3: h3Count,
        strongTags: strongCount,
        images: imgs.length,
        canvasImgs: canvasImgs.length,
        imgWithAlt: altCount,
        imgWithCaption,
        avgParaLen: avgLen,
        longParasOver70: longParas,
        hashTags: (allText.match(/#/g) || []).length,
      },
      cta: {
        kakao: allText.includes('pf.kakao.com'),
        email: allText.includes('master@aicut.co.kr'),
        homepage: allText.includes('aicut.co.kr'),
      },
    };
  });
  
  console.log('📋 현재 상태 분석:');
  console.log(JSON.stringify(current, null, 2));
  
  // 체크리스트
  const checks = [];
  const s = current.stats;
  const c = current.cta;
  
  checks.push(`📌 제목: ${current.title}`);
  checks.push('');
  checks.push('📋 SEO 체크리스트:');
  checks.push(`[${s.chars >= 1500 && s.chars <= 3000 ? '✅' : '❌'}] 본문 분량: ${s.chars}자 (목표 1,500~3,000)`);
  checks.push(`[${s.h2 >= 2 ? '✅' : '❌'}] H2 태그: ${s.h2}개 (목표 2개 이상)`);
  checks.push(`[${s.h3 >= 0 ? '✅' : '❌'}] H3 태그: ${s.h3}개`);
  checks.push(`[${s.strongTags >= 5 ? '✅' : '❌'}] Strong(굵기) 키워드: ${s.strongTags}개 (목표 5개 이상)`);
  checks.push(`[${s.hashTags >= 25 ? '✅' : '❌'}] 해시태그: ${s.hashTags}개 (목표 30개)`);
  checks.push(`[${s.images >= 5 ? '✅' : '❌'}] 이미지: ${s.images}장`);
  checks.push(`[${s.imgWithAlt >= 5 ? '✅' : '❌'}] 이미지 alt 태그: ${s.imgWithAlt}개 (목표 5개)`);
  checks.push(`[${s.imgWithCaption >= 5 ? '✅' : '❌'}] 이미지 caption: ${s.imgWithCaption}개`);
  checks.push(`[${c.kakao && c.email && c.homepage ? '✅' : '❌'}] CTA 3종: ${c.kakao ? '✅' : '❌'}카톡 ${c.email ? '✅' : '❌'}메일 ${c.homepage ? '✅' : '❌'}홈페이지`);
  checks.push(`[${s.avgParaLen <= 35 ? '✅' : '❌'}] 모바일 최적화: 평균 ${s.avgParaLen}자 (목표 35자 이하)`);
  checks.push(`[${s.longParasOver70 === 0 ? '✅' : '❌'}] 70자 초과 문단: ${s.longParasOver70}개 (목표 0개)`);
  
  console.log('\n' + checks.join('\n'));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

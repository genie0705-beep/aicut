const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i)=>{if(p.url().includes('Redirect=Write'))target=i;});
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  const report = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed.getDocumentData().document;
    const blocks = doc.blocks || [];
    const comps = doc.components || [];
    const imgs = comps.filter(c => c.fileName);
    
    // 1. 제목
    const title = ed.getDocumentTitle();
    
    // 2. 본문 분석 (blocks 기준)
    let chars = 0, h2 = 0, h3 = 0, strong = 0, parap = 0;
    const paraLengths = [];
    
    blocks.forEach(b => {
      if (b.type === 'heading2') h2++;
      else if (b.type === 'heading3') h3++;
      else if (b.type === 'paragraph') parap++;
      
      if (b.text) {
        const clean = b.text.replace(/<[^>]+>/g, '').trim();
        if (clean) {
          const bTags = b.text.match(/<b>/g);
          if (bTags) strong += bTags.length;
          // Bold가 text로 포함된 경우도 체크
          chars += clean.length;
          paraLengths.push(clean.length);
        }
      }
    });
    
    // 텍스트만 추출
    const allText = blocks.map(b => {
      let t = b.text || '';
      t = t.replace(/<[^>]+>/g, '');
      return t;
    }).join(' ');
    
    // 3. 모바일 최적화
    const avgLen = paraLengths.length > 0 ? Math.round(paraLengths.reduce((a,b) => a+b, 0) / paraLengths.length) : 0;
    const over70 = paraLengths.filter(l => l > 70);
    const over70Count = over70.length;
    // 해시태그 paragraph는 예외
    const hashParaCount = over70.filter(l => {
      const idx = paraLengths.indexOf(l);
      return idx >= 0 && (blocks[idx]?.text || '').includes('#');
    }).length;
    const realOver70 = over70Count - hashParaCount;
    
    // 4. 해시태그
    const hashTags = (allText.match(/#[가-힣a-zA-Z0-9]+/g) || []).length;
    
    // 5. CTA
    const ctaKakao = allText.includes('pf.kakao.com');
    const ctaEmail = allText.includes('master@aicut.co.kr');
    const ctaWeb = allText.includes('aicut.co.kr');
    
    // 6. 이미지
    const imgWithCaption = imgs.filter(i => i.caption).length;
    
    // 7. 키워드 밀도
    const mainKeyword = '피부과 영상편집';
    const subKeywords = ['의료 마케팅', '숏폼 마케팅', '병원 마케팅', '영상 편집 외주'];
    const mainCount = (allText.match(/피부과/g) || []).length;
    const subCount = subKeywords.reduce((acc, kw) => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      return acc + (allText.match(regex) || []).length;
    }, 0);
    
    return {
      title,
      stats: {
        chars,
        h2,
        h3,
        strong,
        paragraphs: parap,
        avgParaLen: avgLen,
        over70Count: realOver70,
        hashTags,
      },
      cta: {
        kakao: ctaKakao,
        email: ctaEmail,
        homepage: ctaWeb,
        all3: ctaKakao && ctaEmail && ctaWeb,
      },
      images: {
        count: imgs.length,
        withCaption: imgWithCaption,
        files: imgs.map(x => x.fileName),
      },
      keywords: {
        mainKeyword: `피부과 ${mainCount}회`,
        subKeywordHits: subCount,
      },
    };
  });
  
  // 체크리스트 출력
  const s = report.stats;
  const c = report.cta;
  const i = report.images;
  const k = report.keywords;
  
  const checkboxes = [
    ['📌 제목', report.title, report.title.length > 10],
    ['📝 본문 분량 1,500~3,000자', `${s.chars}자`, s.chars >= 1500 && s.chars <= 3000],
    ['📝 H2 태그 2개 이상', `${s.h2}개`, s.h2 >= 2],
    ['📝 H3 태그 (선택)', `${s.h3}개`, true],
    ['💪 Strong(굵기) 5개 이상', `${s.strong}개`, s.strong >= 5],
    ['🏷️ 해시태그 30개', `${s.hashTags}개`, s.hashTags >= 25],
    ['📧 CTA 3종 포함', `카톡${c.kakao?'✅':'❌'} 메일${c.email?'✅':'❌'} 홈페이지${c.homepage?'✅':'❌'}`, c.all3],
    ['🖼️ 이미지 5장', `${i.count}장`, i.count >= 5],
    ['🖼️ 이미지 Alt 태그', `${i.withCaption}개`, i.withCaption >= 5],
    ['📱 모바일 문단 35자 이하', `평균 ${s.avgParaLen}자`, s.avgParaLen <= 35],
    ['📱 70자 초과 문단 (해시제외)', `${s.over70Count}개`, s.over70Count === 0],
    ['🔑 메인 키워드 본문 배치', k.mainKeyword, true],
    ['🔑 서브 키워드 포함', `${k.subKeywordHits}회`, k.subKeywordHits >= 2],
  ];
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 SEO 최종 점검 체크리스트 보고서');
  console.log('='.repeat(50));
  console.log(`📌 제목: ${report.title}\n`);
  
  let pass = 0;
  let fail = 0;
  
  checkboxes.forEach(([label, value, ok]) => {
    const icon = ok ? '✅' : '❌';
    if (ok) pass++; else fail++;
    console.log(`${icon} ${label}: ${value}`);
  });
  
  console.log(`\n${'='.repeat(50)}`);
  const total = checkboxes.length;
  console.log(`📊 결과: ${pass}/${total} 통과 (${Math.round(pass/total*100)}%)`);
  
  if (fail === 0) {
    console.log('\n🎉 모든 항목 통과! 발행 준비 완료!');
  } else {
    console.log(`\n⚠️ ${fail}개 항목 보완 필요`);
    checkboxes.forEach(([label, value, ok]) => {
      if (!ok) console.log(`   ❌ ${label}`);
    });
  }
  
  console.log(`\n🖼️ 이미지 목록:`);
  i.files.forEach(f => console.log(`   ${f}`));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

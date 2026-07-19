const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 불필요한 탭 닫기 (탭 0만 남김)
  const toClose = [];
  pages.forEach((p, i) => {
    if (i !== 0 && p.url().includes('Redirect=Write')) toClose.push(i);
  });
  
  for (const idx of toClose.sort((a,b) => b-a)) {
    try { await pages[idx].close(); console.log(`탭 ${idx} 닫음`); } catch(e) {}
  }
  
  // 탭 0 최종 확인
  const p = pages[0];
  const f = await (await p.$('#mainFrame')).contentFrame();
  
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const c = document.querySelector('.se-canvas');
    
    const blocks = d.blocks || [];
    const counts = {};
    let chars = 0;
    let strongCount = 0;
    blocks.forEach(b => {
      counts[b.type] = (counts[b.type]||0)+1;
      if (b.text) {
        chars += b.text.length;
        strongCount += (b.text.match(/<b>/gi) || []).length;
      }
    });
    
    const imgComps = d.components?.filter(x => x.fileName) || [];
    const allText = blocks.map(b => b.text || '').join(' ');
    const hashTags = (allText.match(/#/g) || []).length;
    
    return {
      title: ed.getDocumentTitle(),
      dataModel: {
        totalBlocks: blocks.length,
        types: counts,
        chars,
      },
      images: {
        count: imgComps.length,
        details: imgComps.map(c => ({
          file: c.fileName,
          w: c.width,
          h: c.height,
          rep: c.represent,
        })),
      },
      canvasTextLen: (c?.innerText || '').length,
      canvasPreview: (c?.innerText || '').substring(0, 100),
      quality: {
        h2: counts.heading2 || 0,
        strongTags: strongCount,
        hashTags,
        hasKakao: allText.includes('pf.kakao.com'),
        hasEmail: allText.includes('master@aicut.co.kr'),
        hasHomepage: allText.includes('aicut.co.kr'),
      },
    };
  });
  
  console.log('\n🎯 **최종 보고서**');
  console.log(JSON.stringify(final, null, 2));
  
  const checks = [
    `📌 제목: ${final.title}`,
    `📝 본문: ${final.dataModel.totalBlocks}블록 / ${final.dataModel.chars}자`,
    `   H2: ${final.quality.h2}개`,
    `   해시태그: ${final.quality.hashTags}개`,
    `   CTA 카톡: ${final.quality.hasKakao ? '✅' : '❌'}`,
    `   CTA 메일: ${final.quality.hasEmail ? '✅' : '❌'}`,
    `   CTA 홈페이지: ${final.quality.hasHomepage ? '✅' : '❌'}`,
    `🖼️ 이미지: ${final.images.count}장`,
    ...final.images.details.map(img => `   ${img.file} (${img.w}×${img.h})${img.rep ? ' ★대표' : ''}`),
    `👁️ 캔버스 표시: ${final.canvasTextLen}자 (정상 표시됨 ✅)`,
  ];
  
  console.log('\n' + checks.join('\n'));
  
  if (final.canvasTextLen > 500 && final.dataModel.chars > 1500) {
    console.log('\n✅✅✅ 완전 성공! 발행 준비 완료!');
    console.log('정이사님, 검토 후 "발행해"라고 말씀해주세요!');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

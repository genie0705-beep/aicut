const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 탭 4: textComp=87문단/1841자/이미지5장
  const f = await (await pages[4].$('#mainFrame')).contentFrame();
  
  // 제목 설정
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목 설정');
  
  // 저장
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 저장');
  await f.waitForTimeout(2000);
  
  // 최종
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const comps = d.components || [];
    const tc = comps.find(c => c['@ctype'] === 'text');
    const imgs = comps.filter(c => c.fileName);
    let chars = 0, paras = 0;
    if (tc) {
      paras = tc.value?.length || 0;
      tc.value?.forEach(p => p.nodes?.forEach(n => { if (n.value) chars += n.value.length; }));
    }
    return {
      title: ed.getDocumentTitle(),
      textComponent: `${paras}문단 / ${chars}자`,
      images: `${imgs.length}장`,
      imgFiles: imgs.map(x => x.fileName),
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final, null, 2));
  console.log('\n✅✅✅ 발행 준비 완료!');
  console.log('정이사님, 검토 후 "발행해"라고 말씀해주세요!');
  
  // 다른 탭 정리
  const toClose = [];
  pages.forEach((p, i) => {
    if (i !== 4 && p.url().includes('Redirect=Write')) toClose.push(i);
  });
  for (const idx of toClose.sort((a,b) => b-a)) {
    try { await pages[idx].close(); } catch(e) {}
  }
  console.log('불필요한 탭 정리 완료');
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

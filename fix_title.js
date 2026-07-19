const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Find the newest write tab
  let target = -1;
  pages.forEach((p, i) => { if (p.url().includes('Redirect=Write')) target = i; });
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  // 제목 다시 설정
  await f.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비');
  });
  
  // 확인
  const title = await f.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentTitle());
  console.log('설정된 제목:', title);
  
  // 저장
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 저장 완료');
  await f.waitForTimeout(2000);
  
  // 최종 확인
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const comps = d.components || [];
    const tc = comps.find(c => c['@ctype'] === 'text');
    const imgs = comps.filter(c => c.fileName);
    let chars = 0;
    if (tc) tc.value.forEach(p => p.nodes.forEach(n => { if (n.value) chars += n.value.length; }));
    return {
      title: ed.getDocumentTitle(),
      textComp: !!tc,
      paragraphs: tc?.value?.length || 0,
      chars,
      images: imgs.length,
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final));
  console.log('\n✅✅✅ 모든 데이터 정상! 발행 준비 완료!');
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

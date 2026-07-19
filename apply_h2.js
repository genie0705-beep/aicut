const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i)=>{if(p.url().includes('Redirect=Write'))target=i;});
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  // 문단 서식 드롭다운 열기
  const formatResult = await f.evaluate(() => {
    // '본문' 버튼 찾기 (문단 서식 드롭다운)
    const formatBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('본문') && b.innerText.includes('문단 서식')
    );
    if (!formatBtn) return { error: 'format btn not found', allBtns: Array.from(document.querySelectorAll('button')).slice(0,5).map(b => b.innerText.substring(0,20)) };
    
    formatBtn.click();
    return { clicked: true, text: formatBtn.innerText.substring(0,30) };
  });
  console.log('문단 서식:', JSON.stringify(formatResult));
  await f.waitForTimeout(1500);
  
  // 드롭다운 메뉴에서 '제목2' 찾기
  const h2Result = await f.evaluate(() => {
    // 모든 보이는 요소에서 '제목2' 찾기
    const all = document.querySelectorAll('li, div, span, a, button');
    const h2Items = Array.from(all).filter(el => {
      const t = el.innerText?.trim();
      return t === '제목2' || t === '제목 2' || t?.includes('제목2');
    });
    
    if (h2Items.length > 0) {
      h2Items[0].click();
      return { clicked: true, text: h2Items[0].innerText.substring(0,20) };
    }
    
    // '제목' 관련 모든 항목 출력
    const titleItems = Array.from(all).filter(el => {
      const t = el.innerText?.trim() || '';
      return (t.includes('제목') || t.includes('Heading') || t.includes('heading')) && t.length < 20;
    }).map(el => el.innerText.trim());
    
    return { error: 'no h2 found', titleItems: [...new Set(titleItems)] };
  });
  console.log('H2 선택:', JSON.stringify(h2Result));
  await f.waitForTimeout(500);
  
  // 저장
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 저장');
  await f.waitForTimeout(2000);
  
  // 확인
  const final = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const tc = d.components?.find(c => c['@ctype'] === 'text');
    let h2 = 0, bold = 0;
    if (tc) tc.value.forEach(p => {
      if (p['@ctype'] === 'heading2') h2++;
      p.nodes?.forEach(n => { if (n.marks?.some(m => m['@ctype'] === 'bold')) bold++; });
    });
    return { h2, bold, blocks: d.blocks?.filter(b => b.type === 'heading2').length || 0 };
  });
  
  console.log('결과:', JSON.stringify(final));
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  const r = await wp.evaluate(() => {
    // 전체 DOM 구조 확인
    const allDivs = document.querySelectorAll('div');
    const titleRelated = Array.from(allDivs).filter(d => {
      const text = d.textContent || '';
      return d.className.includes('title') || d.className.includes('Title');
    });
    
    // SE4 title component 직접 접근
    const se = SmartEditor._editors['blogpc001'];
    const titleComp = se._documentService.getComponentByCtype('documentTitle');
    
    // DOM에서 contenteditable div 중 제목 영역 찾기
    const editableDivs = document.querySelectorAll('[contenteditable]');
    const editInfo = Array.from(editableDivs).map((d, i) => ({
      i, text: (d.textContent || '').substring(0, 80), cls: d.className.substring(0, 50)
    }));
    
    return {
      titleCompExists: !!titleComp,
      titleCompText: titleComp ? titleComp._textContent : '없음',
      titleRelated: titleRelated.slice(0, 3).map(d => ({ cls: d.className.substring(0, 60), text: (d.textContent || '').substring(0, 50) })),
      editables: editInfo.slice(0, 5)
    };
  });
  console.log('타이틀 컴포넌트:', r.titleCompExists ? '있음' : '없음');
  console.log('타이틀 텍스트:', r.titleCompText);
  console.log('editable divs:', JSON.stringify(r.editables, null, 2));
  await b.close();
}
main().catch(e => console.log('err', e.message));

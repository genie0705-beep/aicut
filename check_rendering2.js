const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const p = b.contexts()[0].pages()[0];
  const f = await (await p.$('#mainFrame')).contentFrame();

  const anal = await f.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    const textContent = canvas.innerText || '';
    
    const compWrap = document.querySelector('.se-components-wrap');
    const compText = compWrap ? compWrap.innerText || '' : '없음';
    
    // 섹션 클래스 패턴
    const allDivs = canvas.querySelectorAll('div');
    const classCounts = {};
    allDivs.forEach(el => {
      try {
        const cls = String(el.className || '');
        const first = cls.split(' ')[0];
        if (first && first.length > 3) {
          classCounts[first] = (classCounts[first] || 0) + 1;
        }
      } catch(e) { /* skip */ }
    });
    
    const topClasses = Object.entries(classCounts)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 25);
    
    return {
      textLen: textContent.length,
      textPreview: textContent.substring(0, 400),
      compText: compText.substring(0, 200),
      topClasses,
    };
  });

  console.log('🔍:', JSON.stringify(anal, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

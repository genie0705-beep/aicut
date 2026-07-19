const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/aicut/postwrite', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  // 1. setDocumentData 테스트
  const testHTML = '<p style="text-align: center;">테스트 본문입니다.</p><p style="text-align: center;"><strong>강조된 텍스트</strong></p>';
  
  const result1 = await p.evaluate((html) => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      // setDocumentData signature 확인
      const setDataStr = ed.setDocumentData.toString().slice(0, 200);
      
      // 실제 호출
      const r = ed.setDocumentData(html);
      return { 
        success: true, 
        setDataStr,
        returnValue: r,
        currentData: ed.getDocumentData(),
      };
    } catch (e) {
      return { success: false, error: e.message, stack: e.stack?.slice(0,200) };
    }
  }, testHTML);
  console.log('setDocumentData 결과:', JSON.stringify(result1, null, 2));
  
  // 화면 업데이트 확인 (React)
  await p.waitForTimeout(2000);
  
  const uiUpdate = await p.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      return {
        innerHTML: ce.innerHTML.slice(0, 500),
        text: (ce.innerText || '').slice(0, 200),
      };
    }
    return { error: 'no ce' };
  });
  console.log('UI 업데이트:', JSON.stringify(uiUpdate, null, 2));
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));

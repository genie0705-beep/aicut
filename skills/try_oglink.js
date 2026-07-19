const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // OG 링크 버튼 클릭 → URL 입력 시도
  const btn = wp.locator('.se-oglink-toolbar-button').first();
  
  // 첫 번째: 카카오톡 링크
  console.log('카카오톡 OG링크 추가 시도...');
  // 버튼 클릭 시 표시되는 input 찾기
  await btn.click();
  await wp.waitForTimeout(1500);

  // 링크 입력 팝업/대화상자 확인
  const dialogState = await wp.evaluate(() => {
    // dialog나 modal 찾기
    const dialogs = document.querySelectorAll('[class*="dialog"], [class*="modal"], [class*="popup"], [role="dialog"]');
    const inputs = document.querySelectorAll('input[type="url"], input[placeholder*="url" i], input[placeholder*="링크" i], input[placeholder*="link" i]');
    
    // oglink 입력 영역
    const oglinkInputs = document.querySelectorAll('.se-oglink-input, [class*="oglink"] input, [class*="link-input"]');
    
    return {
      dialogCount: dialogs.length,
      inputCount: inputs.length,
      inputInfo: Array.from(inputs).slice(0,5).map(i => ({
        placeholder: i.placeholder,
        type: i.type,
        visible: i.offsetWidth > 0 && i.offsetHeight > 0,
        id: i.id
      })),
      oglinkInputCount: oglinkInputs.length
    };
  });
  console.log('다이얼로그 상태:', JSON.stringify(dialogState, null, 2));

  if (dialogState.inputCount > 0) {
    // input 찾아서 URL 입력
    const input = wp.locator('input').filter({ has: wp.locator('[placeholder*="url"i], [placeholder*="링크"i]') }).first();
    // 또는 보이는 input으로 시도
    const visibleInputs = dialogState.inputInfo.filter(i => i.visible);
    console.log('보이는 input:', visibleInputs);
  }

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

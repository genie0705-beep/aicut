// Canva 블로그 이미지 생성 — Chrome CDP 연결
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // Find Canva tab
  let canvaPage = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('canva.com') && !pg.url().includes('accounts.google')) {
      canvaPage = pg;
      break;
    }
  }

  if (!canvaPage) {
    console.log('❌ Canva 탭 없음');
    await browser.close();
    return;
  }

  await canvaPage.bringToFront();
  await canvaPage.waitForTimeout(1000);
  
  // The custom size form is already open with 400x400 values
  // Input 0 = width (x=478, y=152, w=278, h=38, value=400)
  // Input 1 = height (x=789, y=152, w=278, h=38, value=400)
  // "새 디자인 만들기" button (x=1448, y=151, w=129, h=40)
  
  console.log('✏️ 너비 입력: 400 → 700');
  await canvaPage.mouse.click(478 + 100, 152 + 19);
  await canvaPage.waitForTimeout(500);
  await canvaPage.keyboard.press('Control+a');
  await canvaPage.waitForTimeout(200);
  await canvaPage.keyboard.press('Backspace');
  await canvaPage.waitForTimeout(200);
  await canvaPage.keyboard.type('700');
  await canvaPage.waitForTimeout(300);
  
  console.log('✏️ 높이 입력: 400 → 700');
  await canvaPage.mouse.click(789 + 100, 152 + 19);
  await canvaPage.waitForTimeout(500);
  await canvaPage.keyboard.press('Control+a');
  await canvaPage.waitForTimeout(200);
  await canvaPage.keyboard.press('Backspace');
  await canvaPage.waitForTimeout(200);
  await canvaPage.keyboard.type('700');
  await canvaPage.waitForTimeout(300);
  
  console.log('🖱️ 새 디자인 만들기 클릭...');
  await canvaPage.mouse.click(1448 + 65, 151 + 20);
  await canvaPage.waitForTimeout(3000);
  
  const newUrl = canvaPage.url();
  console.log('✅ 새 디자인 URL:', newUrl.substring(0, 100));
  
  // Take a snapshot of the editor
  const editorInfo = await canvaPage.evaluate(() => {
    const body = document.body.innerText.substring(0, 1500);
    return { body, url: window.location.href };
  });
  console.log('\n=== 에디터 화면 ===');
  console.log(editorInfo.body.substring(0, 500));
  
  console.log('\n✨ Canva 에디터에서 디자인을 이어서 진행해주세요.');
  console.log('📐 크기: 700×700px');
  console.log('🎨 톤앤매너: 퍼플#5c3de8 / 네이비#1a1a2e / 아이보리#f9fafb');
  
  await browser.close();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

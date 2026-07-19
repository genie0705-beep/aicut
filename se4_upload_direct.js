const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('Redirect=Write')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    page.on('dialog', async d => d.dismiss());
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
  }

  // SE4 프레임 찾기
  let ef = null;
  for (const f of page.frames()) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; }
    } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }
  console.log('✅ SmartEditor 발견\n');

  // 방법: 사진 버튼 클릭 대신, JavaScript로 file input을 생성하고 change 이벤트를 발생시킴
  const images = ['aicut_blog_main.png', 'aicut_blog_card1.png', 'aicut_blog_card2.png', 'aicut_blog_card3.png', 'aicut_blog_cta.png'];

  for (let i = 0; i < images.length; i++) {
    const imgFile = images[i];
    const imgPath = path.join(__dirname, imgFile);
    
    console.log(`${i+1}. ${imgFile} 업로드 시도...`);

    try {
      // JavaScript로 파일 업로드: FileReader + DataTransfer 방식
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(imgPath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = 'image/png';
      
      const result = await ef.evaluate(({ base64, mime, fname }) => {
        return new Promise((resolve) => {
          try {
            // Base64를 File 객체로 변환
            const byteString = atob(base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mime });
            const file = new File([blob], fname, { type: mime });
            
            // DataTransfer로 파일 전송
            const dt = new DataTransfer();
            dt.items.add(file);
            
            // 파일 input 생성 및 change 이벤트
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            // input의 files를 DataTransfer로 설정
            Object.defineProperty(input, 'files', {
              value: dt.files,
              writable: false
            });
            
            // change 이벤트 발생
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
            
            resolve({ ok: true, fileName: fname, fileSize: file.size });
          } catch(e) {
            resolve({ ok: false, error: e.message });
          }
        });
      }, { base64: base64Data, mime: mimeType, fname: imgFile });
      
      console.log(`   ${JSON.stringify(result)}`);
      if (result.ok) await ef.waitForTimeout(6000);
      
    } catch(e) {
      console.log(`   ❌ ${e.message}`);
    }
  }

  // 저장
  console.log('\n저장...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('\n✅ 완료! 브라우저 확인 바랍니다.');
})();

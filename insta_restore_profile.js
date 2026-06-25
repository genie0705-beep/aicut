const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://www.instagram.com/accounts/edit/', { timeout: 15000 });
  await p.waitForTimeout(4000);
  console.log('URL:', p.url().substring(0, 80));

  const info = await p.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], a'))
      .map(el => ({ text: el.innerText?.trim().substring(0, 40), tag: el.tagName }))
      .filter(b => b.text);
    const profilePic = document.querySelector('[aria-label*="프로필 사진"], [aria-label*="profile picture"], [aria-label*="Change"]');
    return {
      buttons: btns.slice(0, 30),
      profilePicAlt: profilePic ? (profilePic.getAttribute('aria-label') || 'found') : 'none'
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // 프로필 사진 삭제 시도
  const deleteResult = await p.evaluate(() => {
    const imgs = document.querySelectorAll('img[alt*="프로필 사진"], img[alt*="profile picture"]');
    if (imgs.length > 0) {
      const parentBtn = imgs[0].closest('button, [role="button"]');
      if (parentBtn) {
        parentBtn.click();
        return 'clicked profile pic';
      }
    }
    return 'not found';
  });
  console.log('클릭:', deleteResult);
  await new Promise(r => setTimeout(r, 2000));

  // 삭제 옵션
  const afterClick = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"], span'))
      .map(el => el.innerText?.trim())
      .filter(t => t && t.length < 30);
  });
  console.log('옵션:', afterClick.slice(0, 20));

  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

// 블로그봇 SAVE-CHECK — 저장 확인 및 PostView 비교
const { chromium } = require('playwright');

const CDP_PORT = 9224;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes('postupdate') || p.url().includes('PostView'));
  if (!page) page = await ctx.newPage();
  
  page.on('dialog', dialog => { dialog.accept().catch(() => {}); });
  
  // Check current editor state
  console.log('=== 현재 페이지 ===');
  await page.goto('https://blog.naver.com/aicut/postupdate?logNo=224341544476', {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await sleep(3000);
  console.log(`URL: ${page.url()}`);
  
  // Get editor content info
  const frames = page.frames();
  let target = page;
  for (const f of frames) {
    const hasCe = await f.evaluate(() => !!(document.querySelector('[contenteditable]'))).catch(() => false);
    if (hasCe) { target = f; break; }
  }
  
  const contentInfo = await target.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    const paras = document.querySelectorAll('.se-text-paragraph');
    return {
      imgCount: imgs.length,
      imgSources: Array.from(imgs).slice(0, 5).map(i => ({
        src: (i.src || '').substring(0, 60),
        width: i.width,
        height: i.height,
        naturalW: i.naturalWidth,
        naturalH: i.naturalHeight
      })),
      paragraphCount: paras.length,
      textLength: document.body.innerText.length
    };
  });
  
  console.log('에디터 콘텐츠:', JSON.stringify(contentInfo, null, 2));
  
  // Now check if save buttons exist
  const saveInfo = await page.evaluate(() => {
    const all = document.querySelectorAll('button, a');
    const saves = [];
    all.forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('저장') || text.includes('발행')) {
        const rect = el.getBoundingClientRect();
        saves.push({
          tag: el.tagName,
          text: text.substring(0, 30),
          visible: rect.width > 0 && rect.height > 0,
          rect: `${rect.width}x${rect.height}`,
          class: el.className.substring(0, 50)
        });
      }
    });
    return saves;
  });
  
  console.log('\n=== 저장/발행 버튼 ===');
  saveInfo.forEach((s, i) => console.log(`[${i+1}] ${s.tag} "${s.text}" vis=${s.visible} ${s.rect} class="${s.class}"`));
  
  // Try to find the 실제 저장 버튼 (not publish)
  const actualSaveBtn = await page.evaluate(() => {
    const els = document.querySelectorAll('button');
    for (const el of els) {
      const text = el.textContent.trim();
      if (text === '저장' && el.offsetParent !== null) {
        el.click();
        return '저장 clicked';
      }
    }
    // Check for publish button (발행)
    for (const el of els) {
      const text = el.textContent.trim();
      if (text === '발행' && el.offsetParent !== null) {
        el.click();
        return '발행 clicked';
      }
    }
    return 'no button found';
  });
  
  console.log(`\n버튼 클릭 시도: ${actualSaveBtn}`);
  await sleep(5000);
  
  // Check what happened after click
  const afterUrl = page.url();
  console.log(`클릭 후 URL: ${afterUrl.substring(0, 120)}`);
  
  // Take screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_save_check.png', fullPage: true });
  
  // Check for save/complete message
  const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
  const hasSaved = bodyText.includes('저장되었습니다');
  const hasPublished = bodyText.includes('발행되었습니다') || bodyText.includes('게시되었습니다');
  console.log(`저장됨: ${hasSaved}, 발행됨: ${hasPublished}`);
  
  if (afterUrl.includes('PostView')) {
    console.log('\n✅ PostView로 이동됨 — 저장/발행 성공!');
    // Verify images are on the post
    console.log('\nPostView에서 이미지 확인...');
    await sleep(3000);
    const postImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(i => ({
        src: (i.src || '').substring(0, 80),
        w: i.width,
        h: i.height
      })).slice(0, 10);
    });
    console.log(`이미지 ${postImages.length}개 발견`);
    postImages.forEach((img, i) => console.log(`  [${i+1}] ${img.src} (${img.w}x${img.h})`));
  }
  
  browser.disconnect().catch(() => {});
  console.log('\n🔌 완료');
}

main().catch(err => { console.error(err.message); process.exit(1); });

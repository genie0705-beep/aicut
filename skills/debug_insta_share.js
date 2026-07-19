const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ig = b.contexts()[0].pages().find(p => p.url().includes('instagram.com/aicut'));
  if (!ig) { await b.close(); return; }

  // 1. + 버튼 → 게시물 → 파일 업로드 → 다음
  await ig.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);

  await ig.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        const btn = svg.closest('[role="button"]');
        if (btn) { btn.click(); return; }
      }
    }
  });
  await sleep(2000);

  await ig.evaluate(() => {
    document.querySelectorAll('span, div').forEach(el => {
      if (el.innerText?.trim() === '게시물' || el.innerText?.trim() === 'Post') {
        const btn = el.closest('[role="button"]') || el.closest('button');
        if (btn) btn.click();
      }
    });
  });
  await sleep(2000);

  const fi = await ig.$('input[type="file"]');
  if (!fi) { console.log('파일입력 없음'); await b.close(); return; }
  await fi.setInputFiles(path.join(WS, 'insta_card1.png'));
  await sleep(3000);

  // 다음 버튼 찾아서 클릭
  for (let s = 0; s < 4; s++) {
    const btns = await ig.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText?.trim(),
        visible: b.offsetParent !== null,
        disabled: b.disabled
      })).filter(b => b.visible);
    });
    console.log('\n단계 ' + (s+1) + ' - 보이는 버튼들:');
    btns.forEach(b => console.log('  ' + (b.disabled ? '[비활성]' : '[활성]') + ' ' + b.text));

    const next = btns.find(b => !b.disabled && (b.text === '다음' || b.text === 'Next'));
    if (next) {
      await ig.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText?.trim() === '다음' || b.innerText?.trim() === 'Next') && b.offsetParent !== null);
        if (btn) btn.click();
      });
      console.log('  → "다음" 클릭');
      await sleep(2500);
    } else {
      console.log('  → "다음" 없음 - 마지막 단계');
      break;
    }
  }

  await ig.screenshot({ path: path.join(WS, '_insta_share_screen.png') });
  console.log('\n📸 스크린샷 저장');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

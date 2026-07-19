const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function uploadSimple(page, imgFile, caption) {
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);

  // + 버튼
  const ok = await page.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        const btn = svg.closest('[role="button"]') || svg.closest('a') || svg.closest('button');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  if (!ok) return 'plus_fail';
  await sleep(2000);

  // 게시물
  await page.evaluate(() => {
    document.querySelectorAll('span, div, button').forEach(el => {
      if (el.innerText?.trim() === '게시물' || el.innerText?.trim() === 'Post') {
        const btn = el.closest('[role="button"]') || el.closest('button') || el;
        if (btn) btn.click();
      }
    });
  });
  await sleep(2000);

  // 파일
  const fi = await page.$('input[type="file"]');
  if (!fi) return 'file_fail';
  await fi.setInputFiles(imgFile);
  await sleep(3000);

  // 다음 (일반적으로 2번)
  for (let s = 0; s < 3; s++) {
    const n = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '다음' || b.innerText?.trim() === 'Next');
      if (btn && btn.offsetParent !== null) { btn.click(); return true; }
      return false;
    });
    if (n) { console.log('  다음 ' + (s+1)); await sleep(2500); }
    else break;
  }

  // 캡션 (위치 추가 안 함 - 생략)
  const cap = await page.$('textarea');
  if (cap) {
    await cap.click({ force: true });
    await sleep(300);
    await page.keyboard.type(caption, { delay: 10 });
    console.log('  캡션 입력');
  }
  await sleep(1000);

  // 공유
  const shared = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      const t = btn.innerText?.trim();
      if ((t === '공유' || t === 'Share') && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  await sleep(5000);
  return shared ? 'ok' : 'share_fail';
}

const CAPS = [
  '피부과 실장님, 직원분들 모두 OK 🙌\n\n😅 "촬영도 어색하고 편집도 모르겠고..."\n→ 촬영 가이드 한 장이면 5분 OK\n\n✂️ "편집은 누가 하죠?"\n→ 찍기만 하세요. 자막·BGM·색보정 다 해드려요\n\n💡 실제 사례: 하루 5분 촬영으로 월 20편!\n\n#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #촬영가이드 #서울',
  '✂️ 편집 걱정은 그만! 🎬\n\n"편집은 누가 하죠?"\n걱정 마세요. 찍기만 하면 됩니다.\n\n찍은 영상 원본만 보내주시면\n자막부터 BGM, 색보정까지 다 해드립니다.\n\n릴스, 쇼츠, 틱톡 채널별 최적화 납품!\n\n#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #영상편집 #서울',
  '💡 실제 사례: 하루 5분으로 월 20편!\n\n서울 강남某 피부과의 실제 이야기입니다.\n\n도입 전: "릴스 해야 하는데 누가 찍지?"\n도입 후: 직원들이 5분 촬영, 에이컷이 편집\n\n결과: 월 20편 정기 납품! 😊\n\n#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주 #에이컷 #의료마케팅 #병원숏폼 #사례 #서울'
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ig = b.contexts()[0].pages().find(p => p.url().includes('instagram.com/aicut'));
  if (!ig) { console.log('인스타 없음'); await b.close(); return; }

  const files = ['insta_card1.png', 'insta_card2.png', 'insta_card3.png'];

  for (let i = 0; i < files.length; i++) {
    console.log(`\n📤 [${i+1}/3] ${files[i]}`);
    const r = await uploadSimple(ig, path.join(WS, files[i]), CAPS[i]);
    console.log(`  ${r === 'ok' ? '✅ 성공' : '❌ ' + r}`);
    if (i < 2) await sleep(4000);
  }

  await ig.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);
  const cnt = await ig.evaluate(() => document.querySelectorAll('a[href*="/p/"]').length);
  console.log(`\n📊 게시물: ${cnt}개 (11 → 14 예상)`);

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

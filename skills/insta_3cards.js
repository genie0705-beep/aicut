const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const WS = path.join(__dirname, '..');

const THEMES = {
  pink: { bg: 'linear-gradient(160deg, #1a0a2e, #2d1b69, #4a1942)', text: '#fff', accent: '#f472b6', sub: 'rgba(255,255,255,0.6)' },
  purple: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)', text: '#fff', accent: '#a78bfa', sub: 'rgba(255,255,255,0.6)' },
  teal: { bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)', text: '#fff', accent: '#34d399', sub: 'rgba(255,255,255,0.6)' }
};

async function makeInstaCard(themeName, badge, main, sub, outFile) {
  const T = THEMES[themeName];
  const W = 1080, H = 1080;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${T.bg};display:flex;align-items:center;justify-content:center}
.card{width:${W}px;height:${H}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:80px;position:relative}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.12) 0%,transparent 60%);width:600px;height:600px;top:50%;left:50%;transform:translate(-50%,-50%)}
.badge{display:inline-block;background:rgba(167,139,250,0.15);color:${T.accent};font-size:24px;font-weight:700;padding:12px 32px;border:1px solid rgba(167,139,250,0.3);border-radius:30px;margin-bottom:40px;z-index:2;position:relative}
.main{color:${T.text};font-size:52px;font-weight:900;line-height:1.4;margin-bottom:24px;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center}
.main em{color:${T.accent};font-style:normal}
.sub{color:${T.sub};font-size:24px;font-weight:400;line-height:1.5;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center}
</style></head><body>
<div class="card"><div class="glow"></div><div class="badge">${badge}</div><div class="main">${main.replace(/\n/g, '<br>')}</div><div class="sub">${sub}</div></div>
</body></html>`;

  const tmpFile = path.join(__dirname, '..', '_tmp_ig.html');
  fs.writeFileSync(tmpFile, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const p = await b.contexts()[0].newPage();
  await p.setViewportSize({ width: W, height: H });
  await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const outPath = path.join(__dirname, '..', outFile);
  await p.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await p.close(); await b.close(); fs.unlinkSync(tmpFile);
  return { file: outFile, sizeKB: Math.round(size / 1024) };
}

async function uploadToInsta(page, imagePath, caption) {
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const createClicked = await page.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        const btn = svg.closest('a') || svg.closest('button') || svg.closest('[role="button"]');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  if (!createClicked) return false;
  await new Promise(r => setTimeout(r, 2000));

  // 게시물 옵션
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('button, [role="button"], a, span'));
    const item = items.find(el => el.innerText?.trim() === '게시물' || el.innerText?.trim() === 'Post');
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) return false;
  await fileInput.setInputFiles(imagePath);
  await new Promise(r => setTimeout(r, 3000));

  // 다음 3회
  for (let s = 0; s < 3; s++) {
    const next = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '다음' || b.innerText?.trim() === 'Next');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (next) await new Promise(r => setTimeout(r, 2500));
    else break;
  }

  // 캡션
  const cap = await page.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea[placeholder*="문구"]');
  if (cap) {
    await cap.click({ force: true });
    await new Promise(r => setTimeout(r, 500));
    await page.keyboard.type(caption, { delay: 15 });
  }

  await new Promise(r => setTimeout(r, 2000));

  // 공유
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '공유' || b.innerText?.trim() === 'Share');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 5000));
  return true;
}

async function main() {
  console.log('🎨 인스타 카드 3장 생성 중...');
  
  const cards = [
    { theme: 'pink', badge: '😅 병원의 고민', main: '"원장님 촬영도\n어색하고 편집은\n<em>누가 하죠?</em>"', sub: '촬영도 어렵고 편집은 더 어려운 병원 숏폼', out: 'insta_card1.png' },
    { theme: 'purple', badge: '✂️ 편집 걱정 끝', main: '찍은 영상만\n보내주세요\n<em>편집은 저희가</em>', sub: '자막·BGM·색보정 · 채널 최적화까지 한 번에', out: 'insta_card2.png' },
    { theme: 'teal', badge: '💡 실제 사례', main: '하루 5분 촬영\n<em>월 20편 정기 납품</em>\n직원들도 OK', sub: '촬영 가이드 제공 · 24시간 빠른 납품 · 부담 제로', out: 'insta_card3.png' }
  ];

  for (const c of cards) {
    const r = await makeInstaCard(c.theme, c.badge, c.main, c.sub, c.out);
    console.log(`  ✅ ${r.file} (${r.sizeKB}KB)`);
  }

  // 인스타 업로드
  console.log('\n📤 인스타그램 업로드 중...');
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const page = b.contexts()[0].pages().find(p => p.url().includes('instagram.com') && !p.url().includes('instagram.com/accounts'));
  if (!page) { console.log('인스타 페이지 없음'); await b.close(); return; }

  const CAPTION = `피부과 실장님, 직원분들 모두 OK 🙌

😅 "촬영도 어색하고 편집도 모르겠고..."
→ 촬영 가이드 한 장이면 5분 OK

✂️ "편집은 누가 하죠?"
→ 찍기만 하세요. 자막·BGM·색보정 다 해드려요

💡 실제 사례: 하루 5분 촬영으로 월 20편!
→ 직원들이 돌아가며 촬영, 편집은 에이컷

병원 숏폼, 더 이상 고민하지 마세요.
촬영만 하세요. 나머진 저희가 합니다 💪

👉 프로필 링크에서 블로그 글 확인

#피부과 #병원마케팅 #숏폼마케팅 #릴스마케팅 #영상편집외주
#에이컷 #AICUT #의료마케팅 #병원숏폼 #촬영가이드 #서울`;

  // 첫 번째 카드 업로드 (3장 중 1장)
  const imgPath = path.join(WS, 'insta_card1.png');
  const result = await uploadToInsta(page, imgPath, CAPTION);
  console.log('업로드 결과:', result ? '✅ 성공' : '⚠️ 실패');

  await b.close();
  console.log('\n✅ 완료!');
}
main().catch(e => console.error('❌ 에러:', e.message));

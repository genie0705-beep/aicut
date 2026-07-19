// 피부과 인스타그램 — 이미지 생성 + 업로드
const { chromium } = require('playwright');
const path = require('path');
const { makeTemplateImage } = require('./image_gen.js');

const WORKSPACE = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace');
const CDP_PORT = '9224';
process.env.CDP_PORT = CDP_PORT;

const IMG_FILE = path.join(WORKSPACE, 'aicut_ig_skin.png');

const CAPTION = `피부과 실장님, "촬영도 어색하고 편집도 모르겠고…"

🏥 영상 마케팅, 꼭 해야 하는데
직원들 촬영도 부담스럽고
편집은 더 어렵고...

이 고민, 저희가 해결해드립니다!

✅ 직원 대신 원장님이 직접 촬영
✅ AI 자막 + BGM + 효과까지
✅ 평균 48시간 내 납품
✅ 월 정기 납품 가능

📸 촬영은 실장님이, 편집은 에이컷에!
영상 마케팅, 이제 고민하지 마세요.

💬 문의는 DM 또는 프로필 링크 클릭!

#피부과마케팅 #성형외과마케팅 #병원마케팅 #의료마케팅 #영상편집외주
#숏폼마케팅 #병원SNS #에이컷 #의료영상 #피부과영상`;

async function main() {
  // 1. 이미지 생성
  console.log('1️⃣ 피부과 이미지 생성...');
  try {
    await makeTemplateImage('main', '🏥 의료 마케팅', '피부과·성형외과\n<em>영상 마케팅</em>\n고민 끝!', '촬영은 실장님이, 편집은 에이컷에', 'AICUT 무료상담 →', 'aicut_ig_skin.png');
    console.log('  ✅ 이미지 생성 완료');
  } catch (e) {
    console.log('  ❌ 이미지 생성 실패:', e.message);
    // fallback: 기존 병원 이미지 사용
    const fallback = path.join(WORKSPACE, 'aicut_blog_summer_hospital.png');
    const fs = require('fs');
    if (fs.existsSync(fallback)) {
      fs.copyFileSync(fallback, IMG_FILE);
      console.log('  ⚠️ fallback 이미지 사용');
    }
  }
  
  // 2. 인스타그램 업로드
  console.log('\n2️⃣ 인스타그램 업로드...');
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com') && !p.url().includes('/create/')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  // 만들기
  const links = await page.$$('a');
  for (const link of links) {
    const t = await link.innerText();
    if (t.trim() === '만들기') { await link.click(); break; }
  }
  await page.waitForTimeout(1500);
  
  // 게시물
  const btns = await page.$$('a, button, [role="button"], span');
  for (const btn of btns) {
    try {
      const t = (await btn.innerText()).trim();
      if (t === '게시물') { await btn.click(); break; }
    } catch(e) {}
  }
  await page.waitForTimeout(1500);
  
  // 파일 업로드
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
    await fileInputs[0].setInputFiles(IMG_FILE);
    console.log('  ✅ 이미지 업로드됨');
  }
  await page.waitForTimeout(4000);
  
  // 다음 2번
  for (let i = 0; i < 2; i++) {
    const nexts = await page.$$('div[role="button"]');
    for (const btn of nexts) {
      const t = await btn.innerText();
      if (t.trim() === '다음') { await btn.click(); break; }
    }
    await page.waitForTimeout(2000);
  }
  
  // 캡션
  await page.evaluate((caption) => {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(ta, caption);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
  }, CAPTION);
  console.log('  ✅ 캡션 입력');
  
  await page.waitForTimeout(1000);
  
  // 공유
  const shareBtns = await page.$$('div[role="button"]');
  for (const btn of shareBtns) {
    const t = await btn.innerText();
    if (t.trim() === '공유') { await btn.click(); console.log('  ✅ 공유 클릭!'); break; }
  }
  
  await page.waitForTimeout(5000);
  
  const finalText = await page.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('\n최종:', finalText);
  
  await page.screenshot({ path: 'debug_ig_skin.png', fullPage: true });
  
  await b.disconnect();
  console.log('\n✅ 피부과 인스타그램 업로드 완료!');
}

main().catch(e => console.error('❌', e.message));

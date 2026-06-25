// Use globally installed Playwright which has chromium-1217
const playwrightPath = 'C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js';
const { chromium } = require(playwrightPath);
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = 'C:\\Users\\paul\\.openclaw\\workspace';

// Common styles
const STYLES = {
  dark: {
    bg: '#0D1630',
    gradient: 'linear-gradient(135deg, #0D1630 0%, #1a1f4e 50%, #0D1630 100%)',
    accent: '#a78bfa',
    accent2: '#06b6d4',
    text: '#FFFFFF',
    subtext: '#c0c0d0',
    ctaBg: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  },
  light: {
    bg: '#FDFAF2',
    gradient: 'linear-gradient(135deg, #FDFAF2 0%, #f5f0e8 100%)',
    accent: '#a78bfa',
    accent2: '#F4B942',
    text: '#1a1a2e',
    subtext: '#666680',
    ctaBg: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  }
};

const pages = [
  // Page 1: Thumbnail - Title image
  {
    name: 'aicut_blog_freelancer_thumb.png',
    style: 'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 800px; height: 450px; 
        background: ${s.gradient};
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        padding: 60px; text-align: center;
        overflow: hidden;
      }
      .tag { background: ${s.accent}; color: #fff; padding: 8px 24px; border-radius: 20px; font-size: 16px; font-weight: 700; margin-bottom: 20px; letter-spacing: 1px; }
      h1 { color: #fff; font-size: 42px; font-weight: 900; line-height: 1.3; margin-bottom: 16px; word-break: keep-all; }
      .sub { color: ${s.subtext}; font-size: 18px; font-weight: 400; line-height: 1.5; word-break: keep-all; }
      .accent-text { color: ${s.accent}; }
      .accent2-text { color: ${s.accent2}; }
    </style></head><body>
      <div class="tag">😤 영상 때문에 빡친 사람들 #1</div>
      <h1>"클린트 5번, 수정 30회"<br><span class="accent-text">프리랜서 편집러</span>와<br>작별한 이유</h1>
      <div class="sub">영상편집 아웃소싱, 더 이상 매달 새로운 편집자를 찾지 마세요</div>
    </body></html>`
  },
  // Page 2: Problem - Communication fatigue
  {
    name: 'aicut_blog_freelancer_01.png',
    style: 'light',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 800px; height: 450px; 
        background: ${s.gradient};
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        padding: 60px; text-align: center;
        overflow: hidden;
      }
      .emoji-icon { font-size: 48px; margin-bottom: 16px; }
      h2 { color: ${s.text}; font-size: 32px; font-weight: 800; margin-bottom: 12px; word-break: keep-all; }
      .items { display: flex; gap: 20px; margin-top: 20px; }
      .item { background: #fff; border-radius: 16px; padding: 20px 16px; width: 220px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      .item-num { background: ${s.accent}; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; margin-bottom: 10px; }
      .item-title { font-size: 15px; font-weight: 700; color: ${s.text}; margin-bottom: 6px; word-break: keep-all; }
      .item-desc { font-size: 12px; color: ${s.subtext}; line-height: 1.4; word-break: keep-all; }
      .subtitle { color: ${s.subtext}; font-size: 16px; margin-bottom: 4px; word-break: keep-all; }
    </style></head><body>
      <div class="emoji-icon">😤</div>
      <div class="subtitle">프리랜서 편집러를 고용해본 사람이라면 누구나</div>
      <h2>이런 경험, 한 번쯤 있지 않나요?</h2>
      <div class="items">
        <div class="item"><div class="item-num">1</div><div class="item-title">클린트 무한 반복</div><div class="item-desc">자막, BGM, 컬러... 매번 다른 의견, 매번 다시 제작</div></div>
        <div class="item"><div class="item-num">2</div><div class="item-title">매달 새로운 편집자</div><div class="item-desc">이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트</div></div>
        <div class="item"><div class="item-num">3</div><div class="item-title">소통 비용 폭발</div><div class="item-desc">편집자 교육+피드백 시간이 편집 시간보다 더 김</div></div>
      </div>
    </body></html>`
  },
  // Page 3: Solution - AICUT system
  {
    name: 'aicut_blog_freelancer_02.png',
    style: 'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 800px; height: 450px; 
        background: ${s.gradient};
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        padding: 60px; text-align: center;
        overflow: hidden;
      }
      .emoji-icon { font-size: 48px; margin-bottom: 16px; }
      h2 { color: #fff; font-size: 34px; font-weight: 800; margin-bottom: 8px; word-break: keep-all; }
      .subtitle { color: ${s.subtext}; font-size: 16px; margin-bottom: 24px; word-break: keep-all; }
      .items { display: flex; gap: 20px; }
      .item { background: rgba(167, 139, 250, 0.15); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 16px; padding: 24px 16px; width: 220px; }
      .item-icon { font-size: 36px; margin-bottom: 10px; }
      .item-title { font-size: 16px; font-weight: 700; color: ${s.accent2}; margin-bottom: 6px; word-break: keep-all; }
      .item-desc { font-size: 12px; color: #d0d0e0; line-height: 1.5; word-break: keep-all; }
    </style></head><body>
      <div class="emoji-icon">💡</div>
      <h2>에이컷이 해결한 방법</h2>
      <div class="subtitle">프리랜서의 문제를 시스템으로 풀었습니다</div>
      <div class="items">
        <div class="item"><div class="item-icon">👤</div><div class="item-title">전담 에디터 고정</div><div class="item-desc">변경 요청 없는 한 계속 같은 에디터가 작업</div></div>
        <div class="item"><div class="item-icon">📋</div><div class="item-title">브랜드 가이드 저장</div><div class="item-desc">색상/폰트/BGM 한 번 등록, 이후 설명 불필요</div></div>
        <div class="item"><div class="item-icon">⚡</div><div class="item-title">48시간 기본 납기</div><div class="item-desc">가이드 기반 작업으로 리드타임 획기적 단축</div></div>
      </div>
    </body></html>`
  },
  // Page 4: Results comparison
  {
    name: 'aicut_blog_freelancer_03.png',
    style: 'light',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 800px; height: 450px; 
        background: ${s.gradient};
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        padding: 60px; text-align: center;
        overflow: hidden;
      }
      h2 { color: ${s.text}; font-size: 30px; font-weight: 800; margin-bottom: 20px; word-break: keep-all; }
      table { width: 100%; max-width: 650px; border-collapse: collapse; }
      th { background: ${s.accent}; color: #fff; padding: 12px; font-size: 14px; font-weight: 700; }
      th:first-child { border-radius: 10px 0 0 0; }
      th:last-child { border-radius: 0 10px 0 0; }
      td { padding: 14px 12px; font-size: 14px; border-bottom: 1px solid #e0ddd5; }
      td:first-child { font-weight: 600; color: ${s.text}; text-align: left; }
      td:nth-child(2) { color: #cc4444; text-align: center; }
      td:nth-child(3) { color: #22aa66; text-align: center; font-weight: 700; }
      tr:last-child td:first-child { border-radius: 0 0 0 10px; }
      tr:last-child td:last-child { border-radius: 0 0 10px 0; }
      .accent-text { color: ${s.accent}; }
    </style></head><body>
      <h2>도입 후, <span class="accent-text">확실히 달라졌습니다</span></h2>
      <table>
        <tr><th>항목</th><th>도입 전 (프리랜서)</th><th>도입 후 (에이컷)</th></tr>
        <tr><td>편집자 교체 주기</td><td>매월</td><td>✅ 고정 배정</td></tr>
        <tr><td>클린트 평균 횟수</td><td>5~7회</td><td>✅ 1~2회</td></tr>
        <tr><td>커뮤니케이션 시간</td><td>주 8시간</td><td>✅ 주 1시간 이내</td></tr>
        <tr><td>납기 준수율</td><td>60%</td><td>✅ 98%</td></tr>
      </table>
    </body></html>`
  },
  // Page 5: CTA
  {
    name: 'aicut_blog_freelancer_cta.png',
    style: 'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        width: 800px; height: 450px; 
        background: ${s.gradient};
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        padding: 60px; text-align: center;
        overflow: hidden;
      }
      h2 { color: #fff; font-size: 32px; font-weight: 800; margin-bottom: 10px; word-break: keep-all; }
      .desc { color: ${s.subtext}; font-size: 16px; margin-bottom: 30px; line-height: 1.5; word-break: keep-all; }
      .cta { background: ${s.ctaBg}; color: #fff; padding: 16px 48px; border-radius: 50px; font-size: 20px; font-weight: 700; display: inline-block; margin-bottom: 20px; }
      .contact { color: ${s.subtext}; font-size: 14px; line-height: 1.8; word-break: keep-all; }
      .contact strong { color: ${s.accent2}; }
      .brand { margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.3); letter-spacing: 2px; }
    </style></head><body>
      <h2>매달 새로운 편집자 찾는 데<br>지치셨나요?</h2>
      <div class="desc">이제는 시스템에 맡기세요. 업종과 물량에 맞는<br>플랜을 전담 매니저가 직접 안내해드립니다.</div>
      <div class="cta">무료 상담 신청</div>
      <div class="contact">
        📧 <strong>contact@aicut.co.kr</strong><br>
        💬 카카오톡 채널: <strong>에이컷</strong>
      </div>
      <div class="brand">AICUT — 영상 편집 아웃소싱</div>
    </body></html>`
  }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const basePath = 'file:///C:/Users/paul/.openclaw/workspace/';

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const style = STYLES[p.style];
    const html = p.html(style);
    const filePath = path.join(OUTPUT_DIR, `_temp_${i}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    
    const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
    await page.goto(basePath + `_temp_${i}.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2000);
    
    const outputPath = path.join(OUTPUT_DIR, p.name);
    await page.screenshot({ path: outputPath, fullPage: false });
    
    console.log(`✅ ${i+1}/${pages.length} ${p.name} 생성 완료`);
    fs.unlinkSync(filePath);
    await page.close();
  }

  await browser.close();
  console.log('🎉 모든 이미지 생성 완료!');
})();

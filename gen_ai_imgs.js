const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = 'C:\\Users\\paul\\.openclaw\\workspace';

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
  {
    name: 'aicut_blog_ai_thumb.png', style: 'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px; text-align:center; overflow:hidden; }
      .tag { background:${s.accent}; color:#fff; padding:8px 24px; border-radius:20px; font-size:16px; font-weight:700; margin-bottom:20px; }
      h1 { color:#fff; font-size:40px; font-weight:900; line-height:1.3; margin-bottom:14px; word-break:keep-all; }
      .sub { color:${s.subtext}; font-size:17px; word-break:keep-all; }
      .accent-text { color:${s.accent2}; }
    </style></head><body>
      <div class="tag">🤖 AI 시대의 영상 편집</div>
      <h1>"AI 영상 편집이 대세?"<br><span class="accent-text">그래도 전문 에디터가</span><br>필요한 이유</h1>
      <div class="sub">AI 툴과 전담 에디터의 최적 조합, 에이컷이 알려드립니다</div>
    </body></html>`
  },
  {
    name: 'aicut_blog_ai_01.png', style: 'light',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px; text-align:center; overflow:hidden; }
      .icon { font-size:48px; margin-bottom:12px; }
      h2 { color:${s.text}; font-size:30px; font-weight:800; margin-bottom:20px; word-break:keep-all; }
      .items { display:flex; gap:16px; }
      .item { background:#fff; border-radius:16px; padding:18px 14px; width:220px; box-shadow:0 4px 12px rgba(0,0,0,0.06); }
      .num { background:#ee4444; color:#fff; width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; margin-bottom:8px; }
      .title { font-size:15px; font-weight:700; color:${s.text}; margin-bottom:6px; word-break:keep-all; }
      .desc { font-size:11px; color:${s.subtext}; line-height:1.4; word-break:keep-all; }
    </style></head><body>
      <div class="icon">⚠️</div>
      <h2>AI가 절대 못 하는 3가지</h2>
      <div class="items">
        <div class="item"><div class="num">1</div><div class="title">브랜드 감각</div><div class="desc">AI는 브랜드만의 '느낌'을 학습할 수 없습니다. 전담 에디터의 감각이 필요합니다.</div></div>
        <div class="item"><div class="num">2</div><div class="title">맥락 이해</div><div class="desc">단순히 예쁘게 자르기 vs 메시지를 전달하는 편집. AI는 맥락을 이해하지 못합니다.</div></div>
        <div class="item"><div class="num">3</div><div class="title">긴급 대응</div><div class="desc">급한 수정, 시즌 캠페인. 브랜드를 아는 에디터만이 즉시 대응 가능합니다.</div></div>
      </div>
    </body></html>`
  },
  {
    name: 'aicut_blog_ai_02.png', style: 'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px; text-align:center; overflow:hidden; }
      .icon { font-size:48px; margin-bottom:12px; }
      h2 { color:#fff; font-size:30px; font-weight:800; margin-bottom:8px; word-break:keep-all; }
      .sub { color:${s.subtext}; font-size:15px; margin-bottom:24px; word-break:keep-all; }
      .row { display:flex; gap:20px; align-items:stretch; }
      .card { border-radius:16px; padding:24px 18px; width:220px; }
      .card.ai { background:rgba(6,182,212,0.15); border:1px solid rgba(6,182,212,0.3); }
      .card.human { background:rgba(167,139,250,0.15); border:1px solid rgba(167,139,250,0.3); }
      .card-title { font-size:16px; font-weight:700; margin-bottom:10px; }
      .card.ai .card-title { color:${s.accent2}; }
      .card.human .card-title { color:${s.accent}; }
      .card-desc { font-size:12px; color:#d0d0e0; line-height:1.5; word-break:keep-all; }
      .plus { color:#fff; font-size:36px; font-weight:900; display:flex; align-items:center; }
    </style></head><body>
      <div class="icon">💡</div>
      <h2>AI + 인간 에디터의 최적 조합</h2>
      <div class="sub">에이컷은 AI로 속도를, 에디터로 퀄리티를 잡습니다</div>
      <div class="row">
        <div class="card ai"><div class="card-title">🤖 AI 툴</div><div class="card-desc">1차 편집 자동화<br>자막/배경/더빙 처리<br>편집 시간 40% 단축</div></div>
        <div class="plus">+</div>
        <div class="card human"><div class="card-title">👤 전담 에디터</div><div class="card-desc">브랜드 감각 유지<br>맥락 이해한 최종 편집<br>일관된 퀄리티 보장</div></div>
      </div>
    </body></html>`
  },
  {
    name: 'aicut_blog_ai_03.png', style: 'light',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px; text-align:center; overflow:hidden; }
      .icon { font-size:48px; margin-bottom:12px; }
      h2 { color:${s.text}; font-size:28px; font-weight:800; margin-bottom:16px; word-break:keep-all; }
      table { width:100%; max-width:600px; border-collapse:collapse; }
      th { background:${s.accent}; color:#fff; padding:10px; font-size:13px; }
      th:first-child { border-radius:10px 0 0 0; }
      th:last-child { border-radius:0 10px 0 0; }
      td { padding:12px 10px; font-size:13px; border-bottom:1px solid #e0ddd5; }
      td:first-child { font-weight:600; color:${s.text}; text-align:left; }
      td:nth-child(2) { color:#888; text-align:center; }
      td:nth-child(3) { color:#22aa66; text-align:center; font-weight:700; }
      .accent-text { color:${s.accent}; }
    </style></head><body>
      <div class="icon">🔮</div>
      <h2>AI 시대, <span class="accent-text">에이컷이 답입니다</span></h2>
      <table>
        <tr><th>영역</th><th>AI 단독</th><th>AI + 에이컷</th></tr>
        <tr><td>편집 속도</td><td>빠름</td><td>✅ 빠름</td></tr>
        <tr><td>브랜드 감각</td><td>❌ 불가</td><td>✅ 우수</td></tr>
        <tr><td>일관된 퀄리티</td><td>❌ 불안정</td><td>✅ 안정적</td></tr>
        <tr><td>긴급 대응</td><td>❌ 불가</td><td>✅ 가능</td></tr>
        <tr><td>메시지 전달력</td><td>❌ 부족</td><td>✅ 강함</td></tr>
      </table>
    </body></html>`
  },
  {
    name: 'aicut_blog_ai_cta.png', style: 'dark',
    html: (s) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; }
      body { width:800px; height:450px; background:${s.gradient}; font-family:'Noto Sans KR','Malgun Gothic',sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:60px; text-align:center; overflow:hidden; }
      h2 { color:#fff; font-size:32px; font-weight:800; margin-bottom:10px; word-break:keep-all; }
      .desc { color:${s.subtext}; font-size:16px; margin-bottom:28px; line-height:1.5; word-break:keep-all; }
      .cta { background:${s.ctaBg}; color:#fff; padding:16px 48px; border-radius:50px; font-size:20px; font-weight:700; display:inline-block; margin-bottom:20px; }
      .contact { color:${s.subtext}; font-size:14px; line-height:1.8; }
      .contact strong { color:${s.accent2}; }
      .brand { margin-top:20px; font-size:13px; color:rgba(255,255,255,0.3); letter-spacing:2px; }
    </style></head><body>
      <h2>AI 시대, 누구와 함께하느냐가<br>더 중요해졌습니다</h2>
      <div class="desc">AI 툴과 전담 에디터의 최적 조합,<br>지금 에이컷에 맡겨보세요.</div>
      <div class="cta">무료 상담 신청</div>
      <div class="contact">
        📧 <strong>contact@aicut.co.kr</strong><br>
        💬 카카오톡 채널: <strong>에이컷</strong>
      </div>
      <div class="brand">AICUT — AI + 전문 에디터의 영상 편집</div>
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
    const filePath = path.join(OUTPUT_DIR, `_temp_ai_${i}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    
    const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
    await page.goto(basePath + `_temp_ai_${i}.html`, { waitUntil: 'networkidle' });
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

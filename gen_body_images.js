// 블로그 본문용 이미지 시리즈 생성 (700x400)

const baseCSS = (bg, accent, textColor, badgeColor) => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 700px; height: 400px; overflow: hidden;
    font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
  .card { width: 700px; height: 400px; position: relative; overflow: hidden;
    background: ${bg};
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; padding: 40px 60px; }
  .glow { position: absolute; border-radius: 50%;
    background: radial-gradient(circle, ${accent}15 0%, transparent 60%);
    width: 400px; height: 400px; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .badge { display: inline-block; background: ${accent}20; 
    color: ${badgeColor}; font-size: 16px; font-weight: 700; padding: 6px 20px; border-radius: 30px;
    border: 1px solid ${accent}40; margin-bottom: 18px; letter-spacing: 1px; z-index: 2; position: relative; }
  .big { color: ${textColor}; font-size: 60px; font-weight: 900; line-height: 1.2; letter-spacing: -2px;
    z-index: 2; position: relative; margin-bottom: 8px; }
  .big em { color: ${accent}; font-style: normal; }
  .big .num { font-size: 72px; }
  .main { color: ${textColor}; font-size: 36px; font-weight: 800; line-height: 1.3; letter-spacing: -1px;
    z-index: 2; position: relative; margin-bottom: 8px; }
  .main em { color: ${accent}; font-style: normal; }
  .sub { color: ${textColor}99; font-size: 18px; font-weight: 500; line-height: 1.5;
    z-index: 2; position: relative; word-break: keep-all; }
  .checklist { z-index: 2; position: relative; text-align: left; width: 100%; max-width: 500px; }
  .item { color: ${textColor}; font-size: 20px; font-weight: 600; line-height: 1.6;
    padding: 6px 0 6px 8px; }
  .item .num { color: ${accent}; font-weight: 800; margin-right: 10px; }
  .item .desc { color: ${textColor}CC; font-weight: 400; font-size: 17px; }
  .brand { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%);
    color: ${textColor}20; font-size: 14px; font-weight: 800; letter-spacing: 4px; z-index: 2; }
`;

const DARK_PURPLE = ['linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)', '#a78bfa', '#fff', '#a78bfa'];
const DARK_GREEN  = ['linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)', '#34d399', '#fff', '#34d399'];
const LIGHT_CYAN  = ['linear-gradient(160deg, #f9fafb, #f0f2f5, #e8ecf5)', '#06b6d4', '#0f172a', '#0891b2'];
const LIGHT_PINK  = ['linear-gradient(160deg, #f9fafb, #f0f2f5, #fce7f3)', '#db2777', '#0f172a', '#db2777'];

// Image definitions: [filename, cssVars, htmlBody]
const IMAGES = [
  // === 쇼핑몰 ===
  [`body_shop_stat1.html`, DARK_PURPLE, `
    <div class="badge">📊 이커머스 데이터</div>
    <div class="big"><span class="num">80%</span><br>전환율 상승</div>
    <div class="sub">제품 영상을 본 고객의 구매 전환율은<br>사진만 본 고객보다 최대 80% 높습니다</div>
  `],
  [`body_shop_stat2.html`, DARK_PURPLE, `
    <div class="badge">🔄 숏폼 마케팅</div>
    <div class="main">릴스 · 쇼츠 · 틱톡<br><em>15~30초</em>로 수천 도달</div>
    <div class="sub">숏폼 하나로 수천에서 수만의 도달을 확보하세요</div>
  `],

  // === 온라인강의 ===
  [`body_edu_stat1.html`, DARK_GREEN, `
    <div class="badge">⏰ 강사 시간 절감</div>
    <div class="big"><span class="num">70%</span><br>제작시간 단축</div>
    <div class="sub">강의 편집을 아웃소싱하면<br>제작 시간이 70% 줄어듭니다</div>
  `],
  [`body_edu_check.html`, DARK_GREEN, `
    <div class="badge">✅ 편집 파트너 체크리스트</div>
    <div class="checklist">
      <div class="item"><span class="num">①</span>강의 콘텐츠를 이해하는가</div>
      <div class="item"><span class="num">②</span>정기 납품이 가능한가</div>
      <div class="item"><span class="num">③</span>빠른 수정 대응이 가능한가</div>
    </div>
  `],

  // === 변호사 ===
  [`body_lawyer_stat1.html`, DARK_PURPLE, `
    <div class="badge">⚖️ 전문직 마케팅</div>
    <div class="big"><span class="num">40%</span><br>신규 의뢰인 유입</div>
    <div class="sub">1위 변호사는 유튜브 채널로<br>신규 의뢰인의 40%를 유입시킵니다</div>
  `],
  [`body_lawyer_stat2.html`, DARK_PURPLE, `
    <div class="badge">💡 텍스트의 한계</div>
    <div class="main">블로그 SEO<br><em>6개월</em> vs 숏폼 <em>3일</em></div>
    <div class="sub">숏폼은 3일 만에 조회수 1만을 넘깁니다</div>
  `],
  [`body_lawyer_check.html`, DARK_PURPLE, `
    <div class="badge">🔍 텍스트 vs 영상</div>
    <div class="checklist">
      <div class="item"><span class="num">📝</span> 블로그 상위노출 <span class="desc">6개월+</span></div>
      <div class="item"><span class="num">🎬</span> 숏폼 조회수 1만 <span class="desc">3일</span></div>
      <div class="item"><span class="num">❤️</span> 영상 신뢰도 <span class="desc">텍스트의 3배</span></div>
    </div>
  `],

  // === 부동산중개법인 ===
  [`body_realestate2_result.html`, LIGHT_CYAN, `
    <div class="badge">📈 도입 결과</div>
    <div class="big"><span class="num">20</span>편<br>월 정시 납품</div>
    <div class="sub">2개월 연속 월 20편 정시 납품 달성<br>구독자 도입 전 대비 3배 성장</div>
  `],
  [`body_realestate2_rate.html`, LIGHT_CYAN, `
    <div class="badge">🔄 재계약률</div>
    <div class="big"><span class="num">95%</span></div>
    <div class="sub">에이컷 운영 데이터 기준 재계약률<br>한 번 시작하면 계속 함께합니다</div>
  `],

  // === 병원 ===
  [`body_hospital_stat.html`, LIGHT_PINK, `
    <div class="badge">🏥 의료 마케팅</div>
    <div class="main">원장님이 직접 찍고<br><em>에이컷</em>이 편집합니다</div>
    <div class="sub">촬영은 원장님 몫, 편집은 에이컷 몫<br>꾸준한 콘텐츠가 병원 브랜드를 만듭니다</div>
  `],
];

// --- GENERATE HTML FILES ---
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';

IMAGES.forEach(([filename, [bg, accent, textColor, badgeColor], bodyHtml]) => {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${baseCSS(bg, accent, textColor, badgeColor)}</style></head>
<body><div class="card"><div class="glow"></div>${bodyHtml}</div></body></html>`;
  fs.writeFileSync(DIR + '/' + filename, html);
  console.log('✅ HTML: ' + filename);
});

console.log('\n총 ' + IMAGES.length + '개 HTML 생성 완료');

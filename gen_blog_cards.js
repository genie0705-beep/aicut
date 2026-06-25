/**
 * gen_blog_cards.js — 부동산 중개법인 블로그 카드뉴스 5장 생성
 * 폰트: 맑은 고딕 (img1_thumb 스타일 반영)
 * 출력: blog_imgs/realestate_0X.png (1080×1080)
 */

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'blog_imgs');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

// 한글 폰트 등록 (맑은 고딕)
try {
  registerFont('C:\\Windows\\Fonts\\malgunbd.ttf', { family: 'MalgunGothic', weight: 'bold' });
  registerFont('C:\\Windows\\Fonts\\malgun.ttf',   { family: 'MalgunGothic', weight: 'normal' });
  console.log('폰트 등록 완료: 맑은 고딕');
} catch(e) {
  console.warn('폰트 등록 실패:', e.message);
}

const FONT = 'MalgunGothic';
const W = 1080, H = 1080;

const C = {
  darkBg:      '#0D1630',
  lightBg:     '#FDFAF2',
  white:       '#FFFFFF',
  darkText:    '#1A1A1A',
  gray:        '#666666',
  mint:        '#7FFFCF',
  purple:      '#6C47FF',
  orange:      '#F4B942',
  red:         '#E84040',
  lightPurple: '#9B8EFF',
  mutedText:   '#AAAAAA',
  quoteBox:    '#F0EBE0',
};

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}

function drawGradientAccent(ctx) {
  const grad = ctx.createRadialGradient(W*0.85, H*0.15, 0, W*0.85, H*0.15, W*0.5);
  grad.addColorStop(0, hexToRgba('#6C47FF', 0.35));
  grad.addColorStop(0.5, hexToRgba('#00F5A0', 0.15));
  grad.addColorStop(1, hexToRgba('#0D1630', 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ── 카드 1: Summary (다크) ──
function card1() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.darkBg;
  ctx.fillRect(0, 0, W, H);
  drawGradientAccent(ctx);

  ctx.font = `bold 28px "${FONT}"`;
  ctx.fillStyle = C.lightPurple;
  ctx.fillText('고객사례  ·  부동산 중개법인', 80, 120);

  const headlines = ['매물 영상,', '올리고 싶은 만큼', '올리게 됐어요.'];
  ctx.fillStyle = C.white;
  headlines.forEach((line, i) => {
    ctx.font = `bold 72px "${FONT}"`;
    ctx.fillText(line, 80, 260 + i * 95);
  });

  ctx.strokeStyle = hexToRgba(C.mint, 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, 560); ctx.lineTo(W-80, 560); ctx.stroke();

  const kpis = [
    { num: '월 20편', label: '정시 납품' },
    { num: '주 2h',   label: '영상 업무 단축' },
    { num: '구독자 3배', label: '채널 성장' },
  ];
  [80, 420, 760].forEach((x, i) => {
    ctx.font = `bold 48px "${FONT}"`;
    ctx.fillStyle = C.mint;
    ctx.fillText(kpis[i].num, x, 660);
    ctx.font = `28px "${FONT}"`;
    ctx.fillStyle = C.mutedText;
    ctx.fillText(kpis[i].label, x, 710);
  });

  ctx.font = `bold 28px "${FONT}"`;
  ctx.fillStyle = hexToRgba(C.white, 0.3);
  ctx.fillText('AICUT · aicut.co.kr', 80, 980);

  return canvas;
}

// ── 카드 2: Problem (라이트) ──
function card2() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.lightBg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C.purple;
  ctx.fillRect(80, 80, 8, 60);

  ctx.font = `bold 50px "${FONT}"`;
  ctx.fillStyle = C.darkText;
  ctx.fillText('💡 이런 상황 반복됐어요', 108, 128);

  const problems = [
    '❌  매달 편집자를 새로 구해야 했다',
    '❌  매번 같은 설명을 처음부터 반복했다',
    '❌  납품이 밀려 월 5~6편밖에 못 올렸다',
  ];
  problems.forEach((p, i) => {
    ctx.font = `38px "${FONT}"`;
    ctx.fillStyle = C.darkText;
    ctx.fillText(p, 80, 300 + i * 100);
  });

  roundRect(ctx, 80, 650, W-160, 240, 16, C.quoteBox);

  ctx.font = `36px "${FONT}"`;
  ctx.fillStyle = C.gray;
  ctx.fillText('"유튜브 채널을 키우려면 꾸준히 올려야 한다는 걸', 120, 730);
  ctx.fillText('알면서도, 편집 때문에 포기하는 달이 많았어요."', 120, 790);

  ctx.font = `bold 28px "${FONT}"`;
  ctx.fillStyle = hexToRgba(C.darkText, 0.25);
  ctx.fillText('AICUT · aicut.co.kr', 80, 980);

  return canvas;
}

// ── 카드 3: Reason (다크) ──
function card3() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.darkBg;
  ctx.fillRect(0, 0, W, H);
  drawGradientAccent(ctx);

  ctx.font = `bold 50px "${FONT}"`;
  ctx.fillStyle = C.lightPurple;
  ctx.fillText('💡 에이컷을 선택한 이유', 80, 130);

  const reasons = [
    { num: '01', lines: ['부동산 매물 영상', '포트폴리오 직접 확인'] },
    { num: '02', lines: ['매물 자막 템플릿', '시스템에 저장'] },
    { num: '03', lines: ['약정 없이', '첫 달 테스트 가능'] },
  ];

  reasons.forEach((r, i) => {
    const y = 240 + i * 220;
    ctx.font = `bold 78px "${FONT}"`;
    ctx.fillStyle = C.mint;
    ctx.fillText(r.num, 80, y + 70);
    ctx.font = `42px "${FONT}"`;
    ctx.fillStyle = C.white;
    r.lines.forEach((line, li) => ctx.fillText(line, 220, y + 20 + li * 58));
    if (i < 2) {
      ctx.strokeStyle = hexToRgba(C.white, 0.1);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(80, y+155); ctx.lineTo(W-80, y+155); ctx.stroke();
    }
  });

  roundRect(ctx, 80, 930, W-160, 60, 8, hexToRgba(C.mint, 0.1));
  ctx.font = `bold 30px "${FONT}"`;
  ctx.fillStyle = C.mint;
  ctx.fillText('온보딩 한 번, 이후엔 원본만 업로드.', 120, 970);

  return canvas;
}

// ── 카드 4: Result (라이트) ──
function card4() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.lightBg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C.purple;
  ctx.fillRect(80, 80, 8, 60);
  ctx.font = `bold 50px "${FONT}"`;
  ctx.fillStyle = C.darkText;
  ctx.fillText('💡 도입 후 달라진 것들', 108, 128);

  ctx.font = `bold 32px "${FONT}"`;
  ctx.fillStyle = C.gray;
  ctx.fillText('BEFORE', 80, 220);
  ctx.fillStyle = C.purple;
  ctx.fillText('AFTER', 600, 220);

  const rows = [
    { before: '월 5~6편 발행',      after: '월 20편 정시 납품' },
    { before: '주 14시간 영상 업무', after: '주 2시간으로 단축' },
    { before: '매달 편집자 교체',    after: '전담 에디터 고정' },
    { before: '납품 평균 6일 지연',  after: '영업일 2~3일 납품' },
  ];

  rows.forEach((row, i) => {
    const y = 290 + i * 110;
    if (i%2===0) roundRect(ctx, 70, y-40, W-140, 90, 8, hexToRgba('#000000', 0.03));

    ctx.font = `34px "${FONT}"`;
    ctx.fillStyle = hexToRgba(C.gray, 0.7);
    ctx.fillText(row.before, 80, y+10);
    const bw = ctx.measureText(row.before).width;
    ctx.strokeStyle = hexToRgba(C.gray, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(80, y-4); ctx.lineTo(80+bw, y-4); ctx.stroke();

    ctx.font = `bold 34px "${FONT}"`;
    ctx.fillStyle = C.orange;
    ctx.fillText('→', 510, y+10);

    ctx.font = `bold 34px "${FONT}"`;
    ctx.fillStyle = C.darkText;
    ctx.fillText(row.after, 565, y+10);
  });

  roundRect(ctx, 80, 870, W-160, 90, 12, hexToRgba(C.red, 0.08));
  ctx.font = `34px "${FONT}"`;
  ctx.fillStyle = C.darkText;
  ctx.fillText('구독자 도입 전 대비', 120, 925);
  ctx.font = `bold 54px "${FONT}"`;
  ctx.fillStyle = C.red;
  ctx.fillText('3배', 530, 930);
  ctx.font = `34px "${FONT}"`;
  ctx.fillStyle = C.darkText;
  ctx.fillText('성장', 635, 925);

  return canvas;
}

// ── 카드 5: CTA (다크) ──
function card5() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.darkBg;
  ctx.fillRect(0, 0, W, H);
  drawGradientAccent(ctx);

  ctx.font = `80px "${FONT}"`;
  ctx.textAlign = 'center';
  ctx.fillText('👀', W/2, 220);

  ctx.font = `bold 62px "${FONT}"`;
  ctx.fillStyle = C.white;
  ctx.fillText('편집 때문에 쌓이는 영상,', W/2, 360);
  ctx.fillText('이제 밀리지 않습니다.', W/2, 450);

  ctx.font = `36px "${FONT}"`;
  ctx.fillStyle = C.mutedText;
  ctx.fillText('부동산 영상 전담 편집팀', W/2, 570);
  ctx.fillText('월정액 · 48시간 납품 · 수정 무제한', W/2, 620);

  roundRect(ctx, 200, 690, W-400, 100, 16, C.purple);
  ctx.font = `bold 38px "${FONT}"`;
  ctx.fillStyle = C.white;
  ctx.fillText('무료 상담 신청 → aicut.co.kr', W/2, 752);

  ctx.font = `28px "${FONT}"`;
  ctx.fillStyle = hexToRgba(C.white, 0.4);
  ctx.fillText('계약 강제 없음  ·  첫 달 언제든 해지 가능', W/2, 860);

  ctx.font = `bold 28px "${FONT}"`;
  ctx.fillStyle = hexToRgba(C.white, 0.25);
  ctx.fillText('AICUT · aicut.co.kr', W/2, 980);

  ctx.textAlign = 'left';
  return canvas;
}

// 저장
[card1, card2, card3, card4, card5].forEach((fn, i) => {
  const canvas = fn();
  const filePath = path.join(OUT_DIR, `realestate_0${i+1}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  console.log(`✅ 저장: realestate_0${i+1}.png`);
});

console.log('\n완료! blog_imgs/ 폴더에 5장 저장됨 (맑은 고딕 폰트 적용)');

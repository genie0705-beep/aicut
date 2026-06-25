/**
 * gen_insta_shopping_v3.js — 비율/간격 최종 수정본
 * 전체 1080px를 균등 분할하여 여백 최소화
 */

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

try {
  registerFont('C:\\Windows\\Fonts\\malgunbd.ttf', { family: 'MG', weight: 'bold' });
  registerFont('C:\\Windows\\Fonts\\malgun.ttf',   { family: 'MG', weight: 'normal' });
} catch(e) {}

const F = 'MG';
const W = 1080, H = 1080;
const PAD = 64;

function hex(h, a=1) {
  const r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function roundRect(ctx, x, y, w, h, r, fill, stroke, sw=2) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.stroke(); }
}

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── 배경 ──
ctx.fillStyle = '#ECEEFF';
ctx.fillRect(0, 0, W, H);

// 상단 그라디언트 바 (10px)
const topG = ctx.createLinearGradient(0,0,W,0);
topG.addColorStop(0,'#8B6FFF'); topG.addColorStop(1,'#FF6EB4');
ctx.fillStyle = topG; ctx.fillRect(0, 0, W, 10);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 레이아웃 (전체 1080 균등 배분)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [10]  그라디언트 바
// [30]  여백
// [40]  태그 pill         → y=40
// [20]  여백
// [76]  헤드라인 1줄      → y=126 (76px 폰트)
// [76]  헤드라인 2줄      → y=202
// [76]  헤드라인 3줄      → y=278
// [16]  여백
// [ 6]  언더라인          → y=300
// [28]  여백
// [54]  체크 1            → y=384 (54px 높이)
// [54]  체크 2            → y=442
// [54]  체크 3            → y=500
// [32]  여백
// [ 1]  구분선            → y=588
// [24]  여백
// [240] 정보박스          → y=612 (하단까지)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── 태그 pill ──
const tagText = '🛒 쇼핑몰 마케팅';
ctx.font = `bold 26px "${F}"`;
const tagW = ctx.measureText(tagText).width;
roundRect(ctx, PAD, 30, tagW+44, 44, 22, '#6B4FEE');
ctx.fillStyle = '#FFFFFF';
ctx.fillText(tagText, PAD+22, 62);

// ── 헤드라인 (72px, 자간 -5) ──
const HEADLINE_Y = 140;
const HEADLINE_LH = 82;
ctx.font = `bold 72px "${F}"`;
ctx.fillStyle = '#111111';

function drawTight(text, x, y, sp=-5) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + sp;
  }
}

drawTight('쇼핑몰 영상,', PAD, HEADLINE_Y);
drawTight('월 20편 올리는', PAD, HEADLINE_Y + HEADLINE_LH);
drawTight('팀의 비밀', PAD, HEADLINE_Y + HEADLINE_LH * 2);

// 언더라인
ctx.fillStyle = '#6B4FEE';
ctx.fillRect(PAD, HEADLINE_Y + HEADLINE_LH * 2 + 18, 56, 5);

// ── 체크리스트 ──
const CHECK_START = HEADLINE_Y + HEADLINE_LH * 2 + 46;
const CHECK_LH = 68;

const items = [
  { bold: '전담 에디터', rest: ' — 매달 교체 없음' },
  { bold: '브랜드 톤 고정', rest: ' — 한 번 설정으로 끝' },
  { bold: '48시간 납품', rest: ' — 시즌 캠페인도 OK' },
];

items.forEach((it, i) => {
  const y = CHECK_START + i * CHECK_LH;

  // 체크 박스
  roundRect(ctx, PAD, y - 22, 32, 32, 6, '#6B4FEE');
  ctx.font = `bold 18px "${F}"`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('✓', PAD + 16, y - 1);
  ctx.textAlign = 'left';

  // bold
  ctx.font = `bold 32px "${F}"`;
  ctx.fillStyle = '#111111';
  const bx = PAD + 46;
  let bw = 0;
  for (const ch of it.bold) {
    ctx.fillText(ch, bx + bw, y);
    bw += ctx.measureText(ch).width - 2;
  }

  // regular
  ctx.font = `28px "${F}"`;
  ctx.fillStyle = '#555555';
  ctx.fillText(it.rest, bx + bw, y);
});

// ── 구분선 ──
const DIV_Y = CHECK_START + CHECK_LH * 3 + 20;
ctx.strokeStyle = hex('#6B4FEE', 0.2);
ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(PAD, DIV_Y); ctx.lineTo(W - PAD, DIV_Y); ctx.stroke();

// ── 정보박스 ──
const BOX_Y = DIV_Y + 22;
const BOX_H = H - BOX_Y - 80; // 하단 여백 80px 확보
roundRect(ctx, PAD, BOX_Y, W - PAD * 2, BOX_H, 18, '#E8EAFF');

// 박스 내 텍스트 세로 중앙 배치
const BOX_MID = BOX_Y + BOX_H / 2;

ctx.font = `bold 32px "${F}"`;
ctx.fillStyle = '#6B4FEE';
ctx.textAlign = 'center';
ctx.fillText('소스만 넘기면 전담팀이 처리합니다.', W / 2, BOX_MID - 30);
ctx.fillText('채용 없이 바로 시작 가능해요.', W / 2, BOX_MID + 20);

// CTA 버튼 (박스 하단)
const BTN_Y = BOX_Y + BOX_H - 66;
const ctaG = ctx.createLinearGradient(PAD + 20, 0, W - PAD - 20, 0);
ctaG.addColorStop(0, '#8B6FFF'); ctaG.addColorStop(1, '#FF6EB4');
roundRect(ctx, PAD + 20, BTN_Y, W - PAD * 2 - 40, 50, 25, null);
ctx.fillStyle = ctaG; ctx.fill();
ctx.font = `bold 26px "${F}"`;
ctx.fillStyle = '#FFFFFF';
ctx.fillText('무료 상담 → aicut.co.kr', W / 2, BTN_Y + 33);
ctx.textAlign = 'left';

// ── 브랜드 워터마크 ──
ctx.fillStyle = '#6B4FEE';
ctx.beginPath(); ctx.arc(PAD + 12, H - 36, 14, 0, Math.PI * 2); ctx.fill();
ctx.font = `bold 18px "${F}"`;
ctx.fillStyle = '#FFFFFF';
ctx.textAlign = 'center';
ctx.fillText('A', PAD + 12, H - 30);
ctx.textAlign = 'left';
ctx.font = `24px "${F}"`;
ctx.fillStyle = '#555555';
ctx.fillText('aicut.co.kr', PAD + 34, H - 30);

// 페이지 번호
ctx.font = `22px "${F}"`;
ctx.fillStyle = hex('#555555', 0.4);
ctx.textAlign = 'right';
ctx.fillText('01', W - PAD, H - 30);
ctx.textAlign = 'left';

const fp = path.join(__dirname, 'insta_cards', 'card6_shopping.png');
fs.writeFileSync(fp, canvas.toBuffer('image/png'));
console.log('✅ 저장 완료');

/**
 * gen_insta_shopping_v2.js — 비율/간격 수정본
 * - 헤드라인 폰트 축소 + 자간 tight
 * - 체크리스트 간격 조정
 * - 하단 정보박스 비율 개선
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
const PAD = 72;

function hex(h, a=1) {
  const r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  if(fill){ ctx.fillStyle=fill; ctx.fill(); }
}

// 자간 tight하게 글자 직접 그리기
function drawTight(ctx, text, x, y, spacing = -3) {
  let curX = x;
  for (const ch of text) {
    ctx.fillText(ch, curX, y);
    curX += ctx.measureText(ch).width + spacing;
  }
  return curX;
}

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── 배경 ──
ctx.fillStyle = '#ECEEFF';
ctx.fillRect(0, 0, W, H);

// 상단 그라디언트 바
const topG = ctx.createLinearGradient(0,0,W,0);
topG.addColorStop(0,'#8B6FFF'); topG.addColorStop(1,'#FF6EB4');
ctx.fillStyle = topG; ctx.fillRect(0, 0, W, 12);

// ── 태그 pill (y=36) ──
const tagText = '🛒 쇼핑몰 마케팅';
ctx.font = `bold 28px "${F}"`;
const tagW = ctx.measureText(tagText).width;
roundRect(ctx, PAD, 36, tagW+48, 48, 24, '#6B4FEE');
ctx.fillStyle = '#FFFFFF';
ctx.fillText(tagText, PAD+24, 70);

// ── 헤드라인 (y=150~320) — 폰트 80px, 자간 tight ──
ctx.font = `bold 68px "${F}"`;
ctx.fillStyle = '#111111';
const lines = ['쇼핑몰 영상,', '월 20편 올리는', '팀의 비밀'];
lines.forEach((line, i) => {
  drawTight(ctx, line, PAD, 152 + i * 84, -6);
});

// 퍼플 언더라인
ctx.fillStyle = '#6B4FEE';
ctx.fillRect(PAD, 370, 56, 5);

// ── 체크리스트 (y=395~530) ──
const items = [
  { bold: '전담 에디터', rest: ' — 매달 교체 없음' },
  { bold: '브랜드 톤 고정', rest: ' — 한 번 설정으로 끝' },
  { bold: '48시간 납품', rest: ' — 시즌 캠페인도 OK' },
];

items.forEach((it, i) => {
  const y = 416 + i * 68;

  // 체크 아이콘 박스
  roundRect(ctx, PAD, y-26, 36, 36, 6, '#6B4FEE');
  ctx.font = `bold 20px "${F}"`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('✓', PAD+18, y-3);
  ctx.textAlign = 'left';

  // bold 텍스트
  ctx.font = `bold 32px "${F}"`;
  ctx.fillStyle = '#111111';
  const bx = PAD + 50;
  drawTight(ctx, it.bold, bx, y, -2);
  const bw = it.bold.split('').reduce((acc, ch) => {
    ctx.font = `bold 32px "${F}"`;
    return acc + ctx.measureText(ch).width - 2;
  }, 0);

  // regular 텍스트
  ctx.font = `28px "${F}"`;
  ctx.fillStyle = '#555555';
  ctx.fillText(it.rest, bx + bw, y);
});

// ── 구분선 ──
ctx.strokeStyle = hex('#6B4FEE', 0.15);
ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(PAD, 628); ctx.lineTo(W-PAD, 628); ctx.stroke();

// ── 정보박스 (y=648) ──
roundRect(ctx, PAD, 648, W-PAD*2, 220, 18, '#E8EAFF');

// 박스 내 아이콘
ctx.font = `44px "${F}"`;
ctx.fillText('💡', PAD+24, 716);

ctx.font = `bold 31px "${F}"`;
ctx.fillStyle = '#6B4FEE';
drawTight(ctx, '소스만 넘기면 전담팀이 처리합니다.', PAD+82, 710, -1);
ctx.font = `bold 31px "${F}"`;
drawTight(ctx, '채용 없이 바로 시작 가능해요.', PAD+82, 752, -1);

// 하단 CTA 라인
const ctaG = ctx.createLinearGradient(PAD, 800, W-PAD, 800);
ctaG.addColorStop(0,'#8B6FFF'); ctaG.addColorStop(1,'#FF6EB4');
roundRect(ctx, PAD+16, 792, W-PAD*2-32, 52, 26, null);
ctx.fillStyle = ctaG;
ctx.fill();
ctx.font = `bold 26px "${F}"`;
ctx.fillStyle = '#FFFFFF';
ctx.textAlign = 'center';
ctx.fillText('무료 상담 → aicut.co.kr', W/2, 826);
ctx.textAlign = 'left';

// ── 브랜드 워터마크 ──
ctx.fillStyle = '#6B4FEE';
ctx.beginPath(); ctx.arc(PAD+14, H-46, 16, 0, Math.PI*2); ctx.fill();
ctx.font = `bold 20px "${F}"`;
ctx.fillStyle = '#FFFFFF';
ctx.textAlign = 'center';
ctx.fillText('A', PAD+14, H-40);
ctx.textAlign = 'left';
ctx.font = `26px "${F}"`;
ctx.fillStyle = '#555555';
ctx.fillText('aicut.co.kr', PAD+40, H-40);

// 페이지 번호
ctx.font = `24px "${F}"`;
ctx.fillStyle = hex('#555555', 0.4);
ctx.textAlign = 'right';
ctx.fillText('01', W-PAD, H-40);
ctx.textAlign = 'left';

const fp = path.join(__dirname, 'insta_cards', 'card6_shopping.png');
fs.writeFileSync(fp, canvas.toBuffer('image/png'));
console.log('✅ 저장:', fp);

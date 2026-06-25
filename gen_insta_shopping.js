/**
 * gen_insta_shopping.js
 * 주제: 쇼핑몰 영상, 월 20편 올리는 법
 * 스타일: target_02_marketer (라벤더 bg) + target_05_cta (그라디언트 버튼)
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

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── 배경: 라벤더 (target_02 스타일) ──
ctx.fillStyle = '#ECEEFF';
ctx.fillRect(0, 0, W, H);

// 상단 그라디언트 바
const topG = ctx.createLinearGradient(0,0,W,0);
topG.addColorStop(0,'#8B6FFF'); topG.addColorStop(1,'#FF6EB4');
ctx.fillStyle = topG; ctx.fillRect(0, 0, W, 14);

// 태그 pill
const tagText = '🛒 쇼핑몰 마케팅';
ctx.font = `bold 30px "${F}"`;
const tagW = ctx.measureText(tagText).width;
roundRect(ctx, 72, 44, tagW+56, 52, 26, '#6B4FEE');
ctx.fillStyle = '#FFFFFF';
ctx.fillText(tagText, 100, 81);

// 메인 헤드라인
ctx.font = `bold 96px "${F}"`;
ctx.fillStyle = '#111111';
ctx.fillText('쇼핑몰 영상,', 72, 230);
ctx.fillText('월 20편 올리는', 72, 340);
ctx.fillText('팀의 비밀', 72, 450);

// 퍼플 언더라인
ctx.fillStyle = '#6B4FEE';
ctx.fillRect(72, 478, 80, 6);

// 체크리스트
const items = [
  { bold: '전담 에디터', rest: '— 매달 교체 없음' },
  { bold: '브랜드 톤 고정', rest: '— 한 번 설정으로 끝' },
  { bold: '48시간 납품', rest: '— 시즌 캠페인도 OK' },
];
items.forEach((it, i) => {
  const y = 548 + i * 86;
  ctx.font = `34px "${F}"`; ctx.fillStyle = '#111111';
  ctx.fillText('✅', 72, y);
  ctx.font = `bold 34px "${F}"`;
  ctx.fillText(it.bold, 128, y);
  const bw = ctx.measureText(it.bold).width;
  ctx.font = `34px "${F}"`; ctx.fillStyle = '#555555';
  ctx.fillText('  ' + it.rest, 128 + bw, y);
});

// 하단 정보박스 (target_02 스타일)
roundRect(ctx, 72, 808, W-144, 172, 18, '#E8EAFF');
ctx.font = `bold 34px "${F}"`; ctx.fillStyle = '#6B4FEE';
ctx.fillText('소스만 넘기면 전담팀이 처리합니다.', 104, 868);
ctx.font = `bold 34px "${F}"`; ctx.fillStyle = '#6B4FEE';
ctx.fillText('채용 없이 바로 시작 가능해요.', 104, 918);

// 브랜드 워터마크
ctx.fillStyle = '#6B4FEE';
ctx.beginPath(); ctx.arc(90, H-58, 18, 0, Math.PI*2); ctx.fill();
ctx.font = `bold 22px "${F}"`; ctx.fillStyle = '#FFFFFF';
ctx.textAlign = 'center'; ctx.fillText('A', 90, H-51);
ctx.textAlign = 'left';
ctx.font = `28px "${F}"`; ctx.fillStyle = '#555555';
ctx.fillText('aicut.co.kr', 118, H-50);

const fp = path.join(__dirname, 'insta_cards', 'card6_shopping.png');
fs.writeFileSync(fp, canvas.toBuffer('image/png'));
console.log('✅ 저장:', fp);

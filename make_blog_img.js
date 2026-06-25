// 블로그 이미지 v3 — 기존 포스팅 스타일 맞춤 (886x886 정사각형)
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');

registerFont('C:\\Windows\\Fonts\\malgun.ttf', { family: 'Malgun Gothic' });

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

const S = 886; // 정사각형 (기존 포스팅과 동일)

// ===== 이미지 1: 대표 타이틀 (블로그 리스트 썸네일 + 본문 1번) =====
const c1 = createCanvas(S, S);
const ctx = c1.getContext('2d');

const grad = ctx.createLinearGradient(0, 0, S, S);
grad.addColorStop(0, '#0d0d1a');
grad.addColorStop(0.5, '#151530');
grad.addColorStop(1, '#0d0d1a');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, S, S);

// 퍼플 블롬
const g1 = ctx.createRadialGradient(80, 80, 10, 80, 80, 350);
g1.addColorStop(0, 'rgba(124,58,237,0.12)');
g1.addColorStop(1, 'rgba(124,58,237,0)');
ctx.fillStyle = g1;
ctx.fillRect(0, 0, 400, 400);

// 상단 라인
ctx.fillStyle = '#7c3aed';
ctx.fillRect(45, 40, 80, 5);
ctx.fillStyle = '#a78bfa';
ctx.fillRect(130, 40, 40, 5);

// 카테고리
ctx.fillStyle = 'rgba(124,58,237,0.2)';
roundRect(ctx, 45, 65, 150, 36, 18);
ctx.fill();
ctx.font = 'bold 16px "Malgun Gothic"';
ctx.fillStyle = '#a78bfa';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('📹 영상편집 팁', 120, 83);

// 메인 타이틀
ctx.textBaseline = 'top';
ctx.textAlign = 'left';
ctx.font = 'bold 40px "Malgun Gothic"';
ctx.fillStyle = '#ffffff';
ctx.fillText('스타트업 CEO가', 45, 140);
ctx.fillText('영상 PD 대신', 45, 196);

ctx.font = 'bold 42px "Malgun Gothic"';
ctx.fillStyle = '#a78bfa';
ctx.fillText('월정기 편집을', 45, 260);
ctx.fillText('선택한 이유', 45, 316);

// 핵심 문구
ctx.fillStyle = 'rgba(124,58,237,0.15)';
roundRect(ctx, 45, 380, 500, 50, 25);
ctx.fill();

ctx.font = 'bold 17px "Malgun Gothic"';
ctx.fillStyle = '#c4b5fd';
ctx.textBaseline = 'middle';
ctx.textAlign = 'center';
ctx.fillText('인력 부담 없이 매월 20편 정기 납품 · D+1 납기', 295, 405);

// 하단 브랜드
ctx.fillStyle = 'rgba(124,58,237,0.08)';
ctx.fillRect(0, S - 65, S, 65);
ctx.textBaseline = 'middle';
ctx.font = 'bold 20px "Malgun Gothic"';
ctx.fillStyle = '#a78bfa';
ctx.textAlign = 'left';
ctx.fillText('✂️ 에이컷 AICUT', 45, S - 32);
ctx.font = '14px "Malgun Gothic"';
ctx.fillStyle = '#6b7280';
ctx.textAlign = 'right';
ctx.fillText('aicut.co.kr', S - 45, S - 32);

fs.writeFileSync('blog_thumb.png', c1.toBuffer('image/png'));
console.log('✅ blog_thumb.png (886x886)');

// ===== 이미지 2: 비교표 (에이컷 vs 일반 외주) =====
const c2 = createCanvas(S, S);
const ctx2 = c2.getContext('2d');

const grad2 = ctx2.createLinearGradient(0, 0, S, S);
grad2.addColorStop(0, '#0d0d1a');
grad2.addColorStop(0.5, '#151530');
grad2.addColorStop(1, '#0d0d1a');
ctx2.fillStyle = grad2;
ctx2.fillRect(0, 0, S, S);

const g2 = ctx2.createRadialGradient(S - 100, 60, 10, S - 100, 60, 300);
g2.addColorStop(0, 'rgba(124,58,237,0.1)');
g2.addColorStop(1, 'rgba(124,58,237,0)');
ctx2.fillStyle = g2;
ctx2.fillRect(S - 350, 0, 400, 350);

ctx2.fillStyle = '#7c3aed';
ctx2.fillRect(45, 40, 80, 4);
ctx2.fillStyle = '#a78bfa';
ctx2.fillRect(130, 40, 40, 4);

ctx2.textBaseline = 'top';
ctx2.textAlign = 'left';
ctx2.font = 'bold 30px "Malgun Gothic"';
ctx2.fillStyle = '#ffffff';
ctx2.fillText('에이컷 월정액 vs 일반 외주', 45, 80);

ctx2.font = '17px "Malgun Gothic"';
ctx2.fillStyle = '#9ca3af';
ctx2.fillText('실제 비용과 운영 방식을 비교해 봅니다', 45, 125);

// 비교표 헤더
const tblX = 55;
const colW1 = 200;
const colW2 = 270;
const colW3 = 270;
const rowH = 56;
const startY = 190;

ctx2.fillStyle = 'rgba(124,58,237,0.2)';
roundRect(ctx2, 45, startY, S - 90, 44, 10);
ctx2.fill();

ctx2.textBaseline = 'middle';
ctx2.font = 'bold 16px "Malgun Gothic"';
ctx2.fillStyle = '#a78bfa';
ctx2.textAlign = 'center';
ctx2.fillText('구분', tblX + colW1 / 2, startY + 22);
ctx2.fillText('에이컷 월정액 ✂️', tblX + colW1 + colW2 / 2, startY + 22);
ctx2.fillText('일반 외주/프리랜서', tblX + colW1 + colW2 + colW3 / 2, startY + 22);

// 비교 데이터
const rows = [
  { item: '월 비용', aicut: '49만 원~ (4편)', other: '50만~150만 원 (10편)' },
  { item: '납기', aicut: 'D+1 (24시간)', other: '평균 5~7일' },
  { item: '담당자', aicut: '전담 1:1 고정', other: '매번 다른 편집자' },
  { item: '수정', aicut: '무제한', other: '2~3회 초과 시 추가 비용' },
  { item: '퀄리티', aicut: '브랜드 저장 → 일정', other: '들쭉날쭉' },
  { item: '계약', aicut: '강제 없음', other: '건별 계약' },
];

let ry = startY + 55;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  // 교차 배경
  if (i % 2 === 0) {
    ctx2.fillStyle = 'rgba(124,58,237,0.03)';
    roundRect(ctx2, 45, ry - 3, S - 90, rowH, 6);
    ctx2.fill();
  }

  ctx2.font = '16px "Malgun Gothic"';
  ctx2.textAlign = 'center';
  ctx2.fillStyle = '#d1d5db';
  ctx2.fillText(row.item, tblX + colW1 / 2, ry + rowH / 2);

  ctx2.fillStyle = '#a78bfa';
  ctx2.fillText(row.aicut, tblX + colW1 + colW2 / 2, ry + rowH / 2);

  ctx2.fillStyle = '#6b7280';
  ctx2.fillText(row.other, tblX + colW1 + colW2 + colW3 / 2, ry + rowH / 2);

  ry += rowH + 2;
}

// 하단 브랜드
ctx2.fillStyle = 'rgba(124,58,237,0.08)';
ctx2.fillRect(0, S - 65, S, 65);
ctx2.textBaseline = 'middle';
ctx2.font = 'bold 20px "Malgun Gothic"';
ctx2.fillStyle = '#a78bfa';
ctx2.textAlign = 'left';
ctx2.fillText('✂️ 에이컷 AICUT', 45, S - 32);
ctx2.font = '14px "Malgun Gothic"';
ctx2.fillStyle = '#6b7280';
ctx2.textAlign = 'right';
ctx2.fillText('aicut.co.kr', S - 45, S - 32);

fs.writeFileSync('blog_content_img.png', c2.toBuffer('image/png'));
console.log('✅ blog_content_img.png (886x886)');

// ===== 이미지 3: 서비스 혜택 3단 =====
const c3 = createCanvas(S, S);
const ctx3 = c3.getContext('2d');

const grad3 = ctx3.createLinearGradient(0, 0, S, S);
grad3.addColorStop(0, '#0d0d1a');
grad3.addColorStop(0.5, '#151530');
grad3.addColorStop(1, '#0d0d1a');
ctx3.fillStyle = grad3;
ctx3.fillRect(0, 0, S, S);

const g3 = ctx3.createRadialGradient(100, 400, 10, 100, 400, 400);
g3.addColorStop(0, 'rgba(124,58,237,0.1)');
g3.addColorStop(1, 'rgba(124,58,237,0)');
ctx3.fillStyle = g3;
ctx3.fillRect(0, 200, 500, 500);

ctx3.fillStyle = '#7c3aed';
ctx3.fillRect(45, 40, 80, 4);
ctx3.fillStyle = '#a78bfa';
ctx3.fillRect(130, 40, 40, 4);

ctx3.textBaseline = 'top';
ctx3.textAlign = 'left';
ctx3.font = 'bold 30px "Malgun Gothic"';
ctx3.fillStyle = '#ffffff';
ctx3.fillText('월정기 편집, 이렇게 다릅니다', 45, 80);

// 3개 혜택 카드 (세로 배치 - 정사각형에 최적)
const cards = [
  { icon: '👤', title: '전담 에디터 1:1 배정', desc: '한 번 브랜드 가이드를 전달하면\n매번 브리핑할 필요 없이\n일정한 퀄리티로 작업합니다', tag: 'TIME SAVER' },
  { icon: '⚡', title: 'D+1 초고속 납기', desc: '원본 수령 후 24시간 이내\n1차 편집본 완성.\n늦어도 광고 일정이 밀리지 않습니다', tag: 'SPEED' },
  { icon: '📊', title: '재계약률 92%', desc: '납기 준수율 100%\n만족도 4.9/5\n3개월 이상 고객 92%가 재계약', tag: 'TRUST' },
];

let cy = 145;
for (const card of cards) {
  ctx3.fillStyle = 'rgba(124,58,237,0.08)';
  roundRect(ctx3, 45, cy, S - 90, 175, 14);
  ctx3.fill();

  // 아이콘
  ctx3.font = '36px "Malgun Gothic"';
  ctx3.textAlign = 'left';
  ctx3.textBaseline = 'top';
  ctx3.fillText(card.icon, 65, cy + 22);

  // 타이틀
  ctx3.font = 'bold 22px "Malgun Gothic"';
  ctx3.fillStyle = '#ffffff';
  ctx3.fillText(card.title, 115, cy + 25);

  // 태그
  ctx3.fillStyle = 'rgba(124,58,237,0.2)';
  roundRect(ctx3, S - 180, cy + 20, 110, 30, 15);
  ctx3.fill();
  ctx3.font = 'bold 12px "Malgun Gothic"';
  ctx3.fillStyle = '#a78bfa';
  ctx3.textAlign = 'center';
  ctx3.fillText(card.tag, S - 125, cy + 35);

  // 설명
  ctx3.textAlign = 'left';
  ctx3.font = '16px "Malgun Gothic"';
  ctx3.fillStyle = '#9ca3af';
  const lines = card.desc.split('\n');
  let dy = cy + 68;
  for (const line of lines) {
    ctx3.fillText(line, 65, dy);
    dy += 26;
  }

  cy += 195;
}

// 하단 브랜드
ctx3.fillStyle = 'rgba(124,58,237,0.08)';
ctx3.fillRect(0, S - 65, S, 65);
ctx3.textBaseline = 'middle';
ctx3.font = 'bold 20px "Malgun Gothic"';
ctx3.fillStyle = '#a78bfa';
ctx3.textAlign = 'left';
ctx3.fillText('✂️ 에이컷 AICUT', 45, S - 32);
ctx3.font = '14px "Malgun Gothic"';
ctx3.fillStyle = '#6b7280';
ctx3.textAlign = 'right';
ctx3.fillText('aicut.co.kr', S - 45, S - 32);

fs.writeFileSync('blog_content_img2.png', c3.toBuffer('image/png'));
console.log('✅ blog_content_img2.png (886x886)');

console.log('\n🎉 3개 이미지 모두 886x886 정사각형으로 생성 완료');

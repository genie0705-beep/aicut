const fs = require('fs');
const html = fs.readFileSync('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', 'utf-8');
const lines = html.split('\n');

// CSS 종료 위치 (</style>)
const styleEnd = html.indexOf('</style>');
const styleEndLine = html.substring(0, styleEnd).split('\n').length;
console.log(`CSS 종료: L${styleEndLine}`);

// 파일 끝부분 (> 마지막 </html>)
const totalLines = lines.length;
console.log(`총 라인: ${totalLines}`);

// contract table 구조 찾기
for (let i = 0; i < totalLines; i++) {
  if (lines[i].includes('id="contract-table"') || lines[i].includes('id="contracts"') || 
      (lines[i].includes('contract') && lines[i].includes('thead'))) {
    console.log(`contract table 관련 L${i+1}: ${lines[i].trim().substring(0, 120)}`);
  }
}

// 마지막 </html> 근처 5줄
console.log('\n=== 파일 마지막 5줄 ===');
for (let i = Math.max(0, totalLines-5); i < totalLines; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}

// JS 함수 goPage 위치 찾기
for (let i = 0; i < totalLines; i++) {
  if (lines[i].includes('function goPage') || lines[i].includes('function showToast') || lines[i].includes('function openModal')) {
    console.log(`\n함수 위치 L${i+1}: ${lines[i].trim().substring(0, 100)}`);
  }
}

// contract-table body 구조 샘플 (일부만)
let inContract = false;
let contractLines = 0;
for (let i = 0; i < totalLines; i++) {
  if (lines[i].includes('id="contract-table"')) { inContract = true; }
  if (inContract) {
    if (lines[i].includes('</table') || lines[i].includes('</tbody>')) { 
      console.log(`\ncontract 테이블 끝 L${i+1}`);
      break; 
    }
    if (contractLines < 5) {
      console.log(`contract L${i+1}: ${lines[i].trim().substring(0, 120)}`);
      contractLines++;
    }
  }
}

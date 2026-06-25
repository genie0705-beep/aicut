const XLSX = require('xlsx');
const fs = require('fs');

const targets = JSON.parse(fs.readFileSync('C:/Users/paul/.openclaw/workspace/insta_targets.json', 'utf8'));

const rows = targets.map((t, i) => ({
  '번호': i + 1,
  '인스타그램 계정': '@' + t.username,
  '프로필 URL': t.url,
  '분야': t.tag,
  'DM 발송 여부': '',
  '응답 여부': '',
  '메모': ''
}));

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);

// 컬럼 너비 설정
ws['!cols'] = [
  { wch: 6 },
  { wch: 28 },
  { wch: 42 },
  { wch: 18 },
  { wch: 14 },
  { wch: 12 },
  { wch: 20 },
];

XLSX.utils.book_append_sheet(wb, ws, '타겟 계정 목록');

const outPath = 'C:/Users/paul/.openclaw/workspace/에이컷_인스타_DM_타겟목록.xlsx';
XLSX.writeFile(wb, outPath);
console.log(`✅ 저장 완료: ${outPath}`);
console.log(`총 ${rows.length}개 계정`);

// 분야별 요약
const summary = {};
targets.forEach(t => { summary[t.tag] = (summary[t.tag] || 0) + 1; });
Object.entries(summary).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}개`));

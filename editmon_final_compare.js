const fs = require('fs');

// 어제 이메일 (editmon_emails.txt)
const oldText = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\editmon_emails.txt', 'utf-8');
const oldEmails = [];
oldText.split('\n').forEach(line => {
  const email = line.trim().toLowerCase();
  if (email.includes('@') && email.includes('.')) oldEmails.push(email);
});
const oldSet = new Set(oldEmails);

// 오늘 수집 데이터
const jsonStr = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\editmon_new_data.json', 'utf-8');
const data = JSON.parse(jsonStr);

const newEmails = data.success.map(item => item.email.toLowerCase().trim());

// 중복 체크
const uniqueNewSet = new Set();
const dedupedNew = [];

for (const email of newEmails) {
  if (!oldSet.has(email) && !uniqueNewSet.has(email)) {
    uniqueNewSet.add(email);
    dedupedNew.push(email);
  }
}

const totalToday = new Set(newEmails).size;
const duplicatesToday = newEmails.length - totalToday;

console.log('=== 이메일 수집 비교 결과 ===\n');
console.log(`어제 수집 (중복제거): ${oldSet.size}개`);
console.log(`오늘 수집 (원본): ${newEmails.length}개`);
console.log(`오늘 수집 (중복제거): ${totalToday}개`);
console.log(`오늘 내 중복: ${duplicatesToday}개`);
console.log(`신규 발견 (어제에 없던): ${uniqueNewSet.size}개\n`);

if (uniqueNewSet.size > 0) {
  console.log('=== 신규 이메일 목록 ===');
  const seen = new Set();
  dedupedNew.forEach((email, i) => {
    const matches = data.success.filter(item => item.email.toLowerCase().trim() === email);
    if (matches.length === 0) return;
    const match = matches[0];
    const key = email + match.url;
    if (seen.has(key)) return;
    seen.add(key);
    
    const company = match.company && match.company !== 'N/A' ? match.company.replace(/<[^>]+>/g, '') : '';
    const title = match.title && match.title !== 'N/A' ? match.title.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '') : '';
    const url = match.url || '';
    
    console.log(`${i+1}. ${email}`);
    if (company) console.log(`   업체: ${company}`);
    if (title) console.log(`   제목: ${title}`);
    console.log(`   링크: ${url}\n`);
  });
} else {
  console.log('신규 이메일이 없습니다. 모두 중복입니다.');
}

console.log('========================================');
console.log(`어제: ${oldSet.size}개 → 오늘 신규: ${uniqueNewSet.size}개 (중복: ${totalToday - uniqueNewSet.size}개)`);

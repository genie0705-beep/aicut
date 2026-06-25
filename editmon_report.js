const fs = require('fs');

// 어제 이메일
const oldText = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\editmon_emails.txt', 'utf-8');
const oldEmails = [];
oldText.split('\n').forEach(line => {
  const email = line.trim().toLowerCase();
  if (email.includes('@') && email.includes('.')) oldEmails.push(email);
});
const oldSet = new Set(oldEmails);

// 오늘 데이터
const jsonStr = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\editmon_new_data.json', 'utf-8');
const data = JSON.parse(jsonStr);

// 신규 이메일만 추출 (중복제거)
const seen = new Set();
const newUnique = [];
for (const item of data.success) {
  const email = item.email.trim().toLowerCase();
  if (!oldSet.has(email) && !seen.has(email)) {
    seen.add(email);
    newUnique.push(email);
  }
}

// 출력
console.log('=== 편집몬 신규 이메일 목록 ===');
console.log(`(어제 대비 신규: ${newUnique.length}개 / 중복제거 오늘 전체: ${new Set(data.success.map(i=>i.email.trim().toLowerCase())).size}개)\n`);
newUnique.forEach((e, i) => console.log(`${i+1}. ${e}`));
console.log(`\n--- 총 ${newUnique.length}개 ---`);

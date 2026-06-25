const fs = require('fs');

// 어제 이메일 (editmon_emails.txt)
const oldText = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\editmon_emails.txt', 'utf-8');
const oldEmails = [];
oldText.split('\n').forEach(line => {
  const email = line.trim().toLowerCase();
  if (email.includes('@') && email.includes('.')) oldEmails.push(email);
});
const oldSet = new Set(oldEmails);

// 오늘 수집된 이메일 (스크립트 다시 실행하여 JSON 저장)
const { execSync } = require('child_process');
const result = execSync('node C:\\Users\\paul\\.openclaw\\workspace\\editmon_scraper.js', { 
  timeout: 120000,
  maxBuffer: 10 * 1024 * 1024 
}).toString();

// JSON 추출
const jsonStart = result.indexOf('===JSON_START===');
const jsonEnd = result.indexOf('===JSON_END===');
if (jsonStart < 0 || jsonEnd < 0) {
  console.log('JSON을 찾을 수 없습니다.');
  process.exit(1);
}

const jsonStr = result.substring(jsonStart + 15, jsonEnd);
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

// 오늘 수집 통계
const totalToday = new Set(newEmails).size;

console.log('=== 이메일 수집 비교 결과 ===');
console.log('');
console.log('어제 수집 (중복제거):', oldSet.size, '개');
console.log('오늘 수집 (중복제거):', totalToday, '개');
console.log('신규 발견 (어제에 없던):', dedupedNew.length, '개');
console.log('');

if (dedupedNew.length > 0) {
  console.log('=== 신규 이메일 목록 ===');
  dedupedNew.forEach((email, i) => {
    // 해당 회사/제목 정보 찾기
    const match = data.success.find(item => item.email.toLowerCase().trim() === email);
    const company = match ? (match.company || 'N/A') : 'N/A';
    const title = match ? (match.title || 'N/A') : 'N/A';
    console.log(`${i+1}. ${email}`);
    console.log(`   업체: ${company}`);
    console.log(`   제목: ${title.replace(/<[^>]+>/g, '')}`);
    console.log(`   링크: ${match ? match.url : ''}`);
    console.log('');
  });
} else {
  console.log('신규 이메일이 없습니다. 모두 중복입니다.');
}

// 전체 이메일 통계
console.log('========================================');
console.log('어제 전체:', oldSet.size, '개');
console.log('오늘 (중복제거):', totalToday, '개');
console.log('그중 신규:', dedupedNew.length, '개');
console.log('중복:', totalToday - dedupedNew.length, '개');

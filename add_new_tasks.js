const fs = require('fs');
const path = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_marketing_dashboard.html';
let html = fs.readFileSync(path, 'utf8');

const newTasks = `
      { id:'task_012', team:'dev', title:'블로그 포스팅 작성', time:'10:00', order:1, date:dateStr, status:'대기', assignee:'에이든', note:'', createdAt:iso },
      { id:'task_013', team:'dev', title:'블로그 이미지 생성', time:'11:00', order:1, date:dateStr, status:'대기', assignee:'에이든', note:'', createdAt:iso },
      { id:'task_014', team:'dev', title:'인스타그램 피드 업로드', time:'14:30', order:1, date:dateStr, status:'대기', assignee:'에이든', note:'', createdAt:iso },
      { id:'task_015', team:'dev', title:'지식iN 답변 등록', time:'15:30', order:1, date:dateStr, status:'대기', assignee:'에이든', note:'', createdAt:iso },
`;

// Find the defaults closing bracket
const marker = "assignee:'기획팀', note:'', createdAt:iso }";
const closingBracket = "    ];";

const markerPos = html.indexOf(marker);
if (markerPos > 0) {
  const afterMarker = html.indexOf(closingBracket, markerPos);
  if (afterMarker > 0) {
    html = html.substring(0, afterMarker) + newTasks + "\n" + html.substring(afterMarker);
    fs.writeFileSync(path, html, 'utf8');
    console.log('✅ New tasks added');
  }
}

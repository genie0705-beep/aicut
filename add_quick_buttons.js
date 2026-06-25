const fs = require('fs');
const path = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_marketing_dashboard.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Add quick run buttons to blog page
const blogSectionHead = '네이버 블로그 한눈보기';
const blogKpiStart = '<!-- KPI Row -->';
const blogActionButtons = `\n        <!-- 실행 버튼 -->\n        <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">\n          <button class="btn btn-sm" style="background:var(--green-600);color:#fff;border:none;" onclick="quickRunTask(\'task_012\',\'블로그 포스팅 작성\')"><i class="ti ti-player-play"></i> 블로그 포스팅 작성</button>\n          <button class="btn btn-sm" style="background:var(--blue-600);color:#fff;border:none;" onclick="quickRunTask(\'task_013\',\'블로그 이미지 생성\')"><i class="ti ti-player-play"></i> 블로그 이미지 생성</button>\n        </div>\n\n        <!-- KPI Row -->`;

const blogIdx = html.indexOf(blogSectionHead);
if (blogIdx > 0) {
  const kpiIdx = html.indexOf(blogKpiStart, blogIdx);
  if (kpiIdx > 0) {
    html = html.substring(0, kpiIdx) + blogActionButtons + html.substring(kpiIdx + blogKpiStart.length);
    console.log('Blog buttons added');
  }
}

// 2. Add quick run buttons to instagram page
const instaSectionHead = '인스타그램 한눈보기';
const instaKpiStart = '<!-- KPI Row -->';
const instaActionButtons = `\n        <!-- 실행 버튼 -->\n        <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">\n          <button class="btn btn-sm" style="background:var(--green-600);color:#fff;border:none;" onclick="quickRunTask(\'task_014\',\'인스타그램 피드 업로드\')"><i class="ti ti-player-play"></i> 인스타그램 피드 업로드</button>\n        </div>\n\n        <!-- KPI Row -->`;

const instaIdx = html.indexOf(instaSectionHead);
if (instaIdx > 0) {
  const kpiIdx2 = html.indexOf(instaKpiStart, instaIdx);
  if (kpiIdx2 > 0) {
    html = html.substring(0, kpiIdx2) + instaActionButtons + html.substring(kpiIdx2 + instaKpiStart.length);
    console.log('Instagram buttons added');
  }
}

// 3. Add the quickRunTask function (if not exists)
if (!html.includes('function quickRunTask')) {
  const taskQueueRef = 'showToast(\'?? 데이터가 갱신되었습니다.'; // Find a good insertion point
  const quickFn = `
// ===== 빠른 작업 실행 (블로그/인스타 페이지에서 직접 실행) =====
function quickRunTask(taskId, taskTitle) {
  if (typeof requestTaskExecution === 'function') {
    var tasks = taskStore.load();
    var task = tasks.find(function(t) { return t.id === taskId; });
    if (task) {
      taskStore.setStatus(taskId, '진행중');
      requestTaskExecution(taskId, taskTitle);
      showToast('🛠️ 에이든에게 "' + taskTitle + '" 작업이 전달되었습니다!');
    } else {
      showToast('❌ 작업을 찾을 수 없습니다.');
    }
  } else {
    showToast('❌ 작업 실행 시스템이 초기화되지 않았습니다.');
  }
}

`;
  const insertIdx = html.indexOf('function checkTaskQueue');
  if (insertIdx > 0) {
    html = html.substring(0, insertIdx) + quickFn + '\n' + html.substring(insertIdx);
    console.log('quickRunTask function added');
  }
}

fs.writeFileSync(path, html, 'utf8');
console.log('File saved');

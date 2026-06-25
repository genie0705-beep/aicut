const fs = require('fs');
const path = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_marketing_dashboard.html';
let html = fs.readFileSync(path, 'utf8');

// 1. 작업 큐 시스템 추가 (localStorage 기반)
const taskQueueCode = `

// ===== 작업 실행 큐 (에이든 실행 시스템) =====
const TASK_QUEUE_KEY = 'aicut_task_queue';

function requestTaskExecution(taskId, taskTitle) {
  const queue = JSON.parse(localStorage.getItem(TASK_QUEUE_KEY) || '[]');
  queue.push({
    taskId: taskId,
    title: taskTitle,
    requestedAt: new Date().toISOString(),
    status: '요청됨'
  });
  localStorage.setItem(TASK_QUEUE_KEY, JSON.stringify(queue));
  showToast('🛠️ 에이든에게 "' + taskTitle + '" 작업이 전달되었습니다!');
  
  // 메인 세션에 알림 (localStorage 이벤트)
  localStorage.setItem('aicut_task_signal', Date.now().toString());
}

// 주기적으로 작업 큐 확인 (에이든이 실행)
function checkTaskQueue() {
  const queue = JSON.parse(localStorage.getItem(TASK_QUEUE_KEY) || '[]');
  const pending = queue.filter(t => t.status === '요청됨');
  if (pending.length > 0) {
    console.log('[에이든] 실행 대기 작업:', pending.length + '건');
  }
  return pending;
}

function completeTask(taskId) {
  const queue = JSON.parse(localStorage.getItem(TASK_QUEUE_KEY) || '[]');
  const task = queue.find(t => t.taskId === taskId && t.status === '요청됨');
  if (task) {
    task.status = '완료';
    task.completedAt = new Date().toISOString();
    localStorage.setItem(TASK_QUEUE_KEY, JSON.stringify(queue));
    
    // taskStore 상태도 업데이트
    const tasks = taskStore.load();
    const t = tasks.find(x => x.id === taskId);
    if (t) { t.status = '완료'; taskStore.save(tasks); }
  }
}
`;

// Insert after taskStore definition
const taskStoreEnd = html.indexOf('getFiltered(opts');
const insertPoint = html.indexOf('};', html.indexOf('deleteTask', taskStoreEnd));
if (insertPoint > 0) {
  const afterBrace = html.indexOf('}', insertPoint) + 1;
  const beforeRest = html.indexOf('// =====', afterBrace);
  if (beforeRest > 0) {
    html = html.substring(0, beforeRest) + taskQueueCode + html.substring(beforeRest);
    console.log('✅ Task queue code inserted');
  }
}

// 2. Add execution button to 에이든 task cards in renderTasks
// Find the actions section in the first hour slot rendering
const actionMarker1 = 'html += \'<div class="tc-actions">\';';
let count = 0;
let pos = html.indexOf(actionMarker1);
while (pos > 0 && count < 3) {
  // Find the </select> before tc-edit-btn
  const selectEnd = html.indexOf('</select>', pos);
  const editBtn = html.indexOf('tc-edit-btn', selectEnd);
  
  // Add 실행 button BEFORE edit button, only for 에이든 tasks
  const insertAt = editBtn;
  const runBtnHtml = '\' + (t.assignee === \'\uC5D0\uC774\uB4E0\' ? \'<button class="btn btn-xs tc-run-btn" title="\uC2E4\uD589" style="background:var(--purple-700);color:#fff;border:none;padding:1px 6px;font-size:10px;border-radius:4px;">\u25B6</button>\' : \'\') + \'';
  html = html.substring(0, insertAt) + runBtnHtml + html.substring(insertAt);
  
  // Find next occurrence
  count++;
  pos = html.indexOf(actionMarker1, pos + 50);
}

console.log('✅ Run buttons added in', count, 'sections');

// 3. Add change handler for run buttons
const afterRender = html.indexOf('// === 이벤트 바인딩 ===');
if (afterRender > 0) {
  const statusChangeHandler = html.indexOf('// 상태 변경', afterRender);
  if (statusChangeHandler > 0) {
    const runHandler = `
  // 실행 버튼
  timeline.querySelectorAll('.tc-run-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.task-card');
      if (!card) return;
      const id = card.dataset.taskId;
      const title = card.querySelector('.tc-title')?.textContent || '';
      card.dataset.status = '진행중';
      taskStore.setStatus(id, '진행중');
      requestTaskExecution(id, title);
      renderTasks();
      renderOverviewTasks();
    });
  });

`;
    html = html.substring(0, statusChangeHandler) + runHandler + html.substring(statusChangeHandler);
    console.log('✅ Run button handler added');
  }
}

fs.writeFileSync(path, html, 'utf8');
console.log('✅ File saved');

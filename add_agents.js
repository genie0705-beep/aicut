const fs = require('fs');
const path = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_marketing_dashboard.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Agent CSS
const agentCSS = `
  .agent-grid{display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:16px;}
  .agent-card{background:var(--surface); border:2px solid var(--border); border-radius:16px; padding:14px 10px; text-align:center; position:relative; transition:all .3s ease;}
  .agent-card.idle{border-color:var(--border); opacity:.6;}
  .agent-card.working{border-color:var(--purple-700); box-shadow:0 0 20px rgba(92,61,232,.2); animation:pulse-shadow 1.5s ease infinite; opacity:1;}
  .agent-card.done{border-color:var(--green-600); opacity:.9;}
  .agent-avatar{font-size:42px; display:block; margin-bottom:6px;}
  .agent-name{font-size:11px; font-weight:700; margin-bottom:2px;}
  .agent-status{font-size:10px; color:var(--text-muted);}
  .agent-card.working .agent-avatar{animation:bounce 1s ease infinite;}
  .agent-card .agent-glow{position:absolute; top:-4px; right:-4px; width:16px; height:16px; border-radius:50%; display:none;}
  .agent-card.working .agent-glow{display:block; background:var(--amber-500); animation:glow-pulse 1s ease infinite;}
  .agent-card.done .agent-glow{display:block; background:var(--green-600);}
  @keyframes pulse-shadow{0%,100%{box-shadow:0 0 10px rgba(92,61,232,.15);} 50%{box-shadow:0 0 25px rgba(92,61,232,.3);}}
  @keyframes bounce{0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);}}
  @keyframes glow-pulse{0%,100%{opacity:.6;transform:scale(1);} 50%{opacity:1;transform:scale(1.3);}}
  @media(max-width:700px){.agent-grid{grid-template-columns:repeat(3,1fr);}}
`;

// Insert after task-card CSS
html = html.replace(
  '.task-notime{color:var(--text-light); font-size:11px; padding:4px 0;}',
  '.task-notime{color:var(--text-light); font-size:11px; padding:4px 0;}' + agentCSS
);

// 2. Agent grid HTML (insert after task-stats-bar)
const agentHTML = `
        <!-- 멀티 에이전트 현황 -->
        <div style="margin-top:14px;">
          <div class="card-title" style="margin-bottom:8px;">🤖 팀 에이전트 현황</div>
          <div class="agent-grid" id="agent-grid">
            <div class="agent-card idle" data-agent="dev"><span class="agent-glow"></span><span class="agent-avatar">🛠️</span><div class="agent-name">개발팀</div><div class="agent-status">대기 중</div></div>
            <div class="agent-card idle" data-agent="plan"><span class="agent-glow"></span><span class="agent-avatar">📋</span><div class="agent-name">기획팀</div><div class="agent-status">대기 중</div></div>
            <div class="agent-card idle" data-agent="research"><span class="agent-glow"></span><span class="agent-avatar">🔍</span><div class="agent-name">리서치팀</div><div class="agent-status">대기 중</div></div>
            <div class="agent-card idle" data-agent="design"><span class="agent-glow"></span><span class="agent-avatar">🎨</span><div class="agent-name">디자인팀</div><div class="agent-status">대기 중</div></div>
            <div class="agent-card idle" data-agent="market"><span class="agent-glow"></span><span class="agent-avatar">📢</span><div class="agent-name">마케팅팀</div><div class="agent-status">대기 중</div></div>
          </div>
        </div>
`;

html = html.replace(
  'id="task-stats-bar"',
  'id="task-stats-bar"' + agentHTML
);

// 3. Agent status update function
const agentFn = `
function updateAgentStatus(team, status) {
  var cards = document.querySelectorAll('.agent-card');
  cards.forEach(function(card) {
    if (card.dataset.agent === team) {
      card.className = 'agent-card ' + status;
      var st = card.querySelector('.agent-status');
      if (status === 'working') st.textContent = '⚡ 작업 중...';
      else if (status === 'done') st.textContent = '✅ 완료';
      else st.textContent = '대기 중';
    }
  });
}
`;

html = html.replace('function checkTaskQueue', agentFn + '\n\nfunction checkTaskQueue');

// 4. Connect task status changes to agent animation
html = html.replace(
  "showToast('🛠️ 에이든에게 \"' + taskTitle + '\" 작업이 전달되었습니다!');",
  "updateAgentStatus('dev', 'working');\n      showToast('🛠️ 에이든에게 \"' + taskTitle + '\" 작업이 전달되었습니다!');"
);

html = html.replace(
  'function completeTask(taskId)',
  '// 에이든 작업 완료 시 에이전트 상태 업데이트\nfunction completeTask(taskId)'
);

fs.writeFileSync(path, html, 'utf8');
console.log('Agent characters applied');

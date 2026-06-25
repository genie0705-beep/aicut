const fs = require('fs');
const path = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_marketing_dashboard.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Agent Chat CSS
const chatCSS = `
  .chat-fab{position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:50%;
    background:var(--purple-700); color:#fff; border:none; font-size:24px;
    box-shadow:0 4px 16px rgba(92,61,232,.35); cursor:pointer; z-index:90;
    transition:transform .2s;}
  .chat-fab:hover{transform:scale(1.1);}
  .chat-panel{position:fixed; bottom:90px; right:24px; width:380px; max-width:90vw;
    height:520px; max-height:70vh; background:var(--surface); border-radius:16px;
    box-shadow:0 8px 40px rgba(0,0,0,.15); z-index:89; display:none; flex-direction:column;
    border:1px solid var(--border); overflow:hidden;}
  .chat-panel.open{display:flex;}
  .chat-header{padding:14px 16px; background:var(--navy-900); color:#fff;
    display:flex; align-items:center; gap:10px; flex-shrink:0;}
  .chat-header .ch-avatar{font-size:22px;}
  .chat-header .ch-title{font-size:14px; font-weight:700; flex:1;}
  .chat-header .ch-close{background:none; border:none; color:rgba(255,255,255,.5); font-size:20px; cursor:pointer;}
  .ch-agent-select{display:flex; gap:4px; padding:8px 12px; border-bottom:1px solid var(--border);
    overflow-x:auto; flex-shrink:0;}
  .ch-agent-btn{padding:5px 10px; border-radius:999px; border:1px solid var(--border);
    background:transparent; font-size:11px; font-weight:600; cursor:pointer; white-space:nowrap;
    transition:all .12s;}
  .ch-agent-btn.active{background:var(--purple-700); color:#fff; border-color:var(--purple-700);}
  .chat-messages{flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:8px;}
  .chat-msg{max-width:80%; padding:8px 12px; border-radius:12px; font-size:13px; line-height:1.5;}
  .chat-msg.them{background:var(--bg); align-self:flex-start; border-bottom-left-radius:4px;}
  .chat-msg.me{background:var(--purple-100); align-self:flex-end; border-bottom-right-radius:4px;}
  .chat-msg .cm-author{font-size:10px; font-weight:600; color:var(--text-muted); margin-bottom:2px;}
  .chat-msg .cm-time{font-size:9px; color:var(--text-light); text-align:right; margin-top:2px;}
  .chat-input-area{display:flex; gap:6px; padding:8px 12px; border-top:1px solid var(--border); flex-shrink:0;}
  .chat-input{flex:1; padding:8px 12px; border:1px solid var(--border); border-radius:20px; font-size:13px; outline:none;}
  .chat-input:focus{border-color:var(--purple-700);}
  .chat-send-btn{width:36px; height:36px; border-radius:50%; background:var(--purple-700); color:#fff;
    border:none; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;}
  .chat-typing{font-size:11px; color:var(--text-muted); padding:2px 14px 6px; font-style:italic;}
`;

// Insert agent chat CSS after agent-grid CSS
html = html.replace('@media(max-width:700px){.agent-grid{grid-template-columns:repeat(3,1fr);}}',
  '@media(max-width:700px){.agent-grid{grid-template-columns:repeat(3,1fr);}}' + chatCSS);

// 2. Chat HTML before closing body
const chatHTML = `
<div class="chat-panel" id="chat-panel">
  <div class="chat-header">
    <span class="ch-avatar" id="ch-avatar">💬</span>
    <span class="ch-title" id="ch-title">팀 에이전트 채팅</span>
    <button class="ch-close" id="ch-close-btn">&times;</button>
  </div>
  <div class="ch-agent-select" id="ch-agent-select">
    <button class="ch-agent-btn active" data-chat-agent="dev">🛠️ 개발팀</button>
    <button class="ch-agent-btn" data-chat-agent="plan">📋 기획팀</button>
    <button class="ch-agent-btn" data-chat-agent="research">🔍 리서치팀</button>
    <button class="ch-agent-btn" data-chat-agent="design">🎨 디자인팀</button>
    <button class="ch-agent-btn" data-chat-agent="market">📢 마케팅팀</button>
  </div>
  <div class="chat-messages" id="chat-messages"></div>
  <div class="chat-typing" id="chat-typing" style="display:none;">✏️ 에이전트가 답변을 입력 중...</div>
  <div class="chat-input-area">
    <input class="chat-input" id="chat-input" placeholder="메시지를 입력하세요..." maxlength="500">
    <button class="chat-send-btn" id="chat-send-btn"><i class="ti ti-send"></i></button>
  </div>
</div>
<button class="chat-fab" id="chat-fab">💬</button>
`;

html = html.replace('</body>', chatHTML + '\n</body>');

// 3. Chat JavaScript
const chatJS = `
// ===== 팀 에이전트 채팅 시스템 =====
var CHAT_STORE_KEY = 'aicut_chat_messages';

function getChatMessages() {
  try { return JSON.parse(localStorage.getItem(CHAT_STORE_KEY)) || {}; } catch(e) { return {}; }
}
function saveChatMessages(msgs) { localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(msgs)); }

var _chatAgent = 'dev';
var _chatOpen = false;

function openChat() {
  document.getElementById('chat-panel').classList.add('open');
  _chatOpen = true;
  renderChat();
  setTimeout(function() {
    var area = document.getElementById('chat-messages');
    if (area) area.scrollTop = area.scrollHeight;
  }, 100);
}

function closeChat() {
  document.getElementById('chat-panel').classList.remove('open');
  _chatOpen = false;
}

function switchChatAgent(agent) {
  _chatAgent = agent;
  document.querySelectorAll('.ch-agent-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.chatAgent === agent);
  });
  var icons = { dev:'🛠️', plan:'📋', research:'🔍', design:'🎨', market:'📢' };
  var names = { dev:'개발팀', plan:'기획팀', research:'리서치팀', design:'디자인팀', market:'마케팅팀' };
  document.getElementById('ch-avatar').textContent = icons[agent] || '💬';
  document.getElementById('ch-title').textContent = names[agent] || '채팅';
  renderChat();
}

function renderChat() {
  var area = document.getElementById('chat-messages');
  if (!area) return;
  var all = getChatMessages();
  var msgs = all[_chatAgent] || [];
  if (msgs.length === 0) {
    // 첫 메시지 환영
    var names = { dev:'🛠️ 개발팀', plan:'📋 기획팀', research:'🔍 리서치팀', design:'🎨 디자인팀', market:'📢 마케팅팀' };
    area.innerHTML = '<div class="chat-msg them"><div class="cm-author">' + names[_chatAgent] + '</div>안녕하세요! 무엇을 도와드릴까요? 😊<div class="cm-time">방금 전</div></div>';
    return;
  }
  area.innerHTML = msgs.map(function(m) {
    var cls = m.type === 'user' ? 'me' : 'them';
    var author = m.type === 'user' ? '나' : (m.author || '에이전트');
    return '<div class="chat-msg ' + cls + '"><div class="cm-author">' + author + '</div>' + m.text + '<div class="cm-time">' + (m.time || '') + '</div></div>';
  }).join('');
}

function sendChatMessage() {
  var input = document.getElementById('chat-input');
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  
  var now = new Date();
  var timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  
  var all = getChatMessages();
  if (!all[_chatAgent]) all[_chatAgent] = [];
  all[_chatAgent].push({ type:'user', text:text, time:timeStr });
  saveChatMessages(all);
  renderChat();
  
  // 스크롤 아래로
  var area = document.getElementById('chat-messages');
  if (area) area.scrollTop = area.scrollHeight;
  
  // 타이핑 표시
  var typing = document.getElementById('chat-typing');
  if (typing) typing.style.display = 'block';
  
  // 에이든 응답 (localStorage에 요청 저장 → 제가 읽고 응답)
  var agentReplies = JSON.parse(localStorage.getItem('aicut_chat_pending') || '[]');
  agentReplies.push({ agent:_chatAgent, text:text, time:timeStr, replied:false });
  localStorage.setItem('aicut_chat_pending', JSON.stringify(agentReplies));
  
  // 3초 후 자동 응답 (미리보기)
  setTimeout(function() {
    var all2 = getChatMessages();
    if (!all2[_chatAgent]) all2[_chatAgent] = [];
    var names = { dev:'🛠️ 개발팀', plan:'📋 기획팀', research:'🔍 리서치팀', design:'🎨 디자인팀', market:'📢 마케팅팀' };
    all2[_chatAgent].push({ type:'agent', text:'메시지를 확인했습니다! 에이든이 곧 답변을 드릴게요 😊', time:new Date().getHours().toString().padStart(2,'0') + ':' + new Date().getMinutes().toString().padStart(2,'0'), author:names[_chatAgent] });
    saveChatMessages(all2);
    if (typing) typing.style.display = 'none';
    renderChat();
    if (area) area.scrollTop = area.scrollHeight;
  }, 1500);
}

// Event handlers
document.addEventListener('DOMContentLoaded', function() {
  var fab = document.getElementById('chat-fab');
  if (fab) fab.addEventListener('click', function() { _chatOpen ? closeChat() : openChat(); });
  
  var closeBtn = document.getElementById('ch-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeChat);
  
  document.querySelectorAll('.ch-agent-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { switchChatAgent(this.dataset.chatAgent); });
  });
  
  var sendBtn = document.getElementById('chat-send-btn');
  var chatInput = document.getElementById('chat-input');
  if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
  if (chatInput) chatInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') sendChatMessage(); });
});
`;

// Insert chat JS before the last </script>
html = html.replace('</script>', chatJS + '\n</script>');

fs.writeFileSync(path, html, 'utf8');
console.log('Chat UI added');

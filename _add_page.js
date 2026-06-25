const fs = require('fs');
var c = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', 'utf8');

// Find the contract modal content
var modalStart = c.indexOf('<!-- ================= 신규 계약 작성 모달 ================= -->');
var modalEnd = c.indexOf('<!-- ================= 업무 추가 모달 ================= -->');
if (modalStart === -1 || modalEnd === -1) { console.log('Modal boundaries not found'); process.exit(1); }

var modalHTML = c.substring(modalStart, modalEnd);
console.log('Modal length:', modalHTML.length);

// Convert modal to page section
var pageHTML = modalHTML
  .replace('<!-- ================= 신규 계약 작성 모달 ================= -->', '')
  .replace('<div class="modal-overlay" id="contract-modal">', '<section class="page" data-page="newcontract"><div style="max-width:680px; margin:0 auto; padding:0 16px;">')
  .replace('<div class="modal">', '')
  .replace('data-close-modal="contract-modal"', 'onclick="goPage(\'contracts\')"')
  .replace('</div>\n</div>', '')  // Remove closing modal tags - might be fragile
  .replace('id="submit-contract">계약서 생성</button>', 'id="submit-contract">계약서 생성</button>');

// Close the section properly
var closeIdx = pageHTML.lastIndexOf('</div>');
pageHTML = pageHTML.substring(0, closeIdx) + '\n    </div>\n  </section>\n\n  ' + pageHTML.substring(closeIdx);

// Insert before the extracost section
var insertPoint = c.indexOf('➕ 추가안장료 / 진행비');
if (insertPoint === -1) { console.log('Insert point not found'); process.exit(1); }
var insertLine = c.lastIndexOf('\n', insertPoint);
c = c.substring(0, insertLine) + '\n\n' + pageHTML + c.substring(insertLine);

// Change button handler
c = c.replace(
  "document.getElementById('open-contract-modal').addEventListener('click', function(){ openModal('contract-modal'); });",
  "document.getElementById('open-contract-modal').addEventListener('click', function(){ goPage('newcontract'); });"
);

// Add goPage handler
c = c.replace(
  "if(page === 'notifications'){ renderTemplates(); renderExamples(); }",
  "if(page === 'newcontract'){ /* init contract form */ }\n  if(page === 'notifications'){ renderTemplates(); renderExamples(); }"
);

fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', c, 'utf8');
console.log('New contract page created');

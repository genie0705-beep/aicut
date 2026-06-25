const fs = require('fs');
var c = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', 'utf8');

// 1. Remove newcontract page section
var start = c.indexOf('<section class="page" data-page="newcontract">');
var end = c.indexOf('➕ 추가안장료 / 진행비');
if (start > -1 && end > -1) {
  var beforeLine = c.lastIndexOf('\n', start - 2);
  c = c.substring(0, beforeLine) + '\n' + c.substring(end - 60);
  console.log('Removed newcontract section');
}

// 2. Restore button handler to open modal
c = c.replace(
  "document.getElementById('open-contract-modal').addEventListener('click', function(){ goPage('newcontract'); });",
  "document.getElementById('open-contract-modal').addEventListener('click', function(){ openModal('contract-modal'); });"
);

// 3. Remove the goPage('contracts') after closeModal in submit handler
c = c.replace(
  "closeModal('contract-modal');\n  if(document.querySelector('.page[data-page=newcontract].active')){ goPage('contracts'); }",
  "closeModal('contract-modal');"
);

// 4. Remove newcontract from goPage override
c = c.replace(
  "if(page === 'newcontract'){ /* init contract form */ }\n  if(page === 'notifications'){ renderTemplates(); renderExamples(); }",
  "if(page === 'notifications'){ renderTemplates(); renderExamples(); }"
);

fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', c, 'utf8');
console.log('Restored');

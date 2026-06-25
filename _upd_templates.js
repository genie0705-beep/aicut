const fs = require('fs');
var c = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', 'utf8');

// Find the return array
var marker1 = "{ id:'contract-share', name:'\\uCCAB \\uACC4\\uC57D\\uC11C \\uC548\\uB0B4',";
var marker2 = "{ id:'fee-overdue', name:'\\uAD00\\uB9AC\\uBE44 \\uC5F0\\uCCB4 \\uC548\\uB0B4',";
var marker3 = "  ];\\n}\\nfunction saveTemplates";

var idx1 = c.indexOf(marker1);
var idx2 = c.indexOf(marker2);
var idx3 = c.indexOf(marker3);

if (idx1 > -1 && idx3 > -1) {
  // Replace from the contract-share line through fee-overdue line to end of array
  var start = c.lastIndexOf('\\n', idx1 - 2);
  var end = idx3 + marker3.length - 3;
  
  var newArr = `  { id:'fee-notice', name:'관리비 납부 안내', category:'납부', channel:'kakao', msg:'{계약자}님, {고인}님의 관리비 납부 안내입니다.\\n\\n계약서상의 납부자명과 동일하게 입금자명을 기재해주셔야 자동 매칭이 가능합니다.\\n입금 시 반드시 {계약자}(으)로 입금해주세요.', active:true },
    { id:'fee-overdue', name:'관리비 연체 안내', category:'납부', channel:'kakao', msg:'{계약자}님, {고인}님의 관리비가 연체되었습니다.\\n\\n연체 기간: {연체일}일\\n연체 금액: {연체금액}원\\n\\n빠른 납부 부탁드립니다.\\n입금자명: {계약자}', active:true },
    { id:'memorial-3', name:'삼우제 안내', category:'추모', channel:'kakao', msg:'{계약자}님, {고인}님의 삼우제가 다가오고 있습니다.\\n\\n일시: {추모일시}\\n장소: 청솔원 메모리얼파크\\n\\n편히 방문해주시기 바랍니다.', active:true },
    { id:'memorial-49', name:'49제 안내', category:'추모', channel:'kakao', msg:'{계약자}님, {고인}님의 49제가 다가오고 있습니다.\\n\\n일시: {추모일시}\\n장소: 청솔원 메모리얼파크', active:true },
    { id:'memorial-1year', name:'1주기 기일 안내', category:'추모', channel:'kakao', msg:'{계약자}님, {고인}님의 1주기 기일입니다.\\n\\n삼가 조의를 표하며, 추모를 원하시면 방문해주시기 바랍니다.', active:true },
    { id:'contract-share', name:'첫 계약서 안내', category:'계약', channel:'kakao', msg:'{계약자}님, {고인}님의 안치 계약이 완료되었습니다.\\n\\n계약번호: {계약번호}\\n안치 위치: {위치}\\n\\n자세한 사항은 홈페이지를 참고해주세요.', active:true },
    { id:'contract-renew', name:'계약 갱신 안내', category:'계약', channel:'kakao', msg:'{계약자}님, {고인}님의 안치 계약 갱신일이 다가오고 있습니다.\\n\\n계약번호: {계약번호}\\n만료일: {만료일}\\n\\n갱신을 원하시면 연락 부탁드립니다.', active:false },
    { id:'sms-fee', name:'[SMS] 관리비 납부 안내', category:'납부', channel:'sms', msg:'{계약자}님 관리비 납부 안내\\n계약자명과 동일하게 입금해주세요.\\n문의: 000-0000-0000', active:true },
    { id:'sms-overdue', name:'[SMS] 관리비 연체 안내', category:'납부', channel:'sms', msg:'{계약자}님 관리비가 연체되었습니다.\\n{연체일}일 경과 / {연체금액}원\\n빠른 납부 바랍니다. 000-0000-0000', active:true },
    { id:'sms-memorial', name:'[SMS] 추모일 안내', category:'추모', channel:'sms', msg:'{계약자}님 {고인}님 추모일 안내\\n{추모일시} / 청솔원 메모리얼파크\\n문의: 000-0000-0000', active:true },
    { id:'sms-contract', name:'[SMS] 계약 안내', category:'계약', channel:'sms', msg:'{계약자}님 계약 완료 안내\\n{고인}님 / {위치}\\n자세한 사항은 연락주세요. 000-0000-0000', active:true }
  ];
}
function saveTemplates`;

  c = c.substring(0, start) + '\n    ' + newArr + c.substring(end);
  fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\memorial_admin.html', c, 'utf8');
  console.log('Templates updated OK');
} else {
  console.log('Pattern not found');
  console.log('idx1:', idx1, 'idx2:', idx2, 'idx3:', idx3);
}

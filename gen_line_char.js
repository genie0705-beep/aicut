const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(function() {
  var svg = '<svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">';
  svg += '<circle cx="100" cy="50" r="28" stroke="#5c3de8" stroke-width="2.5" fill="none"/>';
  svg += '<path d="M75 38 Q100 20 125 38" stroke="#5c3de8" stroke-width="2" fill="none"/>';
  svg += '<circle cx="90" cy="46" r="2.5" fill="#5c3de8"/>';
  svg += '<circle cx="110" cy="46" r="2.5" fill="#5c3de8"/>';
  svg += '<path d="M93 56 Q100 62 107 56" stroke="#5c3de8" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  svg += '<line x1="100" y1="78" x2="100" y2="88" stroke="#5c3de8" stroke-width="2"/>';
  svg += '<rect x="80" y="88" width="40" height="55" rx="6" stroke="#5c3de8" stroke-width="2" fill="none"/>';
  svg += '<path d="M80 100 L55 125" stroke="#5c3de8" stroke-width="2" stroke-linecap="round"/>';
  svg += '<path d="M120 100 L145 125" stroke="#5c3de8" stroke-width="2" stroke-linecap="round"/>';
  svg += '<path d="M90 143 L80 175 L75 178" stroke="#5c3de8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  svg += '<path d="M110 143 L120 175 L125 178" stroke="#5c3de8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  svg += '</svg>';

  var HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>';
  HTML += '*{margin:0;padding:0}';
  HTML += 'body{width:400px;height:500px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#ffffff}';
  HTML += '</style></head><body>' + svg + '</body></html>';

  return HTML;
})();

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var page = await b.contexts()[0].newPage();
  await page.setViewportSize({ width: 400, height: 500 });
  
  var html = function() {
    var svg = '<svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">';
    svg += '<circle cx="100" cy="50" r="28" stroke="#5c3de8" stroke-width="2.5" fill="none"/>';
    svg += '<path d="M75 38 Q100 20 125 38" stroke="#5c3de8" stroke-width="2" fill="none"/>';
    svg += '<circle cx="90" cy="46" r="2.5" fill="#5c3de8"/>';
    svg += '<circle cx="110" cy="46" r="2.5" fill="#5c3de8"/>';
    svg += '<path d="M93 56 Q100 62 107 56" stroke="#5c3de8" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
    svg += '<line x1="100" y1="78" x2="100" y2="88" stroke="#5c3de8" stroke-width="2"/>';
    svg += '<rect x="80" y="88" width="40" height="55" rx="6" stroke="#5c3de8" stroke-width="2" fill="none"/>';
    svg += '<path d="M80 100 L55 125" stroke="#5c3de8" stroke-width="2" stroke-linecap="round"/>';
    svg += '<path d="M120 100 L145 125" stroke="#5c3de8" stroke-width="2" stroke-linecap="round"/>';
    svg += '<path d="M90 143 L80 175 L75 178" stroke="#5c3de8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    svg += '<path d="M110 143 L120 175 L125 178" stroke="#5c3de8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    svg += '</svg>';
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0}body{width:400px;height:500px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#ffffff}</style></head><body>' + svg + '</body></html>';
  }();
  
  var tmp = DIR + '/_line_char.html';
  fs.writeFileSync(tmp, html);
  await page.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  
  var out = DIR + '/aicut_line_char.png';
  await page.screenshot({ path: out, fullPage: false });
  var sz = fs.statSync(out).size;
  console.log('라인 캐릭터 완료! (' + Math.round(sz/1024) + 'KB)');
  
  await page.close();
  await b.close();
  try { fs.unlinkSync(tmp); } catch(e) {}
})();

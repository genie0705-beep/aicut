const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function writeHtml(name, html) { fs.writeFileSync(DIR + '/_' + name + '.html', html); }

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');

  // 1. 인포그래픽 - 숫자 비교
  var h1 = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:700px;height:400px;overflow:hidden;font-family:"Noto Sans KR",sans-serif;background:#0d1630}.wrap{width:700px;height:400px;padding:40px 50px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}.badge{display:inline-block;background:rgba(167,139,250,0.15);color:#a78bfa;font-size:13px;font-weight:700;padding:6px 18px;border:1px solid rgba(167,139,250,0.3);border-radius:20px;margin-bottom:20px}.nums{display:flex;gap:30px;margin-bottom:16px;align-items:center}.nbox{text-align:center}.num{font-size:48px;font-weight:900;letter-spacing:-2px}.nred{color:#ff6b6b}.ngreen{color:#34d399}.lbl{font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px}.vs{font-size:20px;color:rgba(255,255,255,0.2);font-weight:900}.arrow{color:#ffd700;font-size:22px;margin:8px 0;font-weight:700}.sub{font-size:14px;color:rgba(255,255,255,0.7);font-weight:500}</style></head><body><div class="wrap"><div class="badge">릴스 알고리즘 분석</div><div class="nums"><div class="nbox"><div class="num nred">200</div><div class="lbl">3일 편집</div></div><div class="vs">VS</div><div class="nbox"><div class="num ngreen">23,000</div><div class="lbl">3시간 편집</div></div></div><div class="arrow">115배 차이</div><div class="sub">핵심은 편집이 아닌 처음 3초의 메시지</div></div></body></html>';
  
  // 2. 타임라인
  var h2 = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:700px;height:400px;overflow:hidden;font-family:"Noto Sans KR",sans-serif;background:#f8fafc}.wrap{width:700px;height:400px;padding:35px 40px}.ttl{font-size:20px;font-weight:800;color:#0f172a;margin-bottom:20px;text-align:center}.tl{position:relative;display:flex;justify-content:space-between;padding:0 20px}.tl:before{content:"";position:absolute;top:28px;left:60px;right:60px;height:4px;background:linear-gradient(90deg,#ef4444,#f59e0b,#34d399);border-radius:2px}.it{position:relative;z-index:2;text-align:center;width:30%}.dot{width:20px;height:20px;border-radius:50%;margin:0 auto 8px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.15)}.d1{background:#ef4444}.d2{background:#f59e0b}.d3{background:#34d399}.ph{font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:4px}.de{font-size:13px;color:#0f172a;font-weight:700;line-height:1.4}.res{text-align:center;margin-top:24px;padding:14px}.res span{background:linear-gradient(135deg,#5c3de8,#7c5cf6);color:#fff;padding:8px 28px;border-radius:20px;font-size:13px;font-weight:700}</style></head><body><div class="wrap"><div class="ttl">릴스 3시간 완성 과정</div><div class="tl"><div class="it"><div class="dot d1"></div><div class="ph">STEP 1</div><div class="de">기획 아이디어</div></div><div class="it"><div class="dot d2"></div><div class="ph">STEP 2</div><div class="de">촬영</div></div><div class="it"><div class="dot d3"></div><div class="ph">STEP 3</div><div class="de">편집</div></div></div><div class="res"><span>결과: 조회수 23,000</span></div></div></body></html>';

  // 3. SNS 목업
  var h3 = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:700px;height:400px;overflow:hidden;font-family:"Noto Sans KR",sans-serif;background:#f0f2f5;display:flex;align-items:center;justify-content:center}.card{width:380px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden}.hd{display:flex;align-items:center;padding:12px 14px}.av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#5c3de8,#a78bfa);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:800;margin-right:10px}.nm{font-size:13px;font-weight:700;color:#0f172a}.sn{font-size:11px;color:#94a3b8}.mr{margin-left:auto;color:#94a3b8}.img{width:100%;height:170px;background:linear-gradient(135deg,#1a1a2e,#0f3460);display:flex;align-items:center;justify-content:center;flex-direction:column}.img .b{color:#ffd700;font-size:28px;font-weight:900}.img .s{color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px}.ct{padding:12px 14px}.ic{display:flex;gap:14px;margin-bottom:8px;font-size:18px}.ir{margin-left:auto}.lk{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px}.cp{font-size:12px;color:#334155;line-height:1.5}.cp b{color:#0f172a}.tg{color:#5c3de8}</style></head><body><div class="card"><div class="hd"><div class="av">A</div><div><div class="nm">aicut.official</div><div class="sn">추천</div></div><div class="mr">...</div></div><div class="img"><div class="b">200 23,000</div><div class="s">조회수 차이 115배</div></div><div class="ct"><div class="ic"><span>❤</span><span>💬</span><span>📤</span><span class="ir">🔖</span></div><div class="lk">좋아요 580개</div><div class="cp"><b>aicut.official</b> 3일 편집=200, 3시간 편집=23,000<br><span class="tg">#릴스마케팅</span></div></div></div></body></html>';

  // 4. 매거진 표지
  var h4 = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:700px;height:400px;overflow:hidden;font-family:"Noto Sans KR",sans-serif}.wrap{width:700px;height:400px;background:linear-gradient(160deg,#0d1630,#1a1f4e,#2d1b69);padding:40px 50px;display:flex;flex-direction:column;justify-content:center;position:relative}.tg{font-size:11px;color:#a78bfa;font-weight:700;letter-spacing:4px;margin-bottom:8px}.hl{width:40px;height:3px;background:#a78bfa;margin-bottom:20px}.mt{font-size:36px;font-weight:900;color:#fff;line-height:1.2;letter-spacing:-1px;margin-bottom:10px}.mt em{color:#ffd700;font-style:normal}.st{font-size:15px;color:rgba(255,255,255,0.6);font-weight:500;line-height:1.5;margin-bottom:24px}.btn{background:linear-gradient(135deg,#5c3de8,#7c5cf6);color:#fff;font-size:13px;font-weight:700;padding:10px 30px;border-radius:25px;display:inline-block;align-self:flex-start}.ft{position:absolute;bottom:16px;right:30px;color:rgba(255,255,255,0.2);font-size:11px}</style></head><body><div class="wrap"><div class="tg">AICUT INSIGHT</div><div class="hl"></div><div class="mt">릴스 조회수<br><em>3일 vs 3시간</em><br>반전</div><div class="st">화려한 편집보다 중요한 건<br>처음 3초의 메시지</div><div class="btn">자세히 보기</div><div class="ft">영상빡침일기 #3</div></div></body></html>';

  // 5. 대시보드 위젯
  var h5 = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:700px;height:400px;overflow:hidden;font-family:"Noto Sans KR",sans-serif;background:#f0f2f5;display:flex;align-items:center;justify-content:center}.w{width:380px;background:#fff;border-radius:20px;padding:24px;box-shadow:0 4px 24px rgba(0,0,0,0.06)}.wt{font-size:13px;color:#94a3b8;font-weight:700;margin-bottom:16px}.rw{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9}.rw:last-child{border-bottom:none}.lb{font-size:14px;color:#334155;font-weight:500}.vl{font-size:16px;font-weight:800}.up{color:#34d399}.dn{color:#ef4444}.badge{font-size:11px;padding:3px 12px;border-radius:10px;font-weight:600}.bad{background:#fef2f2;color:#ef4444}.gd{background:#f0fdf4;color:#34d399}.ft2{margin-top:16px;padding-top:12px;border-top:2px solid #f1f5f9;text-align:center;font-size:12px;color:#5c3de8;font-weight:700}</style></head><body><div class="w"><div class="wt">릴스 성과 분석</div><div class="rw"><span class="lb">3일 편집 (화려)</span><span class="vl dn">조회수 200</span></div><div class="rw"><span class="lb">3시간 편집 (심플)</span><span class="vl up">조회수 23,000</span></div><div class="rw"><span class="lb">접근법</span><span class="badge bad">편집 중심</span><span class="badge gd">메시지 중심</span></div><div class="ft2">처음 3초가 모든 걸 결정한다</div></div></body></html>';

  var styles = [
    { name: 'infographic', html: h1 },
    { name: 'timeline', html: h2 },
    { name: 'sns_mockup', html: h3 },
    { name: 'magazine', html: h4 },
    { name: 'dashboard', html: h5 }
  ];

  for (var i = 0; i < styles.length; i++) {
    var s = styles[i];
    console.log((i+1) + '/5 ' + s.name);
    
    var tmp = DIR + '/_stemp.html';
    fs.writeFileSync(tmp, s.html);
    
    var page = await b.contexts()[0].newPage();
    await page.setViewportSize({ width: 700, height: 400 });
    await page.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
    await page.evaluate(function() { return document.fonts.ready; });
    await sleep(2000);
    
    var out = DIR + '/aicut_style_' + s.name + '.png';
    await page.screenshot({ path: out, fullPage: false });
    var sz = fs.statSync(out).size;
    console.log('   ' + Math.round(sz/1024) + 'KB');
    
    await page.close();
    try { fs.unlinkSync(tmp); } catch(e) {}
  }

  await b.close();
  console.log('\n5종 완료!');
})();

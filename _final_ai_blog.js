const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

// === 1. 이미지 5장 생성 ===
async function genImage(browser, w, h, name, html) {
  const fp = path.join(WORKSPACE, '_tmp_gen.html');
  fs.writeFileSync(fp, html, 'utf-8');
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file:///' + fp.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(WORKSPACE, name), fullPage: false });
  fs.unlinkSync(fp);
  await page.close();
  console.log(`  ✅ ${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  console.log('=== 1. 이미지 생성 ===');
  
  // thumb 700x700 (카드스타일, 폰트 축소 56px)
  await genImage(browser, 700, 700, 'aicut_blog_ai_thumb.png',
    '<!DOCTYPE html><html><meta charset="UTF-8"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:700px;height:700px;overflow:hidden;font-family:"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif}'
    + '.card{width:700px;height:700px;background:linear-gradient(145deg,#0D1630 0%,#1a1f4e 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;position:relative;overflow:hidden}'
    + '.g{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.4) 0%,transparent 65%);width:500px;height:500px;top:50%;left:50%;transform:translate(-50%,-50%)}'
    + '.tag{color:#c4b5fd;font-size:22px;font-weight:700;letter-spacing:2px;margin-bottom:24px;z-index:2;position:relative}'
    + '.main{color:#fff;font-size:56px;font-weight:900;line-height:1.15;letter-spacing:-1px;z-index:2;position:relative;word-break:keep-all;text-align:center;margin-bottom:20px}'
    + '.main em{color:#a78bfa;font-style:normal;display:block}'
    + '.sub{color:rgba(255,255,255,0.7);font-size:22px;font-weight:500;line-height:1.5;z-index:2;position:relative;word-break:keep-all;margin-bottom:30px}'
    + '.cta{background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;font-size:24px;font-weight:800;padding:14px 40px;border-radius:50px;z-index:2;position:relative;letter-spacing:1px}'
    + '.brand{position:absolute;right:36px;bottom:30px;color:rgba(255,255,255,0.3);font-size:18px;font-weight:900;letter-spacing:3px;z-index:2}'
    + '</style></head><body>'
    + '<div class="card"><div class="g"></div>'
    + '<div class="tag">AI \uc2dc\ub300\uc758 \uc601\uc0c1 \ud3b8\uc9d1</div>'
    + '<div class="main">"AI \uc601\uc0c1 \ud3b8\uc9d1\uc774 \ub300\uc138?"<em>\uadf8\ub798\ub3c4 \uc804\ubb38 \uc5d0\ub514\ud130\uac00<br>\ud544\uc694\ud55c \uc774\uc720</em></div>'
    + '<div class="sub">AI \ud234\uacfc \uc804\ub2f4 \uc5d0\ub514\ud130\uc758 \ucd5c\uc801 \uc870\ud569</div>'
    + '<div class="cta">\ubb34\ub8cc \uc0c1\ub2f4 \u2192</div>'
    + '<div class="brand">AICUT</div></div></body></html>'
  );
  
  // 01 800x450
  await genImage(browser, 800, 450, 'aicut_blog_ai_01.png',
    '<!DOCTYPE html><html><meta charset="UTF-8"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:800px;height:450px;overflow:hidden;font-family:"Noto Sans KR","Malgun Gothic",sans-serif;background:linear-gradient(135deg,#FDFAF2 0%,#f5f0e8 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:50px;text-align:center}'
    + '.icon{font-size:42px;margin-bottom:10px}'
    + 'h2{font-size:28px;font-weight:800;color:#1a1a2e;margin-bottom:16px;word-break:keep-all}'
    + '.items{display:flex;gap:14px}'
    + '.item{background:#fff;border-radius:14px;padding:16px 12px;width:210px;box-shadow:0 3px 10px rgba(0,0,0,0.05)}'
    + '.num{background:#ee4444;color:#fff;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;margin-bottom:6px}'
    + '.title{font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:4px}'
    + '.desc{font-size:11px;color:#666;line-height:1.4}'
    + '</style></head><body>'
    + '<div class="icon">\u26a0\ufe0f</div><h2>AI\uac00 \uc808\ub300 \ubabb \ud558\ub294 3\uac00\uc9c0</h2>'
    + '<div class="items">'
    + '<div class="item"><div class="num">1</div><div class="title">\ube0c\ub79c\ub4dc \uac10\uac01</div><div class="desc">AI\ub294 \ube0c\ub79c\ub4dc\uc758 \ub290\ub08c\uc744 \ud559\uc2b5 \ubd88\uac00</div></div>'
    + '<div class="item"><div class="num">2</div><div class="title">\ub9e5\ub77d \uc774\ud574</div><div class="desc">\ub2e8\uc21c \ud3b8\uc9d1 vs \uba54\uc2dc\uc9c0 \uc804\ub2ec</div></div>'
    + '<div class="item"><div class="num">3</div><div class="title">\uae34\uae09 \ub300\uc751</div><div class="desc">\uae34\ubc15\ud55c \uc218\uc815\uc5d0 AI\ub294 \ub300\uc751 \ubd88\uac00</div></div>'
    + '</div></body></html>'
  );
  
  // 02 800x450  
  await genImage(browser, 800, 450, 'aicut_blog_ai_02.png',
    '<!DOCTYPE html><html><meta charset="UTF-8"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:800px;height:450px;overflow:hidden;font-family:"Noto Sans KR","Malgun Gothic",sans-serif;background:linear-gradient(135deg,#0D1630 0%,#1a1f4e 50%,#0D1630 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:50px;text-align:center}'
    + '.icon{font-size:42px;margin-bottom:10px}'
    + 'h2{color:#fff;font-size:28px;font-weight:800;margin-bottom:6px;word-break:keep-all}'
    + '.sub{color:#c0c0d0;font-size:14px;margin-bottom:20px}'
    + '.row{display:flex;gap:16px;align-items:center}'
    + '.card{border-radius:14px;padding:20px 16px;width:210px}'
    + '.card.ai{background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3)}'
    + '.card.human{background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3)}'
    + '.card .ct{font-size:15px;font-weight:700;margin-bottom:8px}'
    + '.card.ai .ct{color:#06b6d4}.card.human .ct{color:#a78bfa}'
    + '.card .cd{font-size:11px;color:#d0d0e0;line-height:1.5}'
    + '.plus{color:#fff;font-size:30px;font-weight:900}'
    + '</style></head><body>'
    + '<div class="icon">\ud83d\udca1</div><h2>AI + \uc778\uac04 \uc5d0\ub514\ud130\uc758 \ucd5c\uc801 \uc870\ud569</h2>'
    + '<div class="sub">\uc5d0\uc774\ucef7\uc740 AI\ub85c \uc18d\ub3c4\ub97c, \uc5d0\ub514\ud130\ub85c \ud018\ub9ac\ud2f0\ub97c</div>'
    + '<div class="row"><div class="card ai"><div class="ct">AI \ud234</div><div class="cd">1\ucc28 \ud3b8\uc9d1 \uc790\ub3d9\ud654<br>\ud3b8\uc9d1 \uc2dc\uac04 40% \ub2e8\ucd95</div></div>'
    + '<div class="plus">+</div>'
    + '<div class="card human"><div class="ct">\uc804\ub2f4 \uc5d0\ub514\ud130</div><div class="cd">\ube0c\ub79c\ub4dc \uac10\uac01 \uc720\uc9c0<br>\uc77c\uad00\ub41c \ud018\ub9ac\ud2f0 \ubcf4\uc7a5</div></div></div>'
    + '</body></html>'
  );
  
  // 03 800x450
  await genImage(browser, 800, 450, 'aicut_blog_ai_03.png',
    '<!DOCTYPE html><html><meta charset="UTF-8"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:800px;height:450px;overflow:hidden;font-family:"Noto Sans KR","Malgun Gothic",sans-serif;background:linear-gradient(135deg,#FDFAF2 0%,#f5f0e8 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:50px;text-align:center}'
    + '.icon{font-size:42px;margin-bottom:10px}'
    + 'h2{font-size:26px;font-weight:800;color:#1a1a2e;margin-bottom:14px}'
    + 'table{width:100%;max-width:550px;border-collapse:collapse}'
    + 'th{background:#a78bfa;color:#fff;padding:8px;font-size:12px}'
    + 'th:fir-ch{border-radius:8px 0 0 0}th:last-ch{border-radius:0 8px 0 0}'
    + 'td{padding:10px 8px;font-size:12px;border-bottom:1px solid #e0ddd5}'
    + 'td:fir-ch{font-weight:600;color:#1a1a2e;text-align:left}'
    + 'td:nth-ch(2){color:#888;text-align:center}'
    + 'td:nth-ch(3){color:#22aa66;text-align:center;font-weight:700}'
    + '</style></head><body>'
    + '<div class="icon">\ud83d\udd2e</div>'
    + '<h2>AI \uc2dc\ub300, \uc5d0\uc774\ucef7\uc774 \ub2f5\uc785\ub2c8\ub2e4</h2>'
    + '<table><tr><th>\uc601\uc5ed</th><th>AI \ub2e8\ub3c5</th><th>AI + \uc5d0\uc774\ucef7</th></tr>'
    + '<tr><td>\ud3b8\uc9d1 \uc18d\ub3c4</td><td>\ube60\ub984</td><td>\u2705 \ube60\ub984</td></tr>'
    + '<tr><td>\ube0c\ub79c\ub4dc \uac10\uac01</td><td>\u274c \ubd88\uac00</td><td>\u2705 \uc6b0\uc218</td></tr>'
    + '<tr><td>\uc77c\uad00\ub41c \ud018\ub9ac\ud2f0</td><td>\u274c \ubd88\uc548\uc815</td><td>\u2705 \uc548\uc815\uc801</td></tr>'
    + '<tr><td>\uba54\uc2dc\uc9c0 \uc804\ub2ec\ub825</td><td>\u274c \ubd80\uc871</td><td>\u2705 \uac15\ud568</td></tr>'
    + '</table></body></html>'
  );
  
  // cta 800x450
  await genImage(browser, 800, 450, 'aicut_blog_ai_cta.png',
    '<!DOCTYPE html><html><meta charset="UTF-8"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{width:800px;height:450px;overflow:hidden;font-family:"Noto Sans KR","Malgun Gothic",sans-serif;background:linear-gradient(135deg,#0D1630 0%,#1a1f4e 50%,#0D1630 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:50px;text-align:center}'
    + 'h2{color:#fff;font-size:30px;font-weight:800;margin-bottom:8px;word-break:keep-all}'
    + '.desc{color:#c0c0d0;font-size:15px;margin-bottom:24px;line-height:1.5}'
    + '.cta{background:linear-gradient(135deg,#a78bfa,#7c3aed);color:#fff;padding:14px 44px;border-radius:50px;font-size:18px;font-weight:700;display:inline-block;margin-bottom:16px}'
    + '.c{color:#c0c0d0;font-size:13px;line-height:1.8}'
    + '.c strong{color:#06b6d4}'
    + '</style></head><body>'
    + '<h2>AI \uc2dc\ub300, \ub204\uad6c\uc640 \ud568\uaed8\ud558\ub294\uac00\uac00<br>\ub354 \uc911\uc694\ud574\uc84c\uc2b5\ub2c8\ub2e4</h2>'
    + '<div class="desc">AI \ud234\uacfc \uc804\ub2f4 \uc5d0\ub514\ud130\uc758 \ucd5c\uc801 \uc870\ud569<br>\uc9c0\uae08 \uc5d0\uc774\ucef7\uc5d0 \ub9e1\uaca8\ubcf4\uc138\uc694</div>'
    + '<div class="cta">\ubb34\ub8cc \uc0c1\ub2f4 \uc2e0\uccad</div>'
    + '<div class="c">\uD83D\uDCE7 <strong>contact@aicut.co.kr</strong><br>\uD83D\uDCAC \uce74\uce74\uc624\ud1a1 \ucc44\ub110: <strong>\uc5d0\uc774\ucef7</strong></div>'
    + '</body></html>'
  );
  
  await browser.close();
  console.log('\n=== 2. 블로그 작성 ===');
  
  // === 2. 블로그 에디터 ===
  const b2 = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b2.contexts()[0];
  
  // 기존 PostWriteForm 닫기
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const pg = await ctx.newPage();
  await pg.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await pg.waitForTimeout(5000);
  
  // 2-1. 제목
  await pg.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('AI 영상 편집이 대세라고? 그래도 전문 에디터가 필요한 이유');
  });
  console.log('✅ 제목');
  
  // 2-2. 텍스트+이미지 5회
  const sections = [
    { text: '\uD83D\uDCAD "AI로 영상 편집하면 끝 아냐?"\n\uD83D\uDCAD "생성형 AI면 자동 편집되는 거 아니야?"\n\uD83D\uDCAD "그럼 편집 업체는 필요 없어지는 거 아니야?"\n\n요즘 AI 영상 편집 툴이 쏟아지고 있습니다.\nAI면 충분한데, 왜 전문 편집 에디터가 필요할까?', img: 'aicut_blog_ai_thumb.png' },
    { text: '\n\n\uD83E\uDDE0 AI 영상 편집, 현재 수준은?\nAI 툴의 발전 속도는 놀랍습니다.\n자동 자막, 배경 제거, AI 더빙까지\n이제 몇 번의 클릭으로 가능합니다.', img: 'aicut_blog_ai_01.png' },
    { text: '\n\n\u26A0\uFE0F AI가 절대 못 하는 3가지\n\u2460 브랜드 감각 - AI는 브랜드 느낌 학습 불가\n\u2461 맥락 이해 - 단순 편집 vs 메시지 전달\n\u2462 긴급 대응 - 긴급 상황 대응 불가', img: 'aicut_blog_ai_02.png' },
    { text: '\n\n\uD83D\uDCA1 정답은 AI + 인간의 조합\nAI 툴로 1차 편집 + 전담 에디터 최종 조정\n편집 시간 40% 단축, 퀄리티는 더 높게', img: 'aicut_blog_ai_03.png' },
    { text: '\n\n\uD83D\uDD2E 앞으로의 영상 편집 시장\nAI가 기본 처리 + 전문가 완성 구조\n\n\uD83D\uDC49 카카오톡: 에이컷\n\uD83D\uDC49 이메일: contact@aicut.co.kr\n\n#AI영상편집 #영상편집외주 #생성형AI #에이컷 #AICUT #전담에디터 #숏폼마케팅 #영상편집대행 #AI영상 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #AI마케팅 #영상편집 #숏폼제작 #AI에디터 #브랜드영상 #여름마케팅 #릴스알고리즘 #영상편집비용 #전담매니저 #유튜브편집 #쇼츠제작 #인스타릴스 #AI시대 #콘텐츠제작 #에이컷블로그', img: 'aicut_blog_ai_cta.png' }
  ];
  
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    
    // 텍스트
    const pos = await pg.evaluate(() => {
      const c = document.querySelector('.se-content');
      if (c) { const r = c.getBoundingClientRect(); return { x: r.x + 100, y: r.y + r.height - 30 }; }
      return null;
    });
    if (pos) {
      await pg.mouse.click(pos.x, pos.y);
      await pg.waitForTimeout(200);
      await pg.keyboard.press('End');
      await pg.waitForTimeout(200);
      await pg.keyboard.type(s.text, { delay: 1 });
      await pg.waitForTimeout(800);
    }
    
    // 이미지 - filechooser 방식
    const fcPromise = pg.waitForEvent('filechooser', { timeout: 10000 });
    await pg.mouse.click(36, 74);
    const fc = await fcPromise.catch(() => null);
    if (fc) {
      await fc.setFiles([path.join(WORKSPACE, s.img)]);
      await pg.waitForTimeout(2000);
      console.log(`  ${i+1}/5 ${s.img}`);
    }
  }
  
  // 2-3. 센터 정렬 + 이미지 width 100%
  console.log('✅ 정렬...');
  await pg.evaluate(() => {
    // 텍스트 정렬
    document.querySelectorAll('.se-text-paragraph').forEach(p => { p.style.textAlign = 'center'; });
    
    // 모든 이미지 정렬 (100% 강제)
    document.querySelectorAll('.se-image-resource').forEach(img => {
      img.style.display = 'block';
      img.style.margin = '0 auto';
      img.style.width = '100%';
      img.style.maxWidth = '100%';
    });
  });
  
  // 2-4. 저장
  await pg.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await pg.waitForTimeout(3000);
  console.log('✅ 저장');
  
  // 2-5. 검증
  const v = await pg.evaluate(() => {
    const txt = document.querySelector('.se-content')?.innerText || '';
    const imgs = document.querySelectorAll('.se-components-wrap img');
    const xs = Array.from(imgs).map(i => Math.round(i.getBoundingClientRect().x));
    const alts = Array.from(imgs).map(i => (i.alt || '').substring(0, 25));
    const allSameX = xs.every(x => x === xs[0]);
    return {
      len: txt.length,
      imgCount: imgs.length,
      imgAlts: alts,
      imgXs: xs,
      allCenter: allSameX,
      hashtags: txt.includes('#AI'),
      title: document.querySelector('.se-documentTitle')?.innerText?.trim()?.substring(0, 20) || ''
    };
  });
  
  console.log('\n=== \u2705 \uCD5C\uC885 \uAC80\uC99D ===');
  console.log('\uC81C\uBAA9:', v.title ? '\u2705' : '\u274C');
  console.log('\uBCF8\uBB38:', v.len + '\uC790');
  console.log('\uC774\uBBF8\uC9C0:', v.imgCount + '\uC7A5');
  console.log('\uC21C\uC11C:', v.imgAlts.join(' \u2192 '));
  console.log('\uC815\uB82C \uC704CE58:', v.imgXs.join(', '), v.allCenter ? '\u2705' : '\u274C');
  console.log('\uD574\uC2DC\uD0DC\uADF8:', v.hashtags ? '\u2705' : '\u274C');
  
  if (v.allCenter && v.imgCount === 5 && v.hashtags) {
    console.log('\n\uD83C\uDF89 \uC644\uBCBD! \uBC1C\uD589 \uBC84\uD2BC\uB9CC \uB204\uB974\uBA74 \uB429\uB2C8\uB2E4!');
  }
  
  await pg.screenshot({ path: 'ai_blog_final.png' });
  await b2.close();
})();

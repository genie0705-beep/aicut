const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = ['병원마케팅','부동산마케팅','보험설계사','프랜차이즈마케팅','숏폼마케팅','영상편집','콘텐츠마케팅','1인강사'];
const BLACKLIST = ['toss','shinhan','kb_','kookmin','woori','hana','kakaobank','samsung','lg_','hyundai','kakao_','naver_','coupang','baemin','facebook','google','instagram','reels'];
const OUT_FILE = './insta_targets.json';

let existing = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE,'utf8')) : [];
const doneSet = new Set(existing.map(t=>t.username));
console.log('기존:', existing.length);

async function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/', {waitUntil:'domcontentloaded',timeout:15000}).catch(()=>{});
  await sleep(3000);

  const newTargets = [];
  const MAX = 30;

  for (const tag of HASHTAGS) {
    if (newTargets.length >= MAX) break;
    console.log('\n[#' + tag + ']');
    await page.goto('https://www.instagram.com/explore/tags/' + encodeURIComponent(tag) + '/', {waitUntil:'domcontentloaded',timeout:10000}).catch(()=>{});
    await sleep(3000);
    
    let posts = [];
    try { posts = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a=>a.href))].slice(0,8)); } catch(e) {}
    console.log('  게시물:', posts.length);
    
    for (const url of posts) {
      if (newTargets.length >= MAX) break;
      try { await page.goto(url, {waitUntil:'domcontentloaded',timeout:10000}).catch(()=>{}); } catch(e) {}
      await sleep(2000);
      
      let username = '';
      try {
        username = await page.evaluate(() => {
          const links = document.querySelectorAll('a[href*="/"]');
          for (const a of links) {
            const h = a.getAttribute('href') || '';
            if (h.startsWith('/') && h.length > 2 && !h.includes('/p/') && !h.includes('/explore/') && !h.includes('/tag/')) {
              return h.replace('/','').split('/')[0].split('?')[0];
            }
          }
          return '';
        });
      } catch(e) {}
      
      if (username && !BLACKLIST.some(b=>(username||'').toLowerCase().includes(b)) && !doneSet.has(username)) {
        if (!newTargets.some(t=>t.username===username)) {
          newTargets.push({username, tag, collectedAt: new Date().toISOString()});
          doneSet.add(username);
          console.log('  ➕ @' + username);
        }
      }
      await sleep(1000 + Math.floor(Math.random()*1500));
    }
  }

  const all = [...existing, ...newTargets];
  fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2));
  console.log('\n✅ 신규 ' + newTargets.length + '명, 총 ' + all.length + '명');
  
  await page.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = [
  '병원마케팅', '성형외과마케팅', '치과마케팅', '한의원마케팅',
  '보험마케팅', '보험설계사', '공인중개사마케팅', '변호사마케팅',
  '부동산마케팅', '부동산유튜브',
  '이커머스마케팅', '쇼핑몰마케팅', '프랜차이즈마케팅',
  '숏폼마케팅', '영상편집', '콘텐츠마케팅',
  '유튜브마케팅', '온라인강의', '1인강사', '소상공인마케팅'
];

const BLACKLIST = ['toss','shinhan','kb_','kookmin','woori','hana','nh_','kakaobank','samsung','lg_','hyundai','kakao_','naver_','coupang','baemin','gmarket','11st','lotte','cj_','sk_','kt_','nongshim','facebook','google','instagram'];

function isBlacklisted(u) {
  return BLACKLIST.some(b => (u||'').toLowerCase().includes(b));
}

const OUT_FILE = './insta_targets.json';
let existing = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE,'utf8')) : [];
const doneSet = new Set(existing.map(t=>t.username));
console.log('기존:', existing.length);

async function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }
function rand(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/', {waitUntil:'domcontentloaded',timeout:15000}).catch(()=>{});
  await sleep(2000);
  
  const newTargets = [];
  const MAX = 40;
  
  for (const tag of HASHTAGS) {
    if (newTargets.length >= MAX) break;
    console.log('\n[#' + tag + ']');
    
    try {
      await page.goto('https://www.instagram.com/explore/tags/' + encodeURIComponent(tag) + '/', {waitUntil:'domcontentloaded',timeout:10000}).catch(()=>{});
    } catch(e) {}
    await sleep(3000);
    
    let posts = [];
    try { posts = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a=>a.href))].slice(0,6)); } catch(e) {}
    console.log('  게시물:', posts.length);
    
    for (const url of posts) {
      if (newTargets.length >= MAX) break;
      
      try {
        await page.goto(url, {waitUntil:'domcontentloaded',timeout:10000}).catch(()=>{});
      } catch(e) {}
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
      
      if (username && !isBlacklisted(username) && !doneSet.has(username)) {
        const dup = newTargets.some(t=>t.username===username);
        if (!dup) {
          newTargets.push({username, tag, collectedAt: new Date().toISOString()});
          doneSet.add(username);
          console.log('  ➕ @' + username);
        }
      }
      
      await sleep(rand(1000,2000));
    }
  }
  
  const all = [...existing, ...newTargets];
  fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2));
  console.log('\n✅ 완료! 신규 ' + newTargets.length + '명, 총 ' + all.length + '명');
  
  await page.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0])).finally(()=>setTimeout(()=>process.exit(0),2000));

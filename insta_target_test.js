/**
 * insta_target_test.js — 업종 타겟 10건 테스트
 * 핵심 타겟: 병원, 전문직(보험/금융/변호사), 부동산, 이러닝, 유튜버, 이커머스
 * 댓글 7건 + DM 3건
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SENT_FILE = './insta_sent.json';
const COMMENT_LOG = './insta_comments_log.json';
const MAX_COMMENT = 7;
const MAX_DM = 3;

let sent = { sent: [] };
if (fs.existsSync(SENT_FILE)) { try { sent = JSON.parse(fs.readFileSync(SENT_FILE,'utf8')); } catch(e){} }
const sentSet = new Set(sent.sent.map(s=>s.username));

let commentLog = { commented: [] };
if (fs.existsSync(COMMENT_LOG)) { try { commentLog = JSON.parse(fs.readFileSync(COMMENT_LOG,'utf8')); } catch(e){} }
const commentedUrls = new Set(commentLog.commented.map(c=>c.url));

const TARGET_HASHTAGS = [
  // 병원/의원
  '병원마케팅', '의원마케팅', '성형외과마케팅', '한의원마케팅', '치과마케팅',
  // 전문직
  '보험마케팅', '보험설계사', '금융마케팅', '공인중개사',
  // 부동산
  '부동산마케팅', '부동산유튜브',
  // 이러닝/강사
  '이러닝', '온라인강의', '1인창업',
  // 유튜버
  '유튜브마케팅', '유튜버스팁',
  // 이커머스
  '이커머스마케팅', '쇼핑몰마케팅'
];

function getComment(postText, tag) {
  const t = (postText||'').toLowerCase();
  const tg = (tag||'').toLowerCase();

  if (tg.includes('병원') || tg.includes('의원') || tg.includes('성형') || tg.includes('한의') || tg.includes('치과') || t.includes('병원') || t.includes('클리닉')) {
    const opts = ['병원 영상 콘텐츠 신뢰도에 진짜 중요하더라고요 🏥','의료 정보 영상으로 공유해주시니 이해하기 쉬워요 👍','원장님 직접 출연하시니까 훨씬 신뢰감 있어요 😊','이런 콘텐츠 꾸준히 만드시는 게 대단해요 💪'];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  if (tg.includes('보험') || tg.includes('금융') || t.includes('보험') || t.includes('설계사')) {
    const opts = ['보험/금융 콘텐츠도 영상으로 신뢰도 높이는 분들 많아지더라고요 📊','설계사분들 유튜브 요즘 진짜 많이 보게 되더라고요 👍','금융 정보 영상으로 보면 훨씬 이해하기 쉽죠 😊'];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  if (tg.includes('부동산') || tg.includes('중개') || t.includes('부동산') || t.includes('매물')) {
    const opts = ['부동산 영상 콘텐츠 요즘 진짜 대세네요 🏠','매물 영상으로 보여주시니까 훨씬 직관적이에요 👍','꾸준히 콘텐츠 올리시는 거 인상적이에요 🔥'];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  if (tg.includes('이러닝') || tg.includes('강의') || tg.includes('강사') || t.includes('강의') || t.includes('코치')) {
    const opts = ['온라인 강의 영상 품질이 수강생한테 진짜 중요하더라고요 🎓','콘텐츠 엔지니어링 낙낙한데 잘 정리해주셨네요 ✨','교육 콘텐츠도 영상으로 하면 훨씬 지속성이 높더라고요 👍'];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  if (tg.includes('유튜버') || tg.includes('유튜브') || t.includes('유튜브') || t.includes('구독')) {
    const opts = ['유튜브 꾸준히 운영하는 게 제일 어렵죠 🚀','채널 콘텐츠 편집 품질이 진짜 핵심인 것 같아요 📹','이런 콘텐츠 꾸준히 만드시는 거 대단해요 👍'];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  if (tg.includes('이커머스') || tg.includes('쇼핑몰') || t.includes('쇼핑몰') || t.includes('상품')) {
    const opts = ['쇼핑몰 영상 콘텐츠 요즘 진짜 필수도구네요 🛒','상품 영상 편집 품질이 충성도에 진짜 영향 대단해요 👍','콘텐츠 마케팅 진짜 의지가 넓어지더라고요 🚀'];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  return '좋은 콘텐츠 잘 보고 갑니다 😊';
}

function getDM(tag) {
  const tg = (tag||'').toLowerCase();
  if (tg.includes('병원') || tg.includes('의원') || tg.includes('성형') || tg.includes('한의') || tg.includes('치과')) {
    return `안녕하세요! 병원 콘텐츠 잘 보고 있어요 😊\n원장님 촬영 영상 편집 파트너 있으시면 훨씬 수월해지더라고요.\n에이컷은 의료 규정 맞춰 48시간 납품, 전담 에디터 고정이에요.\n궁금하신 점 편하게 물어보셔도 돼요 🙏\naicut.co.kr`;
  }
  if (tg.includes('보험') || tg.includes('금융')) {
    return `안녕하세요! 영상 콘텐츠 잘 보고 있어요 😊\n보험/금융 분야 영상으로 신뢰도 높이시는 분들께 에이컷을 소개드리고 싶어서요.\n전담 에디터 고정 배정, 48시간 납품, 수정 무제한이에요.\n관심 있으시면 편하게 연락 주세요 🙏\naicut.co.kr`;
  }
  if (tg.includes('부동산') || tg.includes('중개')) {
    return `안녕하세요! 부동산 콘텐츠 항상 잘 보고 있어요 🏠\n매물 영상이나 유튜브 운영하실 때 편집 파트너 찾고 계신다면 에이컷 한번 살펴보세요.\n소스만 주시면 전담팀이 48시간 납품해드립니다 😊\naicut.co.kr`;
  }
  if (tg.includes('이러닝') || tg.includes('강의') || tg.includes('강사')) {
    return `안녕하세요! 강의 콘텐츠 잘 보고 있어요 🎓\n온라인 강의 영상 편집 파트너 찾고 계신다면 에이컷 한번 살펴보세요.\n전담 에디터 고정, 48시간 납품으로 강의 론칭 일정 맞추실 수 있어요 😊\naicut.co.kr`;
  }
  if (tg.includes('유튜버') || tg.includes('유튜브')) {
    return `안녕하세요! 채널 콘텐츠 항상 잘 보고 있어요 📹\n꾸준한 업로드 위해 편집 파트너 찾고 계신다면 에이컷 추천드려요.\n전담 에디터가 브랜드 톤 맞춰 48시간 납품해드립니다 🙏\naicut.co.kr`;
  }
  return `안녕하세요! 콘텐츠 잘 보고 있어요 😊\n영상 편집 파트너 찾고 계신다면 에이컷 한번 살펴보세요.\n전담 에디터 고정, 48시간 납품, 수정 무제한이에요 🙏\naicut.co.kr`;
}

async function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }
function rand(min,max) { return Math.floor(Math.random()*(max-min)+min); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p=>p.url().includes('instagram.com')) || pages[0];
  ctx.on('dialog', async d=>{ try{ await d.dismiss(); }catch(e){} });

  const results = { comments:[], dms:[], failed:[] };
  let commentCount=0, dmCount=0;

  for (const tag of TARGET_HASHTAGS) {
    if (commentCount >= MAX_COMMENT && dmCount >= MAX_DM) break;

    console.log(`\n[#${tag}]`);
    try {
      try {
        await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`, { waitUntil:'domcontentloaded', timeout:15000 });
      } catch(e){}
      await sleep(3000);

      const postLinks = await page.evaluate(() =>
        [...new Set(Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a=>a.href))].slice(0,6)
      );
      console.log(`  게시물 ${postLinks.length}개`);

      for (const postUrl of postLinks) {
        if (commentCount >= MAX_COMMENT && dmCount >= MAX_DM) break;
        if (commentedUrls.has(postUrl)) continue;

        try {
          try {
            await page.goto(postUrl, { waitUntil:'domcontentloaded', timeout:15000 });
          } catch(e){}
          await sleep(3000);

          const isOwn = await page.evaluate(()=>document.body.innerText.includes('aicut.official'));
          if (isOwn) continue;

          const author = await page.evaluate(()=>{
            const links = Array.from(document.querySelectorAll('a[href]'));
            for (const link of links) {
              const m = link.href.match(/instagram\.com\/([^/?#]+)\/?$/);
              if (m&&m[1]&&!['p','explore','reel','stories','aicut.official','accounts','direct','reels'].includes(m[1])) return m[1];
            }
            return null;
          });

          const postText = await page.evaluate(()=>{
            const h1Span = document.querySelector('h1 span');
            if (h1Span&&h1Span.innerText?.trim().length>10) return h1Span.innerText.trim().substring(0,200);
            const meta = document.querySelector('meta[name="description"]');
            if (meta) return meta.getAttribute('content')?.substring(0,200)||'';
            return '';
          });

          const comment = getComment(postText, tag);

          // ── 댓글 ──
          if (commentCount < MAX_COMMENT) {
            const inputCoord = await page.evaluate(()=>{
              const textareas = Array.from(document.querySelectorAll('textarea'));
              for (const el of textareas) {
                const ph = el.placeholder||'';
                if (ph.includes('댓글')||ph.includes('comment')||ph.includes('Add')) {
                  const rect = el.getBoundingClientRect();
                  if (rect.width>0) return { x: rect.x+rect.width/2, y: rect.y+rect.height/2 };
                }
              }
              const first = document.querySelector('textarea');
              if (first) {
                const rect = first.getBoundingClientRect();
                if (rect.width>0) return { x: rect.x+rect.width/2, y: rect.y+rect.height/2 };
              }
              return null;
            });

            if (inputCoord) {
              await page.mouse.click(inputCoord.x, inputCoord.y);
              await sleep(800);
              await page.keyboard.type(comment, { delay: 15 });
              await sleep(500);
              const btnClicked = await page.evaluate(()=>{
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b=>b.innerText?.trim()==='게시'&&!b.disabled);
                if(btn){ btn.click(); return true; }
                return false;
              });
              if (!btnClicked) await page.keyboard.press('Enter');
              await sleep(2000);
              console.log(`  ✅ 댓글 [${commentCount+1}] @${author||'unknown'} (${tag}): "${comment.substring(0,20)}..."`);
              commentedUrls.add(postUrl);
              commentLog.commented.push({ url:postUrl, username:author, tag, comment, time:new Date().toISOString() });
              fs.writeFileSync(COMMENT_LOG, JSON.stringify(commentLog,null,2));
              results.comments.push({ username:author, tag, comment });
              commentCount++;
              await sleep(rand(4000,7000));
            }
          }

          // ── DM ──
          if (dmCount < MAX_DM && author && !sentSet.has(author)) {
            try {
              await page.goto(`https://www.instagram.com/${author}/`, { waitUntil:'domcontentloaded', timeout:15000 });
            } catch(e){}
            await sleep(2000);

            const msgClicked = await page.evaluate(()=>{
              const btns = Array.from(document.querySelectorAll('button'));
              const btn = btns.find(b=>b.innerText?.trim()==='메시지');
              if(btn){ btn.click(); return true; }
              return false;
            });

            if (msgClicked) {
              await sleep(2500);
              const dmCoord = await page.evaluate(()=>{
                const textareas = Array.from(document.querySelectorAll('textarea'));
                for (const el of textareas) {
                  const ph = el.placeholder||'';
                  if (ph.includes('메시지')||ph.includes('message')) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width>0) return { x:rect.x+rect.width/2, y:rect.y+rect.height/2 };
                  }
                }
                const first = document.querySelector('textarea');
                if (first) {
                  const rect = first.getBoundingClientRect();
                  if (rect.width>0) return { x:rect.x+rect.width/2, y:rect.y+rect.height/2 };
                }
                return null;
              });
              if (dmCoord) {
                const dmMsg = getDM(tag);
                await page.mouse.click(dmCoord.x, dmCoord.y);
                await sleep(500);
                await page.keyboard.type(dmMsg, { delay: 15 });
                await sleep(500);
                await page.keyboard.press('Enter');
                await sleep(2000);
                console.log(`  📩 DM [${dmCount+1}] @${author} (${tag})`);
                sent.sent.push({ username:author, tag, time:new Date().toISOString() });
                sentSet.add(author);
                fs.writeFileSync(SENT_FILE, JSON.stringify(sent,null,2));
                results.dms.push({ username:author, tag });
                dmCount++;
                await sleep(rand(8000,12000));
              }
            }
          }

        } catch(e) {
          console.log(`  ✗ ${e.message.substring(0,40)}`);
        }
      }
    } catch(e) {
      console.log(`  태그 오류: ${e.message.substring(0,40)}`);
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log(`✅ 완료: 댓글 ${commentCount}건 / DM ${dmCount}건`);
  if (results.comments.length) console.log('댓글:', results.comments.map(c=>`@${c.username||'?'}(${c.tag})`).join(', '));
  if (results.dms.length) console.log('DM:', results.dms.map(d=>`@${d.username}(${d.tag})`).join(', '));

  await b.close();
})().catch(e=>{
  console.error('Fatal:', e.message);
  process.exit(1);
}).finally(()=>setTimeout(()=>process.exit(0),2000));

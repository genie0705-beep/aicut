const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

// 랜덤 지연 (자연스러운 간격)
const delay = (min, max) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

async function addNeighbor(wp, blogId) {
  const url = `https://blog.naver.com/${blogId}`;
  await wp.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wp.waitForTimeout(2000 + Math.random() * 2000);

  // 이웃 추가 버튼 찾기
  const result = await wp.evaluate((id) => {
    // 이웃추가 버튼 찾기
    const btns = document.querySelectorAll('a, button, span');
    for (const btn of btns) {
      const text = (btn.textContent || '').trim();
      if (text.includes('이웃') && (text.includes('추가') || text.includes('신청'))) {
        btn.click();
        return 'clicked: ' + text;
      }
    }
    return 'no neighbor button for ' + id;
  }, blogId);

  await delay(3000, 5000);
  return result;
}

async function findRelevantBlogs(wp, keyword) {
  await wp.goto(`https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&query=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wp.waitForTimeout(3000);
  
  const blogs = await wp.evaluate(() => {
    const results = [];
    // 블로그 검색 결과
    document.querySelectorAll('a').forEach(a => {
      const href = a.href || '';
      const text = (a.textContent || '').trim();
      if (href.includes('blog.naver.com/') && !href.includes('aicut') && text.length > 3 && text.length < 50) {
        const match = href.match(/blog\.naver\.com\/([^/?&]+)/);
        if (match && match[1]) {
          results.push({ blogId: match[1], title: text });
        }
      }
    });
    return results.slice(0, 10);
  });
  
  return blogs;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 기존 블로그 페이지에서 cookie/session 사용
  const existingBlog = ctx.pages().find(p => p.url().includes('blog.naver.com/aicut') && !p.url().includes('postwrite'));
  if (!existingBlog) { console.log('블로그 페이지 없음'); await b.close(); return; }
  
  // 새 페이지 열고 기존 페이지에서 쿠키 복사
  const wp = await ctx.newPage();
  await wp.goto('https://blog.naver.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wp.waitForTimeout(3000);
  
  const isLoggedIn = await wp.evaluate(() => {
    const body = document.body.textContent || '';
    return !body.includes('로그인') || body.includes('AICUT') || body.includes('내블로그');
  });
  if (!isLoggedIn) { console.log('로그인 필요 — 브라우저에서 네이버 로그인 상태 확인 필요'); await b.close(); return; }
  console.log('✅ 로그인 확인');

  // 관련 블로그 검색
  const keywords = ['영상편집', '숏폼마케팅', '보험마케팅'];
  let targetBlogs = [];

  for (const kw of keywords) {
    console.log(`\n🔍 "${kw}" 검색 중...`);
    const blogs = await findRelevantBlogs(wp, kw);
    console.log(`  ${blogs.length}개 발견`);
    targetBlogs = targetBlogs.concat(blogs);
    await delay(2000, 4000);
  }

  // 중복 제거, aicut 제외
  const unique = [];
  const seen = new Set();
  targetBlogs.forEach(b => {
    if (!seen.has(b.blogId) && b.blogId !== 'aicut') {
      seen.add(b.blogId);
      unique.push(b);
    }
  });

  console.log(`\n📋 총 ${unique.length}개 블로그 발견. 5개만 이웃 추가 진행...`);

  // 5개만 선택하여 이웃 추가
  const selected = unique.slice(0, 5);
  let successCount = 0;

  for (let i = 0; i < selected.length; i++) {
    const blog = selected[i];
    console.log(`\n[${i+1}/5] ${blog.title} (@${blog.blogId})`);

    const result = await addNeighbor(wp, blog.blogId);
    console.log(`  결과: ${result}`);

    if (result.includes('clicked')) successCount++;

    if (i < selected.length - 1) {
      const wait = 4000 + Math.random() * 6000;
      console.log(`  ⏳ ${Math.round(wait/1000)}초 대기...`);
      await delay(wait * 0.8, wait * 1.2);
    }
  }

  console.log(`\n✅ 이웃 추가 완료: ${successCount}/${selected.length}건`);

  await wp.close();
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

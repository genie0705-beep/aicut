/**
 * blog_neighbor.js — 네이버 블로그 이웃 추가 자동화
 * 키워드 검색 → 포스팅 작성자 이웃 추가 (하루 10~15개)
 * 중복 방지: blog_neighbor_log.json 참조
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'blog_neighbor_log.json');
const MAX_ADD = 15; // 하루 최대 이웃 추가 수

const KEYWORDS = [
  '영상편집',
  '유튜브마케팅',
  '콘텐츠마케팅',
  '숏폼마케팅',
  '병원마케팅',
  '부동산마케팅',
  '쇼핑몰마케팅',
  '인스타그램마케팅',
  '영상편집외주',
  '동영상제작',
];

function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return { added: [], failed: [] };
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return { added: [], failed: [] };
  }
}

function saveLog(data) {
  data.date = new Date().toISOString();
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
}

async function run() {
  const log = loadLog();
  const addedIds = new Set(log.added.map(e => e.blogId));
  const results = { added: 0, skipped: 0, failed: 0 };

  const browser = await chromium.connectOverCDP('http://localhost:9222').catch(() => null);
  if (!browser) {
    console.error('Chrome CDP 연결 실패. Chrome이 --remote-debugging-port=9222 로 실행 중인지 확인하세요.');
    process.exit(1);
  }

  const context = browser.contexts()[0];
  const page = await context.newPage();

  try {
    for (const keyword of KEYWORDS) {
      if (results.added >= MAX_ADD) break;

      console.log(`\n[키워드] ${keyword}`);
      await page.goto(`https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=sim&keyword=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      // 블로그 링크 수집
      const links = await page.$$eval('.list_search_post .item', els =>
        els.map(el => {
          const link = el.querySelector('a.desc_inner');
          if (!link) return null;
          const href = link.href || '';
          // Skip blog.naver.com/PostList.naver (not a real blog post)
          if (href.includes('/PostList.naver')) return null;
          return href;
        }).filter(h => h && h.includes('blog.naver.com/'))
      );

      for (const link of links) {
        if (results.added >= MAX_ADD) break;

        // blogId 추출
        const match = link.match(/blog\.naver\.com\/([^/?#]+)/);
        if (!match) continue;
        const blogId = match[1];

        // 시스템 블로그 제외
        if (['BlogHome', 'MyBlog', 'mj', 'aicut'].includes(blogId)) continue;
        // 이미 추가된 이웃 스킵
        if (addedIds.has(blogId)) {
          results.skipped++;
          continue;
        }

        // 블로그 방문
        const blogUrl = `https://blog.naver.com/${blogId}`;
        await page.goto(blogUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(2000);

        // iframe 진입 시도
        let targetPage = page;
        const frames = page.frames();
        for (const frame of frames) {
          if (frame.url().includes('blog.naver.com') && frame.url().includes('blogId')) {
            targetPage = frame;
            break;
          }
        }

        // 이웃 추가 버튼 찾기
        const neighborBtn = await targetPage.$('a.btn_add_nb, a._addBuddyPop, a[class*="neighbor"], a.buddy_btn, a:has-text("이웃추가")').catch(() => null);

        if (!neighborBtn) {
          console.log(`  [스킵] ${blogId} — 이웃 추가 버튼 없음`);
          log.failed.push({ blogId, reason: '버튼 없음' });
          results.failed++;
          continue;
        }

        await neighborBtn.click().catch(() => null);
        await page.waitForTimeout(2000);

        // 확인 버튼 처리 (팝업/모달)
        const confirmBtn = await page.$('button.btn_ok, button[class*="confirm"], button:has-text("확인"), button:has-text("이웃 추가"), a[class*="_addBuddy"]').catch(() => null);
        if (confirmBtn) {
          await confirmBtn.click().catch(() => null);
          await page.waitForTimeout(1500);
        }

        console.log(`  [추가] ${blogId} (${keyword})`);
        log.added.push({ blogId, keyword, time: new Date().toISOString() });
        addedIds.add(blogId);
        results.added++;

        saveLog(log);
        await page.waitForTimeout(3000); // 요청 간격
      }
    }
  } finally {
    await page.close().catch(() => null);
    await browser.close().catch(() => null);
  }

  console.log(`\n✅ 완료: 추가 ${results.added}개 / 스킵 ${results.skipped}개 / 실패 ${results.failed}개`);
  return results;
}

run().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
}).finally(() => process.exit(0));

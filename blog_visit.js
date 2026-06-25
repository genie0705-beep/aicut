/**
 * blog_visit.js — 네이버 블로그 이웃 방문 + 공감 자동화 v2
 * - iframe(mainFrame) 내부 구조 대응
 * - 네이버 리액션 시스템 (공감/칭찬/감사/웃김/놀람/슬픔) 대응
 * - 어뷰징 방지: 랜덤 공감률, 랜덤 딜레이
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const NEIGHBOR_LOG = path.join(__dirname, 'blog_neighbor_log.json');
const VISIT_LOG = path.join(__dirname, 'blog_visit_log.json');
const MAX_VISIT = 15;

function loadNeighbors() {
  if (!fs.existsSync(NEIGHBOR_LOG)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(NEIGHBOR_LOG, 'utf8'));
    return data.added || [];
  } catch { return []; }
}

function loadVisitLog() {
  if (!fs.existsSync(VISIT_LOG)) return { visited: [], liked: [] };
  try { return JSON.parse(fs.readFileSync(VISIT_LOG, 'utf8')); }
  catch { return { visited: [], liked: [] }; }
}

function saveVisitLog(data) {
  fs.writeFileSync(VISIT_LOG, JSON.stringify(data, null, 2));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  const neighbors = loadNeighbors();
  const visitLog = loadVisitLog();
  const today = new Date().toISOString().slice(0, 10);

  const visitedToday = new Set(
    visitLog.visited.filter(v => v.date === today).map(v => v.blogId)
  );

  const results = { visited: 0, liked: 0, skipped: 0, failed: 0 };

  if (neighbors.length === 0) {
    console.log('이웃 목록이 없습니다. blog_neighbor.js를 먼저 실행하세요.');
    process.exit(0);
  }

  const CDP_PORT = process.env.CDP_PORT || '9224';
  const browser = await chromium.connectOverCDP('http://localhost:' + CDP_PORT).catch(() => null);
  if (!browser) {
    console.error('Chrome CDP 연결 실패.');
    process.exit(1);
  }

  const context = browser.contexts()[0];
  const page = await context.newPage();

  const toVisit = neighbors
    .filter(n => !visitedToday.has(n.blogId))
    .slice(0, MAX_VISIT);

  if (toVisit.length === 0) {
    console.log('오늘 방문할 이웃이 없습니다 (모두 방문 완료).');
    await browser.close().catch(() => null);
    process.exit(0);
  }

  try {
    for (const neighbor of toVisit) {
      const { blogId } = neighbor;
      console.log(`\n[방문] ${blogId}`);

      // 1) 블로그 메인 페이지 로드
      await page.goto(`https://blog.naver.com/${blogId}`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      }).catch(() => null);
      await page.waitForTimeout(2000);

      // 2) mainFrame iframe 내부 접근
      const mainFrame = page.frame({ name: 'mainFrame' });
      if (!mainFrame) {
        console.log('  mainFrame 없음');
        results.skipped++;
        continue;
      }

      // 3) mainFrame 내부에서 최신 포스팅 링크 찾기
      let postUrl = null;
      try {
        const links = await mainFrame.$$eval(
          'a[href*="logNo"]',
          els => els.map(el => el.href).filter(h => h && h.includes('logNo'))
        );
        if (links.length > 0) postUrl = links[0];
      } catch(e) {}

      if (!postUrl) {
        console.log('  포스팅 링크 없음');
        results.skipped++;
        // 방문 기록은 남김 (블로그 자체는 방문)
        visitLog.visited.push({ blogId, date: today, time: new Date().toISOString() });
        saveVisitLog(visitLog);
        results.visited++;
        await page.waitForTimeout(rand(2000, 4000));
        continue;
      }

      // 4) 포스팅 페이지를 메인페이지에 로드 (iframe 내부 PostView 네비게이션)
      // PostView는 iframe 내부에서 로드되어야 함 → 직접 goto
      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(2000);
      } catch(e) {
        console.log('  포스팅 로드 실패');
        results.failed++;
        continue;
      }

      // 5) 공감 처리 (랜덤: 40~60% 확률로만 실행)
      const shouldLike = Math.random() < 0.5; // 50% 확률
      const postFrame = page.frame({ name: 'mainFrame' }) || page.frame({ url: /PostView/ });

      if (shouldLike && postFrame) {
        try {
          await page.waitForTimeout(rand(1000, 3000)); // 사람처럼 천천히

          // 5-1) 리액션 버튼 찾기 (공감 버튼)
          const reactionBtn = await postFrame.$(
            'a.u_likeit_button._face.off, span.u_likeit_button._face.off'
          );

          if (reactionBtn) {
            // 리액션 버튼 클릭 → 리액션 목록 펼쳐짐
            await reactionBtn.click().catch(() => null);
            await page.waitForTimeout(rand(500, 1200));

            // 5-2) 첫 번째 리액션 (공감) 클릭
            const likeOption = await postFrame.$(
              'a.u_likeit_list_button._button.off'
            );

            if (likeOption) {
              await likeOption.click().catch(() => null);
              await page.waitForTimeout(rand(800, 1500));

              visitLog.liked.push({ blogId, postUrl, time: new Date().toISOString() });
              results.liked++;
              console.log(`  ✅ [공감] 완료`);
            }
          }
        } catch(e) {
          console.log(`  공감 실패: ${e.message.substring(0, 50)}`);
        }
      } else {
        console.log(`  [방문만] 공감 안 함 (랜덤 스킵)`);
      }

      // 6) 방문 기록 저장
      visitLog.visited.push({ blogId, date: today, time: new Date().toISOString() });
      saveVisitLog(visitLog);
      results.visited++;

      // 7) 다음 방문 전 랜덤 대기 (2~5초)
      await page.waitForTimeout(rand(2000, 5000));
    }
  } finally {
    await page.close().catch(() => null);
    await browser.close().catch(() => null);
  }

  console.log(`\n✅ 완료: 방문 ${results.visited}개 / 공감 ${results.liked}개 / 스킵 ${results.skipped}개`);
}

run().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
});

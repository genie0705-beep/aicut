require('dotenv').config();
const fs = require('fs');
const path = require('path');
const store = require('../db/store');
store.init();

const KEYWORD_FILE = path.join(__dirname, '..', 'blog_seasonal_keywords.md');
let keywordData = { season: [], hot: [], industry: [] };
try {
  const md = fs.readFileSync(KEYWORD_FILE, 'utf8');
  const seasonSection = md.match(/### 📈 시즌 추천 키워드[\s\S]*?(?=###|\n#)/);
  const hotSection = md.match(/### 🔥 핫 키워드[\s\S]*?(?=###|\n#)/);
  const industrySection = md.match(/### 업종별 시즌 키워드[\s\S]*?(?=###|\n#)/);

  if (seasonSection) {
    const lines = seasonSection[0].split('\n').filter(l => l.startsWith('|') && l.includes('|') && !l.includes('---'));
    keywordData.season = lines.map(l => {
      const parts = l.split('|').map(p => p.trim()).filter(p => p);
      return { keyword: parts[0], example: parts[1] };
    }).filter(k => k.keyword && k.keyword.length > 0 && k.keyword !== '키워드');
  }
  if (hotSection) {
    const lines = hotSection[0].split('\n').filter(l => l.startsWith('|') && l.includes('|') && !l.includes('---'));
    keywordData.hot = lines.map(l => {
      const parts = l.split('|').map(p => p.trim()).filter(p => p);
      return { keyword: parts[0], example: parts[1] };
    }).filter(k => k.keyword && k.keyword.length > 0 && k.keyword !== '키워드');
  }
  if (industrySection) {
    const lines = industrySection[0].split('\n').filter(l => l.startsWith('|') && l.includes('|') && !l.includes('---'));
    keywordData.industry = lines.map(l => {
      const parts = l.split('|').map(p => p.trim()).filter(p => p);
      return { industry: parts[0], keywords: parts[1] };
    }).filter(k => k.industry && k.industry.length > 0 && k.industry !== '업종');
  }
} catch (e) {
  console.warn('키워드 파일 로드 실패:', e.message);
}

function generateTopicProposals() {
  const topics = [];
  const templates = [
    { theme: '시즌', items: keywordData.season.slice(0, 5) },
    { theme: '트렌드', items: keywordData.hot.slice(0, 5) },
  ];

  templates.forEach(t => {
    t.items.forEach(item => {
      if (item.example) {
        topics.push({ title: item.example.replace(/["']/g, ''), keyword: item.keyword, theme: t.theme, reason: `${item.keyword} 검색량이 높은 시즌입니다.` });
      } else if (item.keyword) {
        topics.push({ title: `${item.keyword} — 영상 마케팅으로 준비하는 법`, keyword: item.keyword, theme: t.theme, reason: '시즌/트렌드 키워드 기반 주제입니다.' });
      }
    });
  });

  keywordData.industry.forEach(ind => {
    const industryName = ind.industry;
    const kw = (ind.keywords || '').split(',')[0].trim();
    topics.push({ title: `${industryName} 영상 마케팅, ${kw ? kw + ' 시즌 대비' : '시즌 준비'} 체크리스트`, keyword: kw || `${industryName} 마케팅`, theme: '업종', reason: `${industryName} 업종의 시즌 마케팅 수요가 높습니다.` });
  });

  // 기존 블로그 글 로드 (중복 방지)
  let existingTitles = [];
  try {
    const backupPath = path.join(__dirname, '..', 'backup', 'aicut_blog_posts.json');
    if (fs.existsSync(backupPath)) {
      existingTitles = JSON.parse(fs.readFileSync(backupPath, 'utf8')).map(p => p.title);
    }
    const dbAssets = store.getAllAssets();
    dbAssets.forEach(a => { if (a.title) existingTitles.push(a.title); });
  } catch(e) {}

  function isDuplicate(title) {
    // 공통 마케팅 용어 (중복 판단에서 제외)
    const commonWords = ['영상', '마케팅', '편집', '시즌', '체크리스트', '대비', '필요', '이유', '방법', '시작', '준비', '전략', '관리', '콘텐츠', '숏폼', 'SNS'];
    const clean = title.replace(/[^\w\s가-힣]/g, ' ');
    const words = clean.split(/\s+/).filter(w => w.length >= 2 && !commonWords.includes(w));
    if (words.length === 0) return false;
    for (const et of existingTitles) {
      const cleanET = et.replace(/[^\w\s가-힣]/g, ' ');
      let matchCount = 0;
      for (const w of words) {
        if (cleanET.includes(w)) matchCount++;
      }
      if (matchCount / words.length >= 0.6) return true;
    }
    return false;
  }

  const unique = [];
  const seen = new Set();
  for (const t of topics) {
    const key = t.title.substring(0, 15);
    if (!seen.has(key) && !isDuplicate(t.title) && unique.length < 5) {
      seen.add(key);
      unique.push(t);
    }
  }

  if (unique.length < 5) {
    const allTopics = [
      ...keywordData.season.slice(0, 5).map(k => ({ title: k.example || k.keyword, keyword: k.keyword, theme: '시즌', reason: '' })),
      ...keywordData.hot.slice(0, 5).map(k => ({ title: k.example || k.keyword, keyword: k.keyword, theme: '트렌드', reason: '' })),
    ];
    for (const t of allTopics) {
      const key = t.title.substring(0, 15);
      if (!seen.has(key) && !isDuplicate(t.title) && unique.length < 5) {
        seen.add(key);
        unique.push(t);
      }
      if (unique.length >= 5) break;
    }
  }

  return unique;
}

function generateKeywordStrategy(selectedTopic) {
  const seasonKws = keywordData.season.map(k => k.keyword).filter(Boolean).slice(0, 3);
  const hotKws = keywordData.hot.map(k => k.keyword).filter(Boolean).slice(0, 3);
  const indKws = keywordData.industry.map(k => (k.keywords || '').split(',')[0].trim()).filter(Boolean).slice(0, 3);
  const mainKeyword = seasonKws[0] || '영상 마케팅';
  const subKeywords = [...new Set([...seasonKws, ...hotKws, ...indKws])].slice(0, 6);
  return { main_keyword: mainKeyword, sub_keywords: subKeywords, seo_score: 75, title_suggestion: `${mainKeyword} — 업종별 영상 마케팅 체크리스트`, tags: [...subKeywords, '영상편집', '에이컷'].slice(0, 10) };
}

async function writeDraft(asset) {
  console.log('본문 작성 중...');
  const stepData = asset.step_data || {};
  const topic = stepData.selected_topic || asset.title || '블로그 주제';
  const htmlFile = path.join(__dirname, '..', 'aicut_blog_auto_draft.html');
  const html = generateDraftHtml(topic, stepData.keyword_strategy);
  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log('  HTML 저장:', htmlFile);

  let imageFiles = [];
  try {
    const { makeImage } = require('../skills/image_gen');
    process.env.CDP_PORT = '9224';
    const CTA = 'AICUT 무료상담 →';
    const defs = [
      { theme: 'dark_purple', badge: '여름 시즌 마케팅', main: '업종별\n<em>영상 마케팅</em>\n체크리스트\n한눈에 보기', sub: '병원·부동산·이커머스·프랜차이즈', out: 'aicut_auto_main.png', width: 700, height: 700, cta: CTA },
      { theme: 'light_cyan', badge: '키워드 전략', main: '<em>SEO 최적화</em>\n핵심 키워드\n전략 분석', sub: '메인 키워드·서브 키워드·해시태그', out: 'aicut_auto_kw.png', width: 800, height: 450, cta: CTA },
      { theme: 'dark_green', badge: '업종별 전략', main: '병원·부동산·이커머스\n<em>맞춤 마케팅</em>\n전략 제안', sub: '시즌 키워드 기반 업종별 접근법', out: 'aicut_auto_target.png', width: 800, height: 450, cta: CTA },
      { theme: 'light_pink', badge: 'SEO 점수', main: '블로그 SEO\n<em>최적화</em>\n체크리스트', sub: '제목·본문·이미지·해시태그 종합 점검', out: 'aicut_auto_seo.png', width: 800, height: 450, cta: CTA },
      { theme: 'dark_purple', badge: '에이컷', main: '여름 시즌\n<em>영상편집 아웃소싱</em>\n지금 시작하세요', sub: '카톡: pf.kakao.com/_GIesX/chat', out: 'aicut_auto_cta.png', width: 800, height: 450, cta: CTA },
    ];
    for (const def of defs) {
      def.main = def.main.replace(/n/g, '\n');
      const r = await makeImage(def);
      imageFiles.push(r.file);
    }
  } catch (err) {
    console.warn('이미지 생성 실패:', err.message);
  }
  return { htmlFile, imageFiles };
}

function generateDraftHtml(topic, kwStrategy) {
  const kw = kwStrategy || { main_keyword: '영상 마케팅', sub_keywords: [], tags: [] };
  const allTags = [...new Set([...kw.tags, '영상편집외주', '에이컷', '숏폼마케팅', '영상마케팅', '콘텐츠마케팅', 'SNS마케팅', '릴스제작', '유튜브쇼츠', '틱톡마케팅', '마케팅전략', '하반기준비', '블로그마케팅', 'SEO최적화', '키워드전략', '업종별마케팅'])].slice(0, 30).map(t => '#' + t).join(' ');
  return `<p style="text-align: center;">${topic}에 대해 이야기해볼게요.</p>
<p style="text-align: center;"> </p>
<p style="text-align: center;">많은 분들이 이렇게 말씀하십니다.</p>
<p style="text-align: center;">"${kw.main_keyword}, 도대체 어떻게 시작해야 할지 모르겠어."</p>
<p style="text-align: center;">오늘은 그 고민을 한 번에 해결해 드릴게요.</p>
<br>
<h2 style="text-align: center;">${kw.main_keyword}이 중요한 이유</h2>
<p style="text-align: center;">지금이 ${kw.main_keyword}을 준비해야 할 가장 중요한 타이밍입니다.</p>
${kw.sub_keywords.map(k => '<p style="text-align: center;"><strong>' + k + '</strong> — 검색량 상승 중인 핵심 키워드</p>').join('\n')}
<br>
<h2 style="text-align: center;">SEO 최적화 포인트</h2>
<p style="text-align: center;">제목에 메인 키워드를 앞쪽에 배치</p>
<p style="text-align: center;">H2/H3 태그로 콘텐츠 구조화</p>
<p style="text-align: center;">모바일 최적화 (짧은 문단, 2~3줄)</p>
<p style="text-align: center;">해시태그 30개 (시즌+핫 키워드 혼합)</p>
<br>
<h2 style="text-align: center;">영상 편집 아웃소싱이 답이다</h2>
<p style="text-align: center;">직접 편집하려면 시간이 너무 많이 듭니다.</p>
<p style="text-align: center;">에이컷은 월 정기 납품 방식으로 부담 없이 시작할 수 있습니다.</p>
<br>
<h2 style="text-align: center;">지금 바로 무료 상담</h2>
<p style="text-align: center;">카카오톡 채널: <a href="https://pf.kakao.com/_GIesX/chat" target="_blank">pf.kakao.com/_GIesX/chat</a></p>
<p style="text-align: center;">이메일: <a href="mailto:master@aicut.co.kr">master@aicut.co.kr</a></p>
<p style="text-align: center;">홈페이지: <a href="https://aicut.co.kr" target="_blank">aicut.co.kr</a></p>
<br>
<p style="text-align: center;">${allTags}</p>`;
}

async function main() {
  const args = process.argv.slice(2);
  const isNew = args.includes('--new');
  const isStatus = args.includes('--status');

  const pending = store.getNextPendingAction();
  if (pending && !isNew && !isStatus) {
    console.log('대기 중:', pending.action_type, '-', pending.asset_title);
    return;
  }

  if (isNew) {
    const topics = generateTopicProposals();
    const assetId = store.createAsset(topics[0]?.title || '새 블로그 포스트');
    store.updateAssetStatus(assetId, 'topic_proposed', { proposed_topics: topics });
    store.createPendingAction(assetId, 'topic_approval', { topics });
    console.log('새 포스트 생성 완료 (ID:', assetId + ')');
    console.log('주제 후보', topics.length + '개:');
    topics.forEach((t, i) => console.log('  ' + (i+1) + '.', t.title));
    return;
  }

  if (isStatus) {
    const all = store.getAllAssets();
    console.log('전체 포스트:', all.length + '건');
    all.forEach(a => console.log('  [' + a.id + ']', a.title, '→', a.status));
    return;
  }

  const assets = store.getAllAssets();
  const statusOrder = ['topic_proposed', 'topic_approved', 'keyword_proposed', 'keyword_approved', 'draft_writing', 'draft_review'];
  let processed = false;

  for (const status of statusOrder) {
    const candidates = assets.filter(a => a.status === status);
    for (const asset of candidates) {
      if (store.getPendingActionByAsset(asset.id)) continue;
      await processAsset(asset);
      processed = true;
      break;
    }
    if (processed) break;
  }

  if (!processed) console.log('처리할 포스트가 없습니다.');
  store.close();
}

async function processAsset(asset) {
  const stepData = asset.step_data || {};
  console.log('처리:', asset.id, asset.title, '→ 현재:', asset.status);

  switch (asset.status) {
    case 'topic_proposed': {
      const topics = generateTopicProposals();
      stepData.proposed_topics = topics;
      store.updateAssetStatus(asset.id, 'topic_proposed', stepData);
      store.createPendingAction(asset.id, 'topic_approval', { topics });
      console.log('주제 후보', topics.length + '개 제안 완료');
      break;
    }
    case 'topic_approved': {
      const selectedTopic = stepData.selected_topic || asset.title;
      const kwStrategy = generateKeywordStrategy(selectedTopic);
      stepData.keyword_strategy = kwStrategy;
      store.updateAssetStatus(asset.id, 'keyword_proposed', stepData);
      store.createPendingAction(asset.id, 'keyword_approval', { keyword_strategy: kwStrategy });
      console.log('키워드 전략 제안 완료 - 메인:', kwStrategy.main_keyword);
      break;
    }
    case 'keyword_approved': {
      stepData.draft_status = 'writing';
      store.updateAssetStatus(asset.id, 'draft_writing', stepData);
      try {
        const draft = await writeDraft(asset);
        stepData.draft_html_file = draft.htmlFile;
        stepData.draft_images = draft.imageFiles;
        stepData.draft_status = 'complete';
        store.updateAssetStatus(asset.id, 'draft_review', stepData);
        store.createPendingAction(asset.id, 'draft_approval', {
          has_html: true,
          image_count: draft.imageFiles.length,
          file: draft.htmlFile
        });
        console.log('본문 + 이미지 작성 완료');
      } catch (err) {
        stepData.draft_status = 'error';
        stepData.draft_error = err.message;
        store.updateAssetStatus(asset.id, 'draft_writing', stepData);
      }
      break;
    }
    default:
      console.log('처리 불가:', asset.status);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('오류:', err.message);
    store.close();
    process.exit(1);
  });
}

module.exports = { main, generateTopicProposals, generateKeywordStrategy, writeDraft };

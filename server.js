/**
 * 에이컷 마케팅 대시보드 API 서버
 * 
 * SQLite 데이터를 REST API로 제공
 * localhost:3001 실행
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const store = require('./db/store');

// Initialize database
store.init();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({origin:true}));
app.use(express.json());

/** GET /api/data — 채널 데이터 조회
 *  Query params:
 *    channel  (optional) — 특정 채널만 조회 (예: naver)
 *    metric   (optional) — 특정 메트릭만 조회 (예: impressions)
 */
app.get('/api/data', (req, res) => {
  try {
    const { channel, metric } = req.query;

    if (channel && metric) {
      // 특정 채널 + 특정 메트릭
      const row = store.get(channel, metric);
      if (row) {
        return res.json({ channel, metric, data: row });
      }
      return res.status(404).json({ error: 'Data not found', channel, metric });
    }

    if (channel) {
      // 특정 채널의 모든 메트릭
      const rows = store.get(channel);
      const syncAt = store.getLatestSyncAt(channel);
      return res.json({ channel, data: rows, last_sync: syncAt });
    }

    // 전체 데이터
    const all = store.getAll();
    return res.json({ data: all });

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

/** GET /api/data/:channel — 특정 채널 데이터 (RESTful) */
app.get('/api/data/:channel', (req, res) => {
  const { channel } = req.params;
  try {
    const rows = store.get(channel);
    const syncAt = store.getLatestSyncAt(channel);
    res.json({ channel, data: rows, last_sync: syncAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/health — 서버 상태 확인 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ================================================================
// 블로그 콘텐츠 파이프라인 API
// ================================================================

/** GET /api/blog/assets — 콘텐츠 자산 목록 */
app.get('/api/blog/assets', (req, res) => {
  const { status } = req.query;
  res.json({ data: store.getAllAssets(status || null) });
});

/** DELETE /api/blog/assets/:id — 콘텐츠 자산 삭제 */
app.delete('/api/blog/assets/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = store.getAsset(id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    store.deleteAsset(id);
    res.json({ success: true, asset_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/blog/assets/:id — 특정 자산 상세 */
app.get('/api/blog/assets/:id', (req, res) => {
  const asset = store.getAsset(Number(req.params.id));
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  const actions = store.getActionsByAsset(asset.id);
  res.json({ data: asset, actions });
});

/** GET /api/blog/pending — 대기 중인 승인 요청 */
app.get('/api/blog/pending', (req, res) => {
  const action = store.getNextPendingAction();
  res.json({ data: action });
});

/** POST /api/blog/approve — 승인 처리 */
app.post('/api/blog/approve', (req, res) => {
  const { actionId, assetId, selected_topic } = req.body;
  if (!actionId || !assetId) return res.status(400).json({ error: 'actionId and assetId required' });

  const action = store.getPendingActionByAsset(assetId);
  if (!action || action.id !== actionId) return res.status(404).json({ error: 'Action not found' });

  const asset = store.getAsset(assetId);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const stepData = asset.step_data || {};
  let nextStatus = asset.status;

  switch (action.action_type) {
    case 'topic_approval':
      nextStatus = 'topic_approved';
      // 선택된 주제가 있으면 저장
      if (selected_topic) {
        stepData.selected_topic = selected_topic;
        // asset title도 선택된 주제로 업데이트
        stepData._title = selected_topic;
      }
      break;
    case 'keyword_approval':
      nextStatus = 'keyword_approved';
      break;
    case 'draft_approval':
      nextStatus = 'draft_approved';
      break;
    default:
      return res.status(400).json({ error: 'Unknown action type' });
  }

  store.resolvePendingAction(actionId, 'approved', null);
  store.updateAssetStatus(assetId, nextStatus, stepData);

  res.json({ success: true, asset_id: assetId, new_status: nextStatus });
});

/** POST /api/blog/reject — 반려 처리 */
app.post('/api/blog/reject', (req, res) => {
  const { actionId, assetId, feedback } = req.body;
  if (!actionId || !assetId) return res.status(400).json({ error: 'actionId and assetId required' });

  const action = store.getPendingActionByAsset(assetId);
  if (!action || action.id !== actionId) return res.status(404).json({ error: 'Action not found' });

  store.resolvePendingAction(actionId, 'rejected', feedback || null);

  res.json({ success: true, asset_id: assetId, feedback });
});

/** POST /api/blog/new — 새 포스트 생성 (blog.js --new 실행) */
app.post('/api/blog/new', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const out = execSync('node channels/blog.js --new', {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 30000
    });
    res.json({ success: true, output: out });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/** GET /api/blog/draft/:id — 본문 미리보기 (파일에서 읽어서 반환) */
app.get('/api/blog/draft/:id', (req, res) => {
  try {
    const asset = store.getAsset(Number(req.params.id));
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const sd = asset.step_data || {};
    const filePath = sd.draft_html_file;
    if (!filePath) return res.json({ preview: '본문 파일 경로가 없습니다.' });

    const fs = require('fs');
    if (!fs.existsSync(filePath)) return res.json({ preview: '본문 파일을 찾을 수 없습니다.' });

    const fullHtml = fs.readFileSync(filePath, 'utf8');
    // HTML 태그 제거 후 텍스트만 추출 (미리보기용)
    const text = fullHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const preview = text.substring(0, 500);
    res.json({ preview, full_length: text.length, full_html: fullHtml });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/blog/process — blog.js 실행 (다음 단계 자동 진행) */
app.post('/api/blog/process', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const out = execSync('node channels/blog.js', {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 120000
    });
    res.json({ success: true, output: out });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ 마케팅 대시보드 API 서버 실행 중`);
  console.log(`   http://127.0.0.1:${PORT}/api/health`);
  console.log(`   http://127.0.0.1:${PORT}/api/data`);
  console.log(`   http://127.0.0.1:${PORT}/api/data?channel=naver`);
});

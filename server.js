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

app.use(cors());
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

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ 마케팅 대시보드 API 서버 실행 중`);
  console.log(`   http://127.0.0.1:${PORT}/api/health`);
  console.log(`   http://127.0.0.1:${PORT}/api/data`);
  console.log(`   http://127.0.0.1:${PORT}/api/data?channel=naver`);
});

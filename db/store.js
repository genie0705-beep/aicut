const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'channel_data.db');

let db = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

/** Initialize database and create tables if not exist */
function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  getDb().exec(schema);
}

/** Upsert a metric value for a channel. Returns the row id. */
function upsert(channel, metric, value, source, metadata) {
  const syncedAt = new Date().toISOString();
  const stmt = getDb().prepare(`
    INSERT INTO channel_data (channel, metric, value, source, synced_at, metadata)
    VALUES (@channel, @metric, @value, @source, @synced_at, @metadata)
  `);
  const result = stmt.run({
    channel,
    metric,
    value,
    source: source || 'mock',
    synced_at: syncedAt,
    metadata: metadata ? JSON.stringify(metadata) : null
  });
  return result.lastInsertRowid;
}

/** Get the latest value for a specific channel + metric */
function get(channel, metric) {
  if (metric) {
    return getDb().prepare(`
      SELECT * FROM channel_data
      WHERE channel = ? AND metric = ?
      ORDER BY id DESC LIMIT 1
    `).get(channel, metric);
  }
  // Get all metrics for a channel, latest value per metric
  return getDb().prepare(`
    SELECT cd.* FROM channel_data cd
    INNER JOIN (
      SELECT channel, metric, MAX(id) as max_id
      FROM channel_data
      WHERE channel = ?
      GROUP BY metric
    ) latest ON cd.id = latest.max_id
    ORDER BY cd.metric
  `).all(channel);
}

/** Get all data, optionally filtered by channel */
function getAll(channel) {
  if (channel) {
    return getDb().prepare(`
      SELECT cd.* FROM channel_data cd
      INNER JOIN (
        SELECT channel, metric, MAX(id) as max_id
        FROM channel_data
        WHERE channel = ?
        GROUP BY metric
      ) latest ON cd.id = latest.max_id
      ORDER BY cd.metric
    `).all(channel);
  }
  return getDb().prepare(`
    SELECT cd.* FROM channel_data cd
    INNER JOIN (
      SELECT channel, metric, MAX(id) as max_id
      FROM channel_data
      GROUP BY channel, metric
    ) latest ON cd.id = latest.max_id
    ORDER BY cd.channel, cd.metric
  `).all();
}

/** Get the most recent sync timestamp for a channel */
function getLatestSyncAt(channel) {
  const row = getDb().prepare(`
    SELECT synced_at FROM channel_data
    WHERE channel = ?
    ORDER BY synced_at DESC LIMIT 1
  `).get(channel);
  return row ? row.synced_at : null;
}

// ================================================================
// 블로그 콘텐츠 파이프라인 (content_assets + pending_actions)
// ================================================================

/** 새 콘텐츠 자산 생성 */
function createAsset(title) {
  const stmt = getDb().prepare(`
    INSERT INTO content_assets (title, status, step_data)
    VALUES (@title, 'topic_proposed', @step_data)
  `);
  const r = stmt.run({ title: title || null, step_data: '{}' });
  return r.lastInsertRowid;
}

/** 단일 콘텐츠 자산 조회 (step_data 자동 파싱) */
function getAsset(id) {
  const row = getDb().prepare('SELECT * FROM content_assets WHERE id = ?').get(id);
  if (row) row.step_data = JSON.parse(row.step_data || '{}');
  return row || null;
}

/** 콘텐츠 자산 목록 조회 (status 필터 선택 가능) */
function getAllAssets(status) {
  let rows;
  if (status) {
    rows = getDb().prepare(
      'SELECT * FROM content_assets WHERE status = ? ORDER BY updated_at DESC'
    ).all(status);
  } else {
    rows = getDb().prepare(
      'SELECT * FROM content_assets ORDER BY updated_at DESC'
    ).all();
  }
  rows.forEach(r => { r.step_data = JSON.parse(r.step_data || '{}'); });
  return rows;
}

/** 콘텐츠 자산 status + step_data 업데이트 */
function updateAssetStatus(id, status, stepData) {
  const now = new Date().toISOString();
  getDb().prepare(`
    UPDATE content_assets SET status = ?, step_data = ?, updated_at = ?
    WHERE id = ?
  `).run(status, JSON.stringify(stepData || {}), now, id);
}

/** 승인 대기 중인 가장 오래된 액션 조회 */
function getNextPendingAction() {
  return getDb().prepare(`
    SELECT pa.*, ca.title as asset_title, ca.status as asset_status
    FROM pending_actions pa
    JOIN content_assets ca ON ca.id = pa.asset_id
    WHERE pa.status = 'pending'
    ORDER BY pa.created_at ASC LIMIT 1
  `).get() || null;
}

/** 특정 asset의 미해결 pending action 조회 */
function getPendingActionByAsset(assetId, actionType) {
  if (actionType) {
    return getDb().prepare(
      'SELECT * FROM pending_actions WHERE asset_id = ? AND action_type = ? AND status = \'pending\' ORDER BY id DESC LIMIT 1'
    ).get(assetId, actionType) || null;
  }
  return getDb().prepare(
    'SELECT * FROM pending_actions WHERE asset_id = ? AND status = \'pending\' ORDER BY id DESC LIMIT 1'
  ).get(assetId) || null;
}

/** 승인 요청 등록 */
function createPendingAction(assetId, actionType, proposedData) {
  const stmt = getDb().prepare(`
    INSERT INTO pending_actions (asset_id, action_type, proposed_data)
    VALUES (?, ?, ?)
  `);
  return stmt.run(assetId, actionType, JSON.stringify(proposedData || {})).lastInsertRowid;
}

/** 승인/반려 처리 */
function resolvePendingAction(id, resolution, feedback) {
  const now = new Date().toISOString();
  getDb().prepare(`
    UPDATE pending_actions SET status = ?, feedback = ?, resolved_at = ?
    WHERE id = ?
  `).run(resolution, feedback || null, now, id);
}

/** 특정 asset의 모든 action 조회 */
function getActionsByAsset(assetId) {
  return getDb().prepare(
    'SELECT * FROM pending_actions WHERE asset_id = ? ORDER BY created_at DESC'
  ).all(assetId);
}

/** 콘텐츠 자산 + 연결된 액션 삭제 */
function deleteAsset(id) {
  getDb().prepare('DELETE FROM pending_actions WHERE asset_id = ?').run(id);
  getDb().prepare('DELETE FROM content_assets WHERE id = ?').run(id);
}

/** Close the database connection */
function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  init, upsert, get, getAll, getLatestSyncAt, close,
  createAsset, getAsset, getAllAssets, updateAssetStatus, deleteAsset,
  getNextPendingAction, getPendingActionByAsset, createPendingAction,
  resolvePendingAction, getActionsByAsset
};
